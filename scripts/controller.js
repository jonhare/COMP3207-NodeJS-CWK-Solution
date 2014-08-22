var S = require('string');
var strings = require('./strings');
var db = require('../models');
var sequelize_fixtures = require('sequelize-fixtures');

/**
 * (private)
 * The list of active players [ {player: db.MUDObject, conn: ws.WebSocket} ]
 */
var activePlayers = Array();

var controller = {
	/**
	 * The default room for new players (set by #init()) [db.MUDObject].
	 */
	defaultRoom: undefined,
	/**
	 * Handle a message from a user at a given connection
	 * @param conn [ws.WebSocket] the connection
	 * @param message [string] the message typed by the user
	 */
	handleMessage: function(conn, message) {
		try {
			var firstSpace = message.indexOf(' ');
			var commandStr = firstSpace === -1 ? message.trim() : message.substring(0, firstSpace).trim();
			var argsStr = firstSpace === -1 ? "" : message.substring(firstSpace + 1).trim();
			var command = commands[commandStr];
			var isLoggedIn = controller.findActivePlayerByConnection(conn) !== undefined;

			if (commandStr.length === 0)
				return;

			if (command) {
				var argsArr = getArgs(argsStr, command.nargs);
				
				if (!isLoggedIn && command.postLogin && !command.preLogin) {
					//cant use a post-login only command if not logged in
					controller.splashScreen(conn);
				} else if (isLoggedIn && command.preLogin && !command.postLogin) {
					//cant use a pre-login only command if logged in
					controller.sendMessage(conn, strings.alreadyLoggedIn);
				} else {
					if (command.validate) {
						command.validate(conn, argsArr, command.perform);
					} else {
						command.perform(conn, argsArr);
					}
				}
			} else {
				if (isLoggedIn) {
					//delegate to the go command
					commands.go.perform(conn, [message], strings.unknownCommand);
				}
				else
					controller.splashScreen(conn);
			}
		} catch (e) {
			//if a fatal error occurred, the connection will have been closed 
			//already, and an exception raised to jump us to this point.
			console.log(e.name + ": " + e.message);
		}
	},
	activatePlayer: function(conn, player) {
		activePlayers.push({ player: player, conn: conn });
	},
	deactivatePlayer: function(conn) {
		var player = controller.findActivePlayerByConnection(conn);
		controller.broadcastExcept(conn, strings.hasDisconnected, player);

		for (var i=0; i<activePlayers.length; i++) {
			if (activePlayers[i].conn === conn) {
				activePlayers.splice(i, 1);
				break;
			}
		}

		conn.terminate();
	},
	applyToActivePlayers: function(operation) {
		for (var i=0; i<activePlayers.length; i++) {
			if (operation(activePlayers[i].conn, activePlayers[i].player) === false) {
				break;
			}
		}
	},
	/*
	 * Broadcast sends to all logged in users.
	 */
	broadcast: function(message, values) {
		controller.applyToActivePlayers(function(conn) {
			controller.sendMessage(conn, message, values);
		});
	},
	/*
	 * Broadcast sends to all logged in users, except the conn user
	 */
	broadcastExcept: function(conn, message, values) {
		controller.applyToActivePlayers(
			function(apconn) {
				if (apconn !== conn)
					controller.sendMessage(apconn, message, values);
			}
		);
	},
	/**
 	 * Send a message to all active players in the same room as the player represented by `conn` (excluding that player).
 	 * @param conn [ws.WebSocket] the connection belonging to the player whose location we're interested in
	 * @param message [String] (optional) the message to send (sends a newline if undefined). 
	 *				  The message can contain Mustache compatible `{{...}}` templates.
	 * @param values [Object] (optional) the replacement strings to insert into the template
 	 */
	sendMessageRoomExcept: function(conn, message, values) {
		var player = controller.findActivePlayerByConnection(conn);
		
		controller.applyToActivePlayers(function(otherconn, other) {
			if (other.locationId === player.locationId && player !== other) {
				controller.sendMessage(otherconn, message, values);
			}
		});
	},
	/**
	 * Sends a message to a connection (note that a newline is automatically added)
	 * @param conn [ws.WebSocket] the connection 
	 * @param message [String] (optional) the message to send (sends a newline if undefined). 
	 *				  The message can contain Mustache compatible `{{...}}` templates.
	 * @param values [Object] (optional) the replacement strings to insert into the template
	 */
	sendMessage: function(conn, message, values) {
		message = message === undefined ? '' : message;
		if (values === undefined) {
			conn.send(message);
		} else {
			conn.send(S(message).template(values).s);
		}
	},
	/**
	 * Clear the screen of the player represented by the connection
	 * @param conn [ws.WebSocket] the connection 
	 */
	clearScreen: function(conn) {
		for (var i=0; i<24; i++) {
			controller.sendMessage(conn);
		}
	},
	/**
	 * Display the splash screen and connection prompt
	 * @param conn [ws.WebSocket] the connection 
	 */
	splashScreen: function(conn) {
		controller.sendMessage(conn, strings.loginPrompt);
	},
	/**
	 * Find the active player with the given name
	 * @param name the player name
	 * @return [db.MUDObject] the player or undefined if not found
	 */
	findActivePlayerByName: function(name) {
		for (var i=0; i<activePlayers.length; i++) {
			if (activePlayers[i].player.name === name) {
				return activePlayers[i].player;
			}
		}
		return undefined;
	},
	/**
	 * Find the active player with the given connection
	 * @param conn [ws.WebSocket] the connection 
	 * @return [db.MUDObject] the player or undefined if not found
	 */
	findActivePlayerByConnection: function(conn) {
		for (var i=0; i<activePlayers.length; i++) {
			if (activePlayers[i].conn === conn) {
				return activePlayers[i].player;
			}
		}
		return undefined;
	},
	/**
	 * Find the connection for the given player
	 * @param player [db.MUDObject] the player
	 * @return [ws.WebSocket] the connection or undefined if the player is not connected
	 */
	findActiveConnectionByPlayer: function(player) {
		for (var i=0; i<activePlayers.length; i++) {
			if (activePlayers[i].player === player) {
				return activePlayers[i].conn;
			}
		}
		return undefined;
	},
	/**
	 * Initialise the controller object and database state
	 */
	init: function() {
		//setup the default location
		controller.loadMUDObject(undefined, {id: 1}, function(room) {
			if (room) {
				controller.defaultRoom = room;
			} else {
				sequelize_fixtures.loadFile('data/small.json', {MUDObject: db.MUDObject}, function() {
					controller.init();
				});
			}
		});

		//initialise the command handler
		commands = require('./commands');
	},
	createMUDObject: function(conn, obj, cb) {
		db.MUDObject.build(obj).save().complete(function(err, nobj) {
			if (!!err) {
				fatalError(err, conn);
			} else {
				cb(nobj);
			}
		});
	},
	loadMUDObject: function(conn, obj, cb) {
		db.MUDObject.find({ where : obj }).complete(function(err, dbo) {
			if (!!err) {
				fatalError(err, conn);
			} else {
				cb(dbo);
			}
		});
	},
	loadMUDObjects: function(conn, obj, cb) {
		db.MUDObject.findAll({ where : obj }).complete(function(err, dbo) {
			if (!!err) {
				fatalError(err, conn);
			} else {
				cb(dbo);
			}
		});
	},
	findPotentialMUDObjects: function(conn, name, cb, allowMe, allowHere, type) {
		var player = controller.findActivePlayerByConnection(conn);

		if (allowMe && name === 'me') {
			cb([player]);
			return;
		}

		if (allowHere && name === 'here') {
			player.getLocation().success(function(obj) {
				cb([obj]);
			});
			return;
		}

		if (type) {
			controller.loadMUDObjects(conn, 
				db.Sequelize.and(
					{name: {like: '%' + name + '%'}},
					{'type': type},
					db.Sequelize.or(
						{locationId: player.locationId},
						{locationId: player.id}
					)
				), function(objs){ cb(filterPossible(objs, name)); }
			);
		} else {
			controller.loadMUDObjects(conn, 
				db.Sequelize.and(
					{name: {like: '%' + name + '%'}},
					db.Sequelize.or(
						{locationId: player.locationId},
						{locationId: player.id}
					)
				), function(objs){ cb(filterPossible(objs, name)); }
			);
		}
	},
	findPotentialMUDObject: function(conn, name, cb, allowMe, allowHere, type, ambigMsg, failMsg) {
		if (!ambigMsg) ambigMsg = strings.ambigSet;
		if (!failMsg) failMsg = strings.dontSeeThat;

		controller.findPotentialMUDObjects(conn, name, function(obj) {
			if (obj && obj.length > 0) {
				if (obj.length === 1) {
					cb(obj[0]);
				} else {
					controller.sendMessage(conn, ambigMsg);
				}
			} else {
				controller.sendMessage(conn, failMsg);
			}
		}, allowMe, allowHere, type);
	}
};

module.exports = controller;

//Private helper functions below this point

/**
 * Parse the arguments string, trying to extract `nargs` arguments.
 * Arguments are space separated, however the last output argument 
 * could contain spaces depending on the number of spaces and `nargs`.
 * Leading and trailing whitespace is trimmed from all arguments.
 *
 * @param argsStr [string] the arguments string
 * @param nargs [number] number of expected arguments
 * @return the arguments array
 */
function getArgs(argsStr, nargs) {
	var argsArr = Array();
	var first, rest;
	var i, index;

	argsStr = argsStr.trim();

	if (argsStr.length === 0)
		return argsArr;

	if (nargs <= 1) {
		argsArr.push(argsStr);
	} else {
		rest = argsStr;
		for (i=0; i<nargs; i++) {
			index = rest.indexOf(' ');
			if (index == -1) {
				break;
			}

			first = rest.substring(0, index).trim();
			rest = rest.substring(index + 1).trim();

			argsArr.push(first);
		}
		argsArr.push(rest);
	}
	return argsArr;
}

function fatalError(err, conn) {
	if (conn) {
		conn.send("A fatal error occurred: " + err + "\n");
		conn.send("You will be disconnected immediately!\n");
		conn.terminate();
 	}
	throw {name: "FatalError", description: err};
}

function filterPossible(obj, name) {
	if (obj && obj.length > 0) {
		var farr = obj.filter(function(o) {
			if (o.name === name) return true;
			
			var strs = o.name.split(/[ ;]+/g);

			console.log(name);
			console.log(strs);

			if (strs.indexOf(name)>=0)
				return true;

			return false;
		});

		console.log(obj);
		console.log(farr);

		return farr;
	}
	return obj;
}