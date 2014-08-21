var controller = require('./controller');
var predicates = require('./predicates');
var strings = require('./strings');
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
			controller.createMUDObject(conn, {name: argsArr[0], password: argsArr[1], type:'PLAYER', locationId: controller.defaultRoom.id}, function(player) {
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
			controller.deactivatePlayer(conn);
		}
	}),
	say: CommandHandler.extend({
		nargs: 1,
		validate: function(conn, argsArr, cb) {
			cb(conn, argsArr);
		},
		perform: function(conn, argsArr) {
			var message = argsArr.length==0 ? "" : argsArr[0];

			controller.sendMessage(conn, strings.youSay, {message: message});

			var player = controller.findActivePlayerByConnection(conn);
			controller.applyToActivePlayers(function(otherconn, other) {
				if (other.locationId === me.locationId && player !== other) {
					controller.sendMessage(otherconn, strings.says, {name: me.name, message: message});
				}
			});
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
			if (target && target.locationId === me.locationId) {
				controller.sendMessage(conn, strings.youWhisper, {message: message, name: target.name});
				controller.sendMessage(targetConn, strings.toWhisper, {message: message, name: me.name});

				controller.applyToActivePlayers(function(otherconn, other) {
					if (other.locationId === me.locationId && player !== other && target !== other) {
						//1 in 10 chance that someone will hear what you whispered!
						if (Math.random() < 0.9) {
							controller.sendMessage(otherconn, strings.whisper, {fromName: me.name, toName: target.name});
						} else {
							controller.sendMessage(otherconn, strings.overheard, {fromName: me.name, toName: target.name, message: message});
						}
					}
				});
			} else {
				controller.loadMUDObject({name: targetName, type:'PLAYER', location: me.locationId}).success(function(target) {
					if (other) {
						controller.sendMessage(conn, strings.notConnected, {name: target});
					} else {
						controller.sendMessage(conn, strings.notInRoom, {name: target});
					}
				});
			}
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
	go: CommandHandler.extend({
		nargs: 1,
		validate: function(conn, argsArr, cb) {
			if (argsArr.length == 1) {
				cb(conn, argsArr);
			} else {
				controller.sendMessage(conn, strings.unknownCommand);
			}
		},
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);
			var exitName = argsArr[0];

			player.getLocation().success(function(loc) {
				loc.getExits({ where : {name: {like : '%' + exitName + '%'}} }).success(function(exits) {
					if (!exits || exits.length === 0) {
						controller.sendMessage(conn, strings.noGo);
					} else if (exits.length>1) {
						controller.sendMessage(conn, strings.ambigGo);
					} else {
						exits[0].getLocation().success(function(loc) {
							if (loc) {
								predicates.canDoIt(controller, player, loc, function(canDoIt) {
									if (canDoIt) {
										controller.applyToActivePlayers(function(otherconn, other) {
											if (other.locationId === loc.id && player !== other) {
			  									controller.sendMessage(otherconn, strings.enters, {name: player.name});
			  								}
			  							});

										player.setLocation(loc).success(function(){
											commands.look.lookRoom(conn, loc);
										});
									}
								}, strings.noGo);
							} else {
								controller.sendMessage(conn, strings.noGo);
							}
						});
					}
				});
			});
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
					commands.look.lookRoom(conn, room);
				});
			} else if (argsArr[0] === 'me') {
				commands.look.lookObject(conn, player, true);
			} else {
				controller.loadMUDObject(conn, {name: {like: '%' + argsArr[0] + '%'}}, function(obj) {
					if (obj) {
						if (obj.id === player.locationId) {
							commands.look.lookRoom(conn, obj);
							return;
						} else if (obj.locationId === player.locationId) {
							commands.look.lookObject(conn, obj, true);
							return;
						} else {
							player.getLocation().success(function(loc) {
								loc.getExits({ where: {id: obj.id} }).success(function(exits) {
									if (exits && exits.length>0) {
										commands.look.lookObject(conn, obj, true);
									} else {
										controller.sendMessage(conn, strings.dontSeeThat, obj ? obj : {name: argsArr[0]});
									}
								});
							});
						}
					} else {
						controller.sendMessage(conn, strings.dontSeeThat, obj ? obj : {name: argsArr[0]});
					}
				});
			}
		},
		lookRoom: function(conn, room) {
			commands.look.lookObject(conn, room, true);
			controller.sendMessage(conn);
			controller.loadMUDObjects(conn, {locationId: room.id, type: {not: 'EXIT'}}, function(objs) {
				if (objs && objs.length>0) {
					controller.sendMessage(conn);
					controller.sendMessage(conn, strings.contents);
					commands.look.lookObjects(conn, objs);
				}
			});
		},
		lookObject: function(conn, obj, verbose) {
			if (verbose) {
				controller.sendMessage(conn, obj.description ? obj.description : strings.nothingSpecial);
			} else {
				controller.sendMessage(conn, obj.name);
			}
		},
		lookObjects: function(conn, objs, verbose) {
			for (var i=0; i<objs.length; i++) {
				commands.look.lookObject(conn, objs[i], verbose);
			}
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
		prop: 'otherSuccessMessage'
	}),
	"@failure": PropertyHandler.extend({
		prop: 'failureMessage'
	}),
	"@ofailure": PropertyHandler.extend({
		prop: 'otherFailureMessage'
	}),
	"@name": PropertyHandler.extend({
		prop: 'name'
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
				loc.getExits({ where : {name: exitName} }).success(function(exits) {
					if (!exits || exits.length === 0) {
						//create with no owner by default
						controller.createMUDObject(conn, {name: exitName, type: 'EXIT'}, function(exit) {
							loc.addExit(exit).success(function() {
								controller.sendMessage(conn, "Exit created");
							});
						});
					} else {
						controller.sendMessage(conn, "Exit already exists");
					}
				});
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

			player.getLocation().success(function(loc) {
				loc.getExits({ where: {name: targetName} }).success(function(exits) {
					if (exits && exits.length === 1) {
						var exit = exits[0];

						controller.loadMUDObject(conn, {id: value, type: 'ROOM'}, function(room) {
							if (room) {
								if (predicates.isLinkable(room, player)) {
									exit.setLocation(room).success(function() {
										exit.setOwner(player).success(function() {
											controller.sendMessage(conn, "Room linked");
										});
									});
								} else {
									controller.sendMessage(conn, "Your don't have permission to link to that room");
								}
							} else {
								controller.sendMessage(conn, "That room doesn't seem to exist");
							}
						});
					} else {
						controller.sendMessage(conn, "That exit doesn't exist");
					}
				});
			});
		}
	}),
};

//command aliases
commands['goto'] = commands.go;
commands.move = commands.go;
commands.cr = commands.create;
commands.co = commands.connect;
commands.fail = commands.failure;
commands.ofail = commands.ofailure;

module.exports = commands;

