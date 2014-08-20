var S = require('string');
var strings = require('./strings');
var db = require('../models');
var commands = require('./commands');

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
				if (isLoggedIn) 
					controller.sendMessage(conn, strings.unknownCommand);
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
		controller.broadcastExcept(conn, strings.hasDisconnected, activePlayers[i].player);
		
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
		db.MUDObject.find({type: 'ROOM'}).complete(function(err, room) {
			if (!!err)
				throw {name: "FatalError", description: err};

			if (room) {
				controller.defaultRoom = room;
			} else {
				db.MUDObject.build({ type: 'ROOM', name: strings.defaultRoomName, description:  strings.defaultRoomDescription }).save().complete(function(err, room) {
					if (!!err) {
						throw {name: "FatalError", description: err};
					} else {
						controller.defaultRoom = room;
					}
				});
			}
		});

		//initialise the command handler
		commands = commands(controller);
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

