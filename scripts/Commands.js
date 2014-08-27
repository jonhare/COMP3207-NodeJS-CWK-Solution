var db = require('../models');
var controller = require('./Controller');
var predicates = require('./Predicates');
var strings = require('./Strings');
var CommandHandler = require('./CommandHandler');
var PropertyHandler = require('./PropertyHandler');

var commands = {
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
					player.setOwner(player).success(function() {
						controller.activatePlayer(conn, player);
						controller.broadcastExcept(conn, strings.hasConnected, player);

						controller.clearScreen(conn);
						commands.look.perform(conn, []);
					});
				}
			});
		}
	}),
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
	QUIT: CommandHandler.extend({
		preLogin: true,
		perform: function(conn, argsArr) {
			conn.terminate();
		}
	}),
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
						controller.sendMessage(conn, strings.notConnected, {name: target});
					} else {
						controller.sendMessage(conn, strings.notInRoom, {name: target});
					}
				});
			}
		}
	}),
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
				player.getTarget().success(function(loc) {
					controller.applyToActivePlayers(function(otherconn, other) {
						if (other.locationId === loc.id && player !== other) {
							controller.sendMessage(otherconn, strings.goesHome, {name: player.name});
						}
					});

					player.getContents().success(function(contents){
						if (contents) {
							var chainer = new db.Sequelize.Utils.QueryChainer();
							for (var i=0; i<contents.length; i++) {
								var ci = contents[i];
								ci.locationId = ci.targetId;
								chainer.add(ci.save());
							}
							chainer.run().success(function(){
								//don't need to do anything
							});
						}

						controller.sendMessage(conn, "There's no place like home...");
						controller.sendMessage(conn, "There's no place like home...");
						controller.sendMessage(conn, "There's no place like home...");

						player.setLocation(loc).success(function() {
							controller.sendMessage(conn, 'You wake up back home, without your possessions.');
							commands.look.lookRoom(conn, loc);
						});
					});
				});
			} else {
				controller.findPotentialMUDObject(conn, exitName, function(exit) {
					//found a matching exit... can we use it?
					predicates.canDoIt(controller, player, exit, function(canDoIt) {
						if (canDoIt && exit.targetId) {
							exit.getTarget().success(function(loc) {
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
								
									player.setLocation(loc).success(function() {
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
				player.getLocation().success(function(room) {
					commands.look.look(conn, room);
				});
			} else {
				controller.findPotentialMUDObject(conn, argsArr[0], function(obj) {
					commands.look.look(conn, obj);
				}, true, true);
			}
		},
		look: function(conn, obj) {
			switch (obj.type) {
				case 'ROOM':
					commands.look.lookRoom(conn, obj);
					break;
				case 'PLAYER':
					commands.look.lookSimple(conn, obj);
					commands.look.lookContents(conn, obj, 'Carrying:');
					break;
				default:
					commands.look.lookSimple(conn, obj);
			}
		},
		lookRoom: function(conn, room) {
			var player = controller.findActivePlayerByConnection(conn);

			if (predicates.isLinkable(room, player)) {
				controller.sendMessage(conn, "{{name}} (#{{id}})", room);
			} else {
				controller.sendMessage(conn, "{{name}}", room);
			}
			if (room.description) controller.sendMessage(conn, room.description);

			predicates.canDoIt(controller, player, room, function() {
				commands.look.lookContents(conn, room, 'Contents:');
			});
		},
		lookSimple: function(conn, obj) {
			controller.sendMessage(conn, obj.description ? obj.description : strings.nothingSpecial);
		},
		lookContents: function(conn, obj, name) {
			obj.getContents().success(function(contents) {
				if (contents) {
					var player = controller.findActivePlayerByConnection(conn);

					contents = contents.filter(function(o) {
						return predicates.canSee(player, o);
					});

					if (contents.length>0) {
						controller.sendMessage(conn, name);
						for (var i=0; i<contents.length; i++) {
							controller.sendMessage(conn, contents[i].name);
						}
					}
				} 
			});
		}
	}),
	inventory: CommandHandler.extend({
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);
			commands.look.lookContents(conn, player, 'Carrying:');
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
	"@describe": PropertyHandler.extend({
		prop: 'description'
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
				player.setPassword(newPass).success(function() {
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

			player.getLocation().success(function(loc) {
				if (loc.ownerId === player.id) {
					controller.createMUDObject(conn, {name: exitName, type: 'EXIT', locationId: loc.id, ownerId: player.id}, function(exit) {
						controller.sendMessage(conn, "Opened.");
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

			if (value === 'here')
				value = player.locationId;

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
			if (player.id === obj.id || obj.ownerId === player.id) {
				obj.setTarget(room).success(function() {
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
					exit.setTarget(room).success(function() {
						exit.setOwner(player).success(function() {
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

			controller.findPotentialMUDObject(conn, argsArr[0], function(obj) {
				if (obj.ownerId === player.id) {
					obj.setLocation(null).success(function() {
						controller.sendMessage(conn, strings.unlinked);
					});
				} else {
					controller.sendMessage(conn, strings.permissionDenied);
				}
			}, false, false, 'EXIT', strings.ambigSet, strings.unlinkUnknown);
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
				controller.sendMessage(conn, "Created.");
			});
		}
	}),
	"@unlock": PropertyHandler.extend({
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);

			controller.findPotentialMUDObject(conn, argsArr[0], function(obj) {
				if (obj.ownerId === player.id) {
					obj.setKey(null).success(function() {
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
						obj.setKey(key).success(function() {
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

					obj.getContents().success(function(contents) {
						if (contents && contents.length > 0) {
							controller.sendMessage(conn, strings.examineContents);
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
						return; //*should* never be able to get here!!
				}

				if (obj.locationId === player.id) {
					controller.sendMessage(conn, strings.alreadyHaveThat);
				} else {
					predicates.canDoIt(controller, player, obj, function(canDoIt) {
						if (canDoIt) {
							obj.setLocation(player).success(function () {
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

					player.getLocation().success(function(loc) {
						if (loc.targetId === null) {
							obj.setLocation(loc).success(function() {
								controller.sendMessage(conn, strings.dropped);
							});
						} else if (loc.isTemple()) {
							//obj goes to its home
							obj.getTarget().success(function(tgt) {
								obj.setLocation(tgt).success(function() {
									controller.sendMessage(conn, strings.dropped);
								});
							});
						} else {
							//obj goes to loc.target
							loc.getTarget().success(function(tgt) {
								obj.setLocation(tgt).success(function() {
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

				if (db.MUDObject.FLAGS[value]) {
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
			var isReset = value.indexOf('!')===0;

			if (isReset)
				value = value.substring(1);

			var flag = db.MUDObject.FLAGS[value];

			controller.findPotentialMUDObject(conn, targetName, function(obj) {
				if (obj.ownerId === player.id) {
					if (isReset) {
						obj.resetFlag(flag).success(function() {
							controller.sendMessage(conn, strings.reset, {property: value});
						});
					} else {
						obj.setFlag(flag).success(function() {
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
				player.getLocation().success(function(loc) {
					controller.sendMessage(otherconn, strings.page, {name: player.name, location: loc.name});
					controller.sendMessage(conn, strings.pageOK);
				});
			} else {
				controller.sendMessage(conn, strings.isNotAvailable);
			}
		}
	})
};

//command aliases
commands.goto = commands.go;
commands.move = commands.go;
commands.cr = commands.create;
commands.co = commands.connect;
commands.fail = commands.failure;
commands.ofail = commands.ofailure;
commands.read = commands.look;
commands.get = commands.take;

module.exports = commands;

