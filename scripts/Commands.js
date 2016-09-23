/**
 * scripts/Commands.js
 * 
 * This file provides the main game logic; unfortunately it's 
 * not complete so you'll need to finish it!
 *
 * @author Jonathon Hare (jsh2@ecs.soton.ac.uk)
 * @author ...
 */
var db = require('../models');
var controller = require('./Controller');
var predicates = require('./Predicates');
var strings = require('./Strings');
var CommandHandler = require('./CommandHandler');
var PropertyHandler = require('./PropertyHandler');
var bfs = require('async-bfs');

/**
 * The commands object is like a map of control strings (the commands detailed 
 * in the ECS-MUD guide) to command handlers (objects extending from the 
 * CommandHandler object) which perform the actions of the required command.
 * 
 * The controller (see Controller.js) parses the statements entered by the user,
 * and passes the information to the matching property in the commands object.
 */
var commands = {
	//handle user creation
	create: CommandHandler.extend({
		nargs: 2,
		preLogin: true,
		postLogin: false,
		validate: function(conn, argsArr, cb) {
			if (!predicates.isUsernameValid(argsArr[0])) {
				controller.sendMessage(conn, strings.badUsername);
				return;
			}

			if (!predicates.isPasswordValid(argsArr[1])) {
				controller.sendMessage(conn, strings.badPassword);
				return;
			}

			controller.loadMUDObject(conn, {name: argsArr[0], type: 'PLAYER'}, function(player) {
				if (!player) {
					cb(conn, argsArr);
				} else {
					controller.sendMessage(conn, strings.usernameInUse);
				}
			});
		},
		perform: function(conn, argsArr) {
			//create a new player
			controller.createMUDObject(conn,
				{
					name: argsArr[0],
					password: argsArr[1],
					type:'PLAYER',
					locationId: controller.defaultRoom.id,
					targetId: controller.defaultRoom.id
				}, function(player) {
				if (player) {
					player.setOwner(player).then(function() {
						//resync with db to ensure all fields set correctly
						player.reload().then(function(){
							controller.activatePlayer(conn, player);
							controller.broadcastExcept(conn, strings.hasConnected, player);

							controller.clearScreen(conn);
							commands.look.perform(conn, []);
						});
					});
				}
			});
		}
	}),
	//handle connection of an existing user
	connect: CommandHandler.extend({
		nargs: 2,
		preLogin: true,
		postLogin: false,
		validate: function(conn, argsArr, cb) {
			controller.loadMUDObject(conn, {name: argsArr[0], type:'PLAYER'}, function(player) {
				if (!player) {
					controller.sendMessage(conn, strings.playerNotFound);
					return;
				}

				if (player.password !== argsArr[1]) {
					controller.sendMessage(conn, strings.incorrectPassword);
					return;
				}

				cb(conn, argsArr);
			});
		},
		perform: function(conn, argsArr) {
			//load player if possible:
			controller.loadMUDObject(conn, {name: argsArr[0], password: argsArr[1], type:'PLAYER'}, function(player) {
				if (player) {
					controller.applyToActivePlayers(function(apconn, ap) {
						if (ap.name === argsArr[0]) {
							//player is already connected... kick them off then rejoin them
							controller.deactivatePlayer(apconn);
							return false;
						}
					});

					controller.activatePlayer(conn, player);
					controller.broadcastExcept(conn, strings.hasConnected, player);

					controller.clearScreen(conn);
					commands.look.perform(conn, []);
				}
			});
		}
	}),
	//Disconnect the player
	QUIT: CommandHandler.extend({
		preLogin: true,
		perform: function(conn, argsArr) {
			conn.terminate();
		}
	}),
	//List active players
	WHO: CommandHandler.extend({
		preLogin: true,
		perform: function(conn, argsArr) {
			controller.applyToActivePlayers(function(otherconn, other) {
				if (otherconn !== conn) {
					controller.sendMessage(conn, other.name);
				}
			});
		}
	}),
	//Speak to other players
	say: CommandHandler.extend({
		nargs: 1,
		validate: function(conn, argsArr, cb) {
			cb(conn, argsArr);
		},
		perform: function(conn, argsArr) {
			var message = argsArr.length===0 ? "" : argsArr[0];
			var player = controller.findActivePlayerByConnection(conn);

			controller.sendMessage(conn, strings.youSay, {message: message});
			controller.sendMessageRoomExcept(conn, strings.says, {name: player.name, message: message});
		}
	}),
	//move the player somewhere
	go: CommandHandler.extend({
		nargs: 1,
		validate: function(conn, argsArr, cb) {
			if (argsArr.length === 1) {
				cb(conn, argsArr);
			} else {
				controller.sendMessage(conn, strings.unknownCommand);
			}
		},
		perform: function(conn, argsArr, errMsg) {
			var player = controller.findActivePlayerByConnection(conn);
			var exitName = argsArr[0];

			if (exitName === 'home') {
				player.getTarget().then(function(loc) {
					controller.applyToActivePlayers(function(otherconn, other) {
						if (other.locationId === loc.id && player !== other) {
							controller.sendMessage(otherconn, strings.goesHome, {name: player.name});
						}
					});

					player.getContents().then(function(contents){
						var fcn = function() {
							if (contents && contents.length>0) {
								var e = contents.shift();
								e.locationId = e.targetId;
								e.save().then(fcn);
							} else {
								for (var i=0; i<3; i++)
									controller.sendMessage(conn, strings.noPlaceLikeHome);
						
								player.setLocation(loc).then(function() {
									controller.sendMessage(conn, strings.goneHome);
									commands.look.lookRoom(conn, loc);
								});
							}
						}
						fcn();
					});
				});
			} else {
				controller.findPotentialMUDObject(conn, exitName, function(exit) {
					//found a matching exit... can we use it?
					predicates.canDoIt(controller, player, exit, function(canDoIt) {
						if (canDoIt && exit.targetId) {
							exit.getTarget().then(function(loc) {
								if (loc.id !== player.locationId) {
									//only inform everyone else if its a different room
									controller.applyToActivePlayers(function(otherconn, other) {
										if (other.locationId === player.locationId && player !== other) {
											controller.sendMessage(otherconn, strings.leaves, {name: player.name});
										}
										if (other.locationId === loc.id && player !== other) {
											controller.sendMessage(otherconn, strings.enters, {name: player.name});
										}
									});
								
									player.setLocation(loc).then(function() {
										commands.look.lookRoom(conn, loc);
									});
								} else {
									commands.look.lookRoom(conn, loc);
								}
							});
						}
					}, strings.noGo);
				}, false, false, 'EXIT', strings.ambigGo, errMsg ? errMsg : strings.noGo);
			}
		}
	}),
	//look at something
	look: CommandHandler.extend({
		nargs: 1,
		validate: function(conn, argsArr, cb) {
			if (argsArr.length <= 1)
				cb(conn, argsArr);
			else
				controller.sendMessage(conn, strings.unknownCommand);
		},
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);

			if (argsArr.length === 0 || argsArr[0].length===0) {
				player.getLocation().then(function(room) {
					commands.look.look(conn, room);
				});
			} else {
				controller.findPotentialMUDObject(conn, argsArr[0], function(obj) {
					commands.look.look(conn, obj);
				}, true, true, undefined, undefined, undefined, true);
			}
		},
		look: function(conn, obj) {
			switch (obj.type) {
				case 'ROOM':
					commands.look.lookRoom(conn, obj);
					break;
				case 'PLAYER':
					commands.look.lookSimple(conn, obj);
					commands.look.lookContents(conn, obj, strings.carrying);
					break;
				default:
					commands.look.lookSimple(conn, obj);
			}
		},
		lookRoom: function(conn, room) {
			var player = controller.findActivePlayerByConnection(conn);

			if (predicates.isLinkable(room, player)) {
				controller.sendMessage(conn, strings.roomNameOwner, room);
			} else {
				controller.sendMessage(conn, strings.roomName, room);
			}
			if (room.description) controller.sendMessage(conn, room.description);

			predicates.canDoIt(controller, player, room, function() {
				commands.look.lookContents(conn, room, strings.contents);
			});
		},
		lookSimple: function(conn, obj) {
			controller.sendMessage(conn, obj.description ? obj.description : strings.nothingSpecial);
		},
		lookContents: function(conn, obj, name, fail) {
			obj.getContents().then(function(contents) {
				if (contents) {
					var player = controller.findActivePlayerByConnection(conn);

					contents = contents.filter(function(o) {
						return predicates.isLookable(player, o);
					});

					if (contents.length>0) {
						controller.sendMessage(conn, name);
						for (var i=0; i<contents.length; i++) {
							controller.sendMessage(conn, contents[i].name);
						}
					} else {
						if (fail)
							controller.sendMessage(conn, fail);
					}
				} 
			});
		}
	}),
	//set the description of something
	"@describe": PropertyHandler.extend({
		prop: 'description'
	}),
	whisper: CommandHandler.extend({
		nargs: 1,
		validate: function(conn, argsArr, cb) {
			if (argsArr.length === 1 && argsArr[0].indexOf("=")>0)
				cb(conn, argsArr);
			else
				controller.sendMessage(conn, strings.unknownCommand);
		},
		perform: function(conn, argsArr) {
			var index = argsArr[0].indexOf("=");
			var targetName = argsArr[0].substring(0, index);
			var message = argsArr[0].substring(index + 1);
			
			var player = controller.findActivePlayerByConnection(conn);
			var target = controller.findActivePlayerByName(targetName);
			var targetConn = controller.findActiveConnectionByPlayer(target);
			if (target && target.locationId === player.locationId) {
				controller.sendMessage(conn, strings.youWhisper, {message: message, name: target.name});
				controller.sendMessage(targetConn, strings.toWhisper, {message: message, name: player.name});

				controller.applyToActivePlayers(function(otherconn, other) {
					if (other.locationId === player.locationId && player !== other && target !== other) {
						//1 in 10 chance that someone will hear what you whispered!
						if (Math.random() < 0.9) {
							controller.sendMessage(otherconn, strings.whisper, {fromName: player.name, toName: target.name});
						} else {
							controller.sendMessage(otherconn, strings.overheard, {fromName: player.name, toName: target.name, message: message});
						}
					}
				});
			} else {
				controller.loadMUDObject(conn, {name: targetName, type:'PLAYER', locationId: player.locationId}, function(target) {
					if (target) {
						controller.sendMessage(conn, strings.notConnected, {name: target.name});
					} else {
						controller.sendMessage(conn, strings.notInRoom);
					}
				});
			}
		}
	}),
	inventory: CommandHandler.extend({
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);
			commands.look.lookContents(conn, player, strings.youAreCarrying, strings.carryingNothing);
		}
	}),
	"@dig": PropertyHandler.extend({
		perform: function(conn, argsArr) {
			if (predicates.isNameValid(argsArr[0])) {
				//create a new room
				var player = controller.findActivePlayerByConnection(conn);
				
				controller.createMUDObject(conn, {name: argsArr[0], type:'ROOM', ownerId: player.id}, function(room) {
					if (room) {
						controller.sendMessage(conn, strings.roomCreated, room);
					}
				});
			} else {
				controller.sendMessage(conn, strings.invalidName);
			}
		}
	}),
	"@success": PropertyHandler.extend({
		prop: 'successMessage'
	}),
	"@osuccess": PropertyHandler.extend({
		prop: 'othersSuccessMessage'
	}),
	"@failure": PropertyHandler.extend({
		prop: 'failureMessage'
	}),
	"@ofailure": PropertyHandler.extend({
		prop: 'othersFailureMessage'
	}),
	"@name": PropertyHandler.extend({
		prop: 'name'
	}),
	"@password": PropertyHandler.extend({
		prop: 'name',
		validate: function(conn, argsArr, cb) {
			if (argsArr.length === 1 && argsArr[0].indexOf('=')>0)
				cb.apply(this, [conn, argsArr]);
			else
				controller.sendMessage(conn, strings.unknownCommand);
		},
		perform: function(conn, argsArr) {
			var index = argsArr[0].indexOf("=");
			var oldPass = argsArr[0].substring(0, index).trim();
			var newPass = argsArr[0].substring(index + 1).trim();
			var player = controller.findActivePlayerByConnection(conn);

			if (oldPass === player.password && predicates.isPasswordValid(newPass)) {
				player.password = newPass;
				player.save().then(function() {
					controller.sendMessage(conn, strings.changePasswordSuccess);
				});
			} else {
				controller.sendMessage(conn, strings.changePasswordFail);
			}
		}
	}),
	"@open": CommandHandler.extend({
		nargs: 1,
		validate: function(conn, argsArr, cb) {
			if (argsArr.length === 1) {
				if (predicates.isNameValid(argsArr[0])) {
					cb(conn, argsArr);
				} else {
					controller.sendMessage(conn, strings.invalidName);	
				}
			} else {
				controller.sendMessage(conn, strings.unknownCommand);
			}
		},
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);
			var exitName = argsArr[0];

			player.getLocation().then(function(loc) {
				if (loc.ownerId === player.id) {
					controller.createMUDObject(conn, {name: exitName, type: 'EXIT', locationId: loc.id, ownerId: player.id}, function(exit) {
						controller.sendMessage(conn, strings.opened);
					});
				} else {
					controller.sendMessage(conn, strings.permissionDenied);
				}
			});
		}
	}),
	"@link": PropertyHandler.extend({
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);

			var index = argsArr[0].indexOf("=");
			var targetName = argsArr[0].substring(0, index).trim();
			var value = argsArr[0].substring(index + 1).trim();

			if (targetName === 'here' && value === 'home') {
				commands["@set"].perform(conn, ["here=temple"]);
				return;
			}

			if (value === 'here')
				value = player.locationId;

			if (value === 'home')
				value = player.targetId;

			controller.findPotentialMUDObject(conn, targetName, function(obj) {
				controller.loadMUDObject(conn, {id: value, type: 'ROOM'}, function(room) {
					if (room) {
						switch(obj.type) {
						case 'EXIT':
							commands['@link'].linkExit(conn, obj, room);
							break;
						case 'ROOM':
						case 'PLAYER':
						case 'THING':
							commands['@link'].setHome(conn, obj, room);
							break;
						}
					} else {
						controller.sendMessage(conn, strings.notARoom);
					}
				});
			}, true, true);
		},
		setHome: function(conn, obj, room) {
			var player = controller.findActivePlayerByConnection(conn);
			if ((player.id === obj.id || obj.ownerId === player.id) && (room.canLink() || room.ownerId === player.id)) {
				obj.setTarget(room).then(function() {
					controller.sendMessage(conn, strings.homeSet);
				});
			} else {
				controller.sendMessage(conn, strings.permissionDenied);
			}
		},
		linkExit: function(conn, exit, room) {
			var player = controller.findActivePlayerByConnection(conn);

			if (exit.locationId !== player.locationId) {
				controller.sendMessage(conn, strings.exitBeingCarried);
			} else {
				if (predicates.isLinkable(room, player)) {
					exit.setTarget(room).then(function() {
						exit.setOwner(player).then(function() {
							controller.sendMessage(conn, strings.linked);
						});
					});
				} else {
					controller.sendMessage(conn, strings.permissionDenied);
				}
			}
		},
	}),
	"@unlink": PropertyHandler.extend({
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);

			if (argsArr[0] === 'here') {
				player.getLocation().then(function(obj){
					if (obj.ownerId === player.id) {
						obj.setTarget(null).then(function() {
							controller.sendMessage(conn, strings.unlinked);
						});
					} else {
						controller.sendMessage(conn, strings.permissionDenied);
					}
				});
			} else {
				controller.findPotentialMUDObject(conn, argsArr[0], function(obj) {
					if (obj.ownerId === player.id) {
						obj.setTarget(null).then(function() {
							controller.sendMessage(conn, strings.unlinked);
						});
					} else {
						controller.sendMessage(conn, strings.permissionDenied);
					}
				}, false, false, 'EXIT', strings.ambigSet, strings.unlinkUnknown);
			}
		}
	}),
	"@create": CommandHandler.extend({
		nargs: 1,
		validate: function(conn, argsArr, cb) {
			if (argsArr.length === 1) {
				if (predicates.isNameValid(argsArr[0])) {
					cb(conn, argsArr);
				} else {
					controller.sendMessage(conn, strings.invalidName);	
				}
			} else {
				controller.sendMessage(conn, strings.unknownCommand);
			}
		},
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);
			var objectName = argsArr[0];

			controller.createMUDObject(conn, {name: objectName, type: 'THING', locationId: player.id, targetId: player.targetId, ownerId: player.id}, function(thing) {
				controller.sendMessage(conn, strings.created);
			});
		}
	}),
	"@unlock": PropertyHandler.extend({
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);

			controller.findPotentialMUDObject(conn, argsArr[0], function(obj) {
				if (obj.ownerId === player.id) {
					obj.setKey(null).then(function() {
						controller.sendMessage(conn, strings.unlocked);
					});
				} else {
					controller.sendMessage(conn, strings.permissionDenied);
				}
			}, true, true, undefined, strings.ambigSet, strings.unlockUnknown);
		}
	}),
	"@lock": PropertyHandler.extend({
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);

			var index = argsArr[0].indexOf("=");
			var targetName = argsArr[0].substring(0, index).trim();
			var value = argsArr[0].substring(index + 1).trim();

			controller.findPotentialMUDObject(conn, targetName, function(obj) {
				if (obj.ownerId === player.id) {
					controller.findPotentialMUDObject(conn, value, function(key) {
						obj.setKey(key).then(function() {
							controller.sendMessage(conn, strings.locked);
						});
					}, true, true, undefined, strings.ambigSet, strings.keyUnknown);
				} else {
					controller.sendMessage(conn, strings.permissionDenied);
				}
			}, true, true, undefined, strings.ambigSet, strings.lockUnknown);
		}
	}),
	"examine": CommandHandler.extend({
		nargs: 1,
		validate: function(conn, argsArr, cb) {
			cb(conn, argsArr);
		},
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);
			var targetName;

			if (argsArr && argsArr.length === 1 && argsArr[0].length>0)
				targetName = argsArr[0];
			else
				targetName = 'here';

			controller.findPotentialMUDObject(conn, targetName, function(obj) {
				if (obj.ownerId === player.id) {
					controller.sendMessage(conn, strings.examine, obj);

					obj.getContents().then(function(contents) {
						if (contents && contents.length > 0) {
							controller.sendMessage(conn, strings.contents);
							for (var i=0; i<contents.length; i++) {
								controller.sendMessage(conn, strings.examineContentsName, contents[i]);
							}
						}
					});
				} else {
					controller.sendMessage(conn, strings.permissionDenied);
				}
			}, true, true, undefined, strings.ambigSet, strings.examineUnknown);
		}
	}),
	take: PropertyHandler.extend({
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);
			var targetName = argsArr[0];
			
			controller.findPotentialMUDObject(conn, targetName, function(obj) {
				switch (obj.type) {
					case 'PLAYER':
						controller.sendMessage(conn, strings.cantTakeThat);
						return;
					case 'EXIT':
						if (obj.targetId !== null) {
							controller.sendMessage(conn, strings.cantTakeLinkedExit);
							return;
						}
						break;
					case 'ROOM':
						controller.sendMessage(conn, strings.cantTakeThat);
						return;
				}

				if (obj.locationId === player.id) {
					controller.sendMessage(conn, strings.alreadyHaveThat);
				} else {
					predicates.canDoIt(controller, player, obj, function(canDoIt) {
						if (canDoIt) {
							obj.setLocation(player).then(function () {
								controller.sendMessage(conn, strings.taken);
							});
						}
					}, strings.cantTakeThat);
				}
			}, false, false, undefined, strings.ambigSet, strings.takeUnknown);
		}
	}),
	"drop": PropertyHandler.extend({
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);
			var targetName = argsArr[0];
			
			controller.findPotentialMUDObjects(conn, targetName, function(objs) {
				var fobjs = objs.filter(function(obj) {
					return obj.locationId === player.id;
				});

				if (fobjs.length === 0) {
					controller.sendMessage(conn, strings.dontHave);
				} else {
					var obj = fobjs[0];

					player.getLocation().then(function(loc) {
						if (loc.isTemple()) {
							//obj goes to its home
							obj.getTarget().then(function(tgt) {
								obj.setLocation(tgt).then(function() {
									controller.sendMessage(conn, strings.dropped);
								});
							});
						} else if (loc.targetId === null) {
							obj.setLocation(loc).then(function() {
								controller.sendMessage(conn, strings.dropped);
							});
						} else {
							//obj goes to loc.target
							loc.getTarget().then(function(tgt) {
								obj.setLocation(tgt).then(function() {
									controller.sendMessage(conn, strings.dropped);
								});
							});
						}
					});
				}
				
			}, false, false, undefined, strings.ambigSet, strings.takeUnknown);
		}
	}),
	"@set": PropertyHandler.extend({
		validate: function(conn, argsArr, cb) {
			if (argsArr.length === 1 && argsArr[0].indexOf('=')>0) {
				var index = argsArr[0].indexOf("=");
				var value = argsArr[0].substring(index + 1).trim();
				if (value.indexOf('!')===0)
					value = value.substring(1);

				if (db.MUDObject.FLAGS[value] !== undefined) {
					cb.apply(this, [conn, argsArr]);
					return;
				}
			}
			
			controller.sendMessage(conn, strings.unknownCommand);
		},
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);

			var index = argsArr[0].indexOf("=");
			var targetName = argsArr[0].substring(0, index).trim();
			var value = argsArr[0].substring(index + 1).trim();
			var isReset = value.indexOf('!') === 0;

			if (isReset)
				value = value.substring(1);

			var flag = db.MUDObject.FLAGS[value];

			controller.findPotentialMUDObject(conn, targetName, function(obj) {
				if (obj.ownerId === player.id) {
					if (isReset) {
						obj.resetFlag(flag).then(function() {
							controller.sendMessage(conn, strings.reset, {property: value});
						});
					} else {
						obj.setFlag(flag).then(function() {
							controller.sendMessage(conn, strings.set, {property: value});
						});
					}
				} else {
					controller.sendMessage(conn, strings.permissionDenied);
				}
			}, true, true, undefined, strings.ambigSet, strings.setUnknown);
		}
	}),
	page: PropertyHandler.extend({
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);
			var other = controller.findActivePlayerByName(argsArr[0]);
			var otherconn = controller.findActiveConnectionByPlayer(other);

			if (other) {
				player.getLocation().then(function(loc) {
					controller.sendMessage(otherconn, strings.page, {name: player.name, location: loc.name});
					controller.sendMessage(conn, strings.pageOK);
				});
			} else {
				controller.sendMessage(conn, strings.isNotAvailable);
			}
		}
	}),
	"@find": PropertyHandler.extend({
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);
			var escName = '%' + argsArr[0].toLowerCase() +'%';

			controller.loadMUDObjects(conn, 
				db.Sequelize.and(
					["lower(name) LIKE ?", [escName]],
					{ownerId: player.id}
				), function(objs) { 
					if (objs && objs.length > 0) {
						for (var i=0; i<objs.length; i++) {
							controller.sendMessage(conn, "{{name}} {{id}}", objs[i]);
						}
					} else {
						controller.sendMessage(conn, strings.notFound);
					}
				}
			);
		}
	}),
	"@path": PropertyHandler.extend({
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);
			
			//get current room
			player.getLocation().then(function(startRoom) {
				//get the target room
				var targetName = argsArr[0];
				controller.loadMUDObject(conn, {name: targetName, type: 'ROOM'}, function(endRoom) {
					if (!endRoom) {
						controller.sendMessage(conn, strings.notFound);
					} else {
						//breadth-first search for path to target room
						bfs(startRoom.id, 
							function(depth, node, cb) {
								//get the connected rooms
								controller.loadMUDObjects(
									conn, 
									db.Sequelize.and({ type: 'EXIT' }, {locationId: node}, { targetId: {ne: null} }),
									function(e) { 
										var rooms = [];
										for (var i=0; i<e.length; i++) {
											rooms.push(e[i].targetId);
										}
										cb(null, rooms);
									}
								);
							}, 
							function(node, cb) {
								cb(null, endRoom.id === node); //test if destination found
							}, 
							function(err, path) {
								if (path == null) {
									controller.sendMessage(conn, strings.notFound);
								} else {
									commands["@path"].printPath(conn, path);
								}
							}
						);
					}
				});
			});
		},
		printPath: function(conn, path) {
			controller.loadMUDObject(conn, {id: path.shift()}, function(current) {
				controller.sendMessage(conn, current.name);

				if (path.length == 0) return;
				controller.loadMUDObject(conn, {targetId: path[0], locationId: current.id, type: 'EXIT'}, function(exit) {
					controller.sendMessage(conn, strings.via, exit);
					commands["@path"].printPath(conn, path);
				});
			});
		}
	}),
	//debugging only!
	dump: CommandHandler.extend({
		perform: function(conn, argsArr) {
			db.MUDObject.findAll().then(function(objs){
				for (var i=0; i<objs.length; i++) {
					var tmp = objs[i];
					objs[i] = {
						"model": "MUDObject",
						"data": tmp
					};
				}

				controller.sendMessage(conn, JSON.stringify(objs, null, '\t'));
			});
		}
	})
};

//command aliases
commands.goto = commands.go;
commands['throw'] = commands.drop;
commands.move = commands.go;
commands.cr = commands.create;
commands.co = commands.connect;
commands['@fail'] = commands["@failure"];
commands['@ofail'] = commands["@ofailure"];
commands.read = commands.look;
commands.get = commands.take;

//The commands object is exported publicly by the module
module.exports = commands;
