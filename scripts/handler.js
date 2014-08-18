var S = require('string');
var strings = require('./strings');
var db = require('../models');

var defaultRoomModel = {
	id : 1,
	type: 'ROOM',
	name: 'Starting room',
	description: "Starting room (room 1). You are standing in a fabulous, "
				+ "fabulous, exotic room, with all sorts of things that go 'hum' "
				+ "and 'plink' in the night.\n\nAs you glance around the room, "
				+ "you wonder what else might exist in this world.",
}

function isPasswordValid(str) {
	return /[!-~]+/.test(str);
}

function isUsernameValid(str) {
	return /[!-~^=]+/.test(str) && str.indexOf('=') === -1;
}

function isNameValid(str) {
	return /[!-~]+/.test(str);
}

function fatalError(err, conn) {
	if (conn) {
		conn.send("A fatal error occurred: " + err + "\n");
		conn.send("You will be disconnected immediately!\n");
		conn.terminate();
 	}
	throw {name: "FatalError", description: err};
}

function isLinkable(){
	return true;
}

function createMUDObject(conn, obj, cb) {
	db.MUDObject.build(obj).save().complete(function(err) {
		if (!!err) {
			fatalError(err, conn);
		} else {
			loadMUDObject(conn, obj, cb);
		}
	});
}

function loadMUDObject(conn, obj, cb) {
	db.MUDObject.find({ where : obj }).complete(function(err, dbo) {
		if (!!err) {
			fatalError(err, conn);
		} else {
			cb(dbo);
		}
	});
}

function loadMUDObjects(conn, obj, cb) {
	db.MUDObject.findAll({ where : obj }).complete(function(err, dbo) {
		if (!!err) {
			fatalError(err, conn);
		} else {
			cb(dbo);
		}
	});
}

function updatePropertyInternal(conn, targets, propertyName, value) {
	var me = handler.findActivePlayerByConnection(conn);

	if (!Array.isArray(targets)) 
		targets = [targets];

	for (var i=0; i<targets.length; i++) {
		var target = targets[i];

		if (me.id === target.ownerId) {
			target[propertyName] = value;
			target.save(function() {
				//do nothing
			});
		} else {
			handler.sendMessage(conn, "The object isn't owned by you");
		}
	}
}

function updateProperty(conn, targetName, propertyName, value) {
	var me = handler.findActivePlayerByConnection(conn);

	if (targetName === 'me') {
		updatePropertyInternal(conn, me, propertyName, value);
	} else if (targetName === 'here') {
		me.getLocation().success(function(loc) {
			updatePropertyInternal(conn, loc, propertyName, value);
		});
	} else {
		loadMUDObjects(conn, {name: targetName, ownerId: me.id}, function(objs) {
			if (objs) {
				updatePropertyInternal(conn, objs, propertyName, value);
			} else {
				loadMUDObjects(conn, {name: targetName, ownerId: me.id}, function(objs) {
					if (objs) {
						updatePropertyInternal(conn, objs, propertyName, value);
					} else {
						handler.sendMessage(conn, "cannot find object (or object isn't owned by you)");
					}
				});
			}
		});
	}
}

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

var MessageHandler = {
	nargs: 0,
	preLogin: false,
	postLogin: true,
	validate: function(conn, argsArr, cb) {
		if (argsArr.length == 0)
			cb(conn, argsArr);
		else
			handler.sendMessage(conn, strings.unknownCommand);
	},
	perform: function(conn, argsArr) {
		console.log("This probably should be overridden!");
	}
}

var PropertyHandler = createObject(MessageHandler, {
	prop: undefined,
	nargs: 1,
	validate: function(conn, argsArr, cb) {
		if (argsArr.length === 1)
			cb(conn, argsArr);
		else
			handler.sendMessage(conn, strings.unknownCommand);
	},
	perform: function(conn, argsArr) {
		var index = argsArr[0].indexOf("=");
		index = index==-1 ? argsArr[0].length : index;
		var targetName = argsArr[0].substring(0, index);
		var value = argsArr[0].substring(index + 1);
		//FIXME!!
		console.log(this);
		updateProperty(conn, targetName, this.prop, value);
	}
})

/*
 * Helper to create new objects with differential inheritance. Props in ext will override those in base.
 */
function createObject(base, ext) {
	var clone = Object.create(base);

	for (var prop in ext) {
		if (ext.hasOwnProperty(prop)) {
			clone[prop] = ext[prop];
		}
	}

	return clone;
}

handler = {
	activePlayers: Array(),
	activeConnections: Array(),
	defaultRoom: undefined,
	messages: {
		create: createObject(MessageHandler, {
			nargs: 2,
			preLogin: true,
			postLogin: false,
			validate: function(conn, argsArr, cb) {
				if (!isUsernameValid(argsArr[0])) {
					handler.sendMessage(conn, strings.badUsername);
					return;
				}

				if (!isPasswordValid(argsArr[1])) {
					handler.sendMessage(conn, strings.badPassword);
					return;
				}

				loadMUDObject(conn, {name: argsArr[0], type: 'PLAYER'}, function(player) {
					if (!player) {
						cb(conn, argsArr);
					} else {
						handler.sendMessage(conn, strings.usernameInUse);
					}
				});
			},
			perform: function(conn, argsArr) {
				//create a new player
				createMUDObject(conn, {name: argsArr[0], password: argsArr[1], type:'PLAYER', locationId: handler.defaultRoom.id}, function(player) {
					if (player) {
						player.setOwner(player).success(function() {
							handler.activeConnections.push(conn);
							handler.activePlayers.push(player);
							handler.broadcastExcept(conn, strings.hasConnected, player);

							handler.messages.look.perform(conn, []);
						});
					}
				});
			}
		}),
		connect: createObject(MessageHandler, {
			nargs: 2,
			preLogin: true,
			postLogin: false,
			validate: function(conn, argsArr, cb) {
				loadMUDObject(conn, {name: argsArr[0], type:'PLAYER'}, function(player) {
					if (!player) {
						handler.sendMessage(conn, strings.playerNotFound);
						return;
					}

					if (player.password !== argsArr[1]) {
						handler.sendMessage(conn, strings.incorrectPassword);
						return;
					}

					cb(conn, argsArr);
				});
			},
			perform: function(conn, argsArr) {
				//load player if possible:
				loadMUDObject(conn, {name: argsArr[0], password: argsArr[1], type:'PLAYER'}, function(player) {
					if (player) {
						for (var i=0; i<handler.activePlayers.length; i++) {
							if (handler.activePlayers[i].name === argsArr[0]) {
								//player is already connected... kick them off then rejoin them
								handler.deactivatePlayer(handler.activeConnections[i]);
								break;
							}
						}

						handler.activeConnections.push(conn);
						handler.activePlayers.push(player);
						handler.broadcastExcept(conn, strings.hasConnected, player);

						handler.messages.look.perform(conn, []);
					}
				});
			}
		}),
		QUIT: createObject(MessageHandler, {
			preLogin: true,
			perform: function(conn, argsArr) {
				handler.deactivatePlayer(conn);
			}
		}),
		say: createObject(MessageHandler, {
			nargs: 1,
			validate: function(conn, argsArr, cb) {
				cb(conn, argsArr);
			},
			perform: function(conn, argsArr) {
				var message = argsArr.length==0 ? "" : argsArr[0];

				handler.sendMessage(conn, strings.youSay, {message: message});

				var me = handler.findActivePlayerByConnection(conn);
				for (var i=0; i<handler.activeConnections.length; i++) {
					var other = handler.activePlayers[i];

					if (other.location === me.location && me !== other) {
  						handler.sendMessage(handler.activeConnections[i], strings.says, {name: me.name, message: message});
  					}
  				}
  			}
		}),
		whisper: createObject(MessageHandler, {
			nargs: 1,
			validate: function(conn, argsArr, cb) {
				if (argsArr.length === 1 && argsArr[0].indexOf("=")>0)
					cb(conn, argsArr);
				else
					handler.sendMessage(conn, strings.unknownCommand);
			},
			perform: function(conn, argsArr) {
				var index = argsArr[0].indexOf("=");
				var targetName = argsArr[0].substring(0, index);
				var message = argsArr[0].substring(index + 1);
				
				var me = handler.findActivePlayerByConnection(conn);
				var target = handler.findActivePlayerByName(targetName);
				var targetConn = handler.findActiveConnectionByPlayer(target);
				if (target && target.location === me.location) {
					handler.sendMessage(conn, strings.youWhisper, {message: message, name: target.name});
					handler.sendMessage(targetConn, strings.toWhisper, {message: message, name: me.name});

					for (var i=0; i<handler.activeConnections.length; i++) {
						var other = handler.activePlayers[i];

						if (other.location === me.location && me !== other && target !== other) {
							//1 in 10 chance that someone will hear what you whispered!
							if (Math.random() < 0.9) {
  								handler.sendMessage(handler.activeConnections[i], strings.whisper, {fromName: me.name, toName: target.name});
  							} else {
  								handler.sendMessage(handler.activeConnections[i], strings.overheard, {fromName: me.name, toName: target.name, message: message});
  							}
  						}
					}
				} else {
					handler.sendMessage(conn, strings.notInRoom, {name: target});
				}
			}
		}),
		WHO: createObject(MessageHandler, {
			preLogin: true,
			perform: function(conn, argsArr) {
				for (var i=0; i<handler.activePlayers.length; i++) {
					if (handler.activeConnections[i] !== conn) {
						handler.sendMessage(conn, handler.activePlayers[i].name);
					}
				}
			}
		}),
		go: createObject(MessageHandler, {
			nargs: 1,
			validate: function(conn, argsArr, cb) {
				if (argsArr.length == 1 && (
					argsArr[0] === 'n' || argsArr[0] === 'north' ||
					argsArr[0] === 'e' || argsArr[0] === 'east' ||
					argsArr[0] === 's' || argsArr[0] === 'south' ||
					argsArr[0] === 'w' || argsArr[0] === 'west')) {
					argsArr[0] = argsArr[0].substring(0, 1);
					cb(conn, argsArr);
				} else {
					handler.sendMessage(conn, strings.unknownCommand);
				}
			},
			perform: function(conn, argsArr) {
				handler.sendMessage(conn, "Going " + argsArr[0])
  			}
		}),
		north: createObject(MessageHandler, {
			perform: function(conn, argsArr) {
				handler.messages.go.perform(conn, ["n"]);
  			}
		}),
		east: createObject(MessageHandler, {
			perform: function(conn, argsArr) {
				handler.messages.go.perform(conn, ["e"]);
  			}
		}),
		south: createObject(MessageHandler, {
			perform: function(conn, argsArr) {
				handler.messages.go.perform(conn, ["s"]);
  			}
		}),
		west: createObject(MessageHandler, {
			perform: function(conn, argsArr) {
				handler.messages.go.perform(conn, ["w"]);
  			}
		}),
		look: createObject(MessageHandler, {
			nargs: 1,
			validate: function(conn, argsArr, cb) {
				if (argsArr.length <= 1)
					cb(conn, argsArr);
				else
					handler.sendMessage(conn, strings.unknownCommand);
			},
			perform: function(conn, argsArr) {
				var player = handler.findActivePlayerByConnection(conn);

				if (argsArr.length === 0 || argsArr[0].length===0) {
					player.getLocation().success(function(room) {
						handler.messages.look.lookRoom(conn, room);
					});
				} else {
					loadMUDObject(conn, {name: argsArr[0]}, function(obj) {
						if (obj) {
							if (obj.id === player.locationId) {
								handler.messages.look.lookRoom(conn, obj);
								return;
							} else if (obj.locationId === player.locationId) {
								handler.messages.look.lookObject(conn, obj);
								return;
							}
						}

						handler.sendMessage(conn, strings.dontSeeThat, obj ? obj : {name: argsArr[0]});
					});
				}
			},
			lookRoom: function(conn, room) {
				handler.messages.look.lookObject(conn, room);
				handler.sendMessage(conn, "");
				handler.sendMessage(conn, strings.peopleHere);
				for (var i=0; i<handler.activePlayers.length; i++) {
					if (handler.activePlayers[i].locationId === room.id) {
						handler.sendMessage(conn, handler.activePlayers[i].name);
					}
				}
				handler.sendMessage(conn, "");
				handler.sendMessage(conn, strings.youSee);
			},
			lookObject: function(conn, obj) {
				handler.sendMessage(conn, obj.name);
				handler.sendMessage(conn, "");
				handler.sendMessage(conn, obj.description);
			}
		}),
		"@dig": createObject(PropertyHandler, {
			perform: function(conn, argsArr) {
				if (isNameValid(argsArr[0])) {
					//create a new room
					createMUDObject(conn, {name: argsArr[0], type:'ROOM'}, function(room) {
						if (room) {
							handler.sendMessage(conn, strings.roomCreated, room);
						}
					});
				} else {
					handler.sendMessage(conn, strings.invalidName);
				}
			}
		}),
		"@describe": createObject(PropertyHandler, {
			prop: 'description'
		}),
		"@success": createObject(PropertyHandler, {
			prop: 'successMessage'
		}),
		"@osuccess": createObject(PropertyHandler, {
			prop: 'otherSuccessMessage'
		}),
		"@failure": createObject(PropertyHandler, {
			prop: 'failureMessage'
		}),
		"@ofailure": createObject(PropertyHandler, {
			prop: 'otherFailureMessage'
		}),
		"@open": createObject(PropertyHandler, {
			perform: function(conn, argsArr) {
				var player = handler.findActivePlayerByConnection(conn);

				var index = argsArr[0].indexOf("=");
				var targetName = argsArr[0].substring(0, index);
				var value = argsArr[0].substring(index + 1);

				player.getLocation().success(function(loc) {
					if (isLinkable(loc, player)) {
						loc.getExits({ where : {name: value}}).success(function(exits) {
							if (!exits || exits.length === 0) {
								createObject(conn, {name: value, type: 'EXIT'}, function(exit) {
									loc.addExit(exit).success(function() {
										//do nothing
										console.log("Exit created");
									});
								});
							} else {
								handler.sendMessage("Exit already exists");
							}
						});
					} else {
						handler.sendMessage("Cannot open exit here");
					}
				});
			}
		}),
	},
	handleMessage: function(conn, message) {
		try {
			var firstSpace = message.indexOf(' ');
			var commandStr = firstSpace === -1 ? message.trim() : message.substring(0, firstSpace).trim();
			var argsStr = firstSpace === -1 ? "" : message.substring(firstSpace + 1).trim();
			var command = handler.messages[commandStr];
			var isLoggedIn = handler.activeConnections.indexOf(conn) !== -1;

			if (commandStr.length === 0)
				return;

			if (command) {
				var argsArr = getArgs(argsStr, command.nargs);
				
				if (!isLoggedIn && command.postLogin && !command.preLogin) {
					//cant use a post-login only command if not logged in
					handler.sendMessage(conn, strings.unknownCommand);
				} else if (isLoggedIn && command.preLogin && !command.postLogin) {
					//cant use a pre-login only command if logged in
					handler.sendMessage(conn, strings.alreadyLoggedIn);
				} else {
					if (command.validate) {
						command.validate(conn, argsArr, command.perform);
					} else {
						command.perform(conn, argsArr);
					}
				}
			} else {
				if (isLoggedIn)
					handler.sendMessage(conn, strings.unknownCommand);
				else
					handler.splashScreen(conn);
			}
		} catch (e) {
			//if a fatal error occurred, the connection will have been closed 
			//already, and an exception raised to jump us to this point.
			console.log(e.name + ": " + e.message);
		}
	},
	deactivatePlayer: function(conn) {
		var index = handler.activeConnections.indexOf(conn);
		if (index > -1) {
			var player = handler.activePlayers[index];

			handler.activeConnections.splice(index, 1);
			handler.activePlayers.splice(index, 1);
			conn.terminate();

			handler.broadcast(strings.hasDisconnected, player);
		}
	},
	/*
	 * Broadcast sends to all logged in users.
	 */
	broadcast: function(message, values) {
		for (var i=0; i<handler.activeConnections.length; i++) {
  			handler.sendMessage(handler.activeConnections[i], message, values);
		}
	},
	/*
	 * Broadcast sends to all logged in users, except the conn user
	 */
	broadcastExcept: function(conn, message, values) {
		for (var i=0; i<handler.activeConnections.length; i++) {
			if (handler.activeConnections[i] !== conn)
  				handler.sendMessage(handler.activeConnections[i], message, values);
		}
	},
	/*
	 * Sends a message to a connection, adding a newline automatically
	 */
	sendMessage: function(conn, message, values) {
		if (values === undefined) 
			conn.send(message);
		else
			conn.send(S(message).template(values).s);
		conn.send("\n");
	},
	splashScreen: function(conn) {
		handler.sendMessage(conn, strings.loginPrompt);
	},
	findActivePlayerByName: function(name) {
		for (var i=0; i<handler.activePlayers.length; i++) {
			if (handler.activePlayers[i].name === name) {
				return handler.activePlayers[i];
			}
		}
		return undefined;
	},
	findActivePlayerByConnection: function(conn) {
		return handler.activePlayers[handler.activeConnections.indexOf(conn)];
	},
	findActiveConnectionByPlayer: function(player) {
		return handler.activeConnections[handler.activePlayers.indexOf(player)];
	},
	startup: function() {
		//setup the default location
		db.MUDObject.count().success(function(c) {
  			if (c == 0) {
  				createMUDObject(undefined, defaultRoomModel, function(room) {
  					handler.defaultRoom = room;
  				});
  			} else {
  				loadMUDObject(undefined, {id: 1}, function(room){
  					handler.defaultRoom = room;
  				});
  			}
		});

		//command aliases
		handler.messages['goto'] = handler.messages.go;
		handler.messages.move = handler.messages.go;
		handler.messages.n = handler.messages.north;
		handler.messages.e = handler.messages.east;
		handler.messages.s = handler.messages.south;
		handler.messages.w = handler.messages.west;
	}
};

module.exports = handler;
