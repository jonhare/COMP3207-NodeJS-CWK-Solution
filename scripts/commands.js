var predicates = require('./predicates');
var strings = require('./strings');

/**
 * Reference to the controller; injected by the ctor
 */
var controller;

var CommandHandler = {
	nargs: 0,
	preLogin: false,
	postLogin: true,
	validate: function(conn, argsArr, cb) {
		if (argsArr.length == 0)
			cb.apply(this, [conn, argsArr]);
		else
			controller.sendMessage(conn, strings.unknownCommand);
	},
	perform: function(conn, argsArr) {
		console.log("This probably should be overridden!");
	}
}

var PropertyHandler = createObject(CommandHandler, {
	prop: undefined,
	nargs: 1,
	validate: function(conn, argsArr, cb) {
		if (argsArr.length === 1)
			cb.apply(this, [conn, argsArr]);
		else
			controller.sendMessage(conn, strings.unknownCommand);
	},
	perform: function(conn, argsArr) {
		var index = argsArr[0].indexOf("=");
		index = index==-1 ? argsArr[0].length : index;
		var targetName = argsArr[0].substring(0, index);
		var value = argsArr[0].substring(index + 1);

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

var commands = {
	create: createObject(CommandHandler, {
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

			loadMUDObject(conn, {name: argsArr[0], type: 'PLAYER'}, function(player) {
				if (!player) {
					cb(conn, argsArr);
				} else {
					controller.sendMessage(conn, strings.usernameInUse);
				}
			});
		},
		perform: function(conn, argsArr) {
			//create a new player
			createMUDObject(conn, {name: argsArr[0], password: argsArr[1], type:'PLAYER', locationId: controller.defaultRoom.id}, function(player) {
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
	connect: createObject(CommandHandler, {
		nargs: 2,
		preLogin: true,
		postLogin: false,
		validate: function(conn, argsArr, cb) {
			loadMUDObject(conn, {name: argsArr[0], type:'PLAYER'}, function(player) {
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
			loadMUDObject(conn, {name: argsArr[0], password: argsArr[1], type:'PLAYER'}, function(player) {
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
	QUIT: createObject(CommandHandler, {
		preLogin: true,
		perform: function(conn, argsArr) {
			controller.deactivatePlayer(conn);
		}
	}),
	say: createObject(CommandHandler, {
		nargs: 1,
		validate: function(conn, argsArr, cb) {
			cb(conn, argsArr);
		},
		perform: function(conn, argsArr) {
			var message = argsArr.length==0 ? "" : argsArr[0];

			controller.sendMessage(conn, strings.youSay, {message: message});

			var me = controller.findActivePlayerByConnection(conn);
			controller.applyToActivePlayers(function(otherconn, other) {
				if (other.locationId === me.locationId && me !== other) {
					controller.sendMessage(otherconn, strings.says, {name: me.name, message: message});
				}
			});
		}
	}),
	whisper: createObject(CommandHandler, {
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
			
			var me = controller.findActivePlayerByConnection(conn);
			var target = controller.findActivePlayerByName(targetName);
			var targetConn = controller.findActiveConnectionByPlayer(target);
			if (target && target.locationId === me.locationId) {
				controller.sendMessage(conn, strings.youWhisper, {message: message, name: target.name});
				controller.sendMessage(targetConn, strings.toWhisper, {message: message, name: me.name});

				controller.applyToActivePlayers(function(otherconn, other) {
					if (other.locationId === me.locationId && me !== other && target !== other) {
						//1 in 10 chance that someone will hear what you whispered!
						if (Math.random() < 0.9) {
							controller.sendMessage(otherconn, strings.whisper, {fromName: me.name, toName: target.name});
						} else {
							controller.sendMessage(otherconn, strings.overheard, {fromName: me.name, toName: target.name, message: message});
						}
					}
				});
			} else {
				controller.sendMessage(conn, strings.notInRoom, {name: target});
			}
		}
	}),
	WHO: createObject(CommandHandler, {
		preLogin: true,
		perform: function(conn, argsArr) {
			controller.applyToActivePlayers(function(otherconn, other) {
				if (otherconn !== conn) {
					controller.sendMessage(conn, other.name);
				}
			});
		}
	}),
	go: createObject(CommandHandler, {
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
				loc.getExits({ where : {name: exitName} }).success(function(exits) {
					if (!exits || exits.length === 0) {
						controller.sendMessage(conn, "You can't go {{dir}} from here.", {dir: exitName});
					} else {
						exits[0].getLocation().success(function(loc) {
							if (loc) {
								controller.applyToActivePlayers(function(otherconn, other) {
									if (other.locationId === loc.id && player !== other) {
	  									controller.sendMessage(otherconn, strings.enters, {name: player.name});
	  								}
	  							});

								player.setLocation(loc).success(function(){
									commands.look.lookRoom(conn, loc);
								});
							} else {
								controller.sendMessage(conn, "{{dir}}} doesn't seem to go anywhere.", {dir: exitName});
							}
						});
					}
				});
			});
			}
	}),
	look: createObject(CommandHandler, {
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
			} else {
				loadMUDObject(conn, {name: argsArr[0]}, function(obj) {
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
			controller.sendMessage(conn, strings.peopleHere);
			controller.applyToActivePlayers(function(otherconn, other) {
				if (other.locationId === room.id) {
					controller.sendMessage(conn, other.name);
				}
			});
			
			loadMUDObjects(conn, {type: 'THING', locationId: room.id}, function(objs) {
				if (objs && objs.length>0) {
					controller.sendMessage(conn);
					controller.sendMessage(conn, strings.youSee);
					commands.look.lookObjects(conn, objs);
				}

				room.getExits().success(function(exits) {
					controller.sendMessage(conn);
					if (exits && exits.length>0) {
						controller.sendMessage(conn, "Exits:");
						commands.look.lookObjects(conn, exits);
					} else {
						controller.sendMessage(conn, "You can't see any exits from this room.");
					}
				});
			});
		},
		lookObject: function(conn, obj, verbose) {
			controller.sendMessage(conn, obj.name);
			if (verbose) {
				controller.sendMessage(conn, obj.description);
				controller.sendMessage(conn);
			}
		},
		lookObjects: function(conn, objs, verbose) {
			for (var i=0; i<objs.length; i++) {
				commands.look.lookObject(conn, objs[i]);
			}
		}
	}),
	"@dig": createObject(PropertyHandler, {
		perform: function(conn, argsArr) {
			if (predicates.isNameValid(argsArr[0])) {
				//create a new room
				var player = controller.findActivePlayerByConnection(conn);
				
				createMUDObject(conn, {name: argsArr[0], type:'ROOM', ownerId: player.id}, function(room) {
					if (room) {
						controller.sendMessage(conn, strings.roomCreated, room);
					}
				});
			} else {
				controller.sendMessage(conn, strings.invalidName);
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
	"@open": createObject(CommandHandler, {
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
						createMUDObject(conn, {name: exitName, type: 'EXIT'}, function(exit) {
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
	"@link": createObject(PropertyHandler, {
		perform: function(conn, argsArr) {
			var player = controller.findActivePlayerByConnection(conn);

			var index = argsArr[0].indexOf("=");
			var targetName = argsArr[0].substring(0, index).trim();
			var value = argsArr[0].substring(index + 1).trim();

			player.getLocation().success(function(loc) {
				loc.getExits({ where: {name: targetName} }).success(function(exits) {
					if (exits && exits.length === 1) {
						var exit = exits[0];

						loadMUDObject(conn, {id: value, type: 'ROOM'}, function(room) {
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

module.exports = function(cont) {
	controller = cont;
	return commands;
};

//Private helper functions below this point

function fatalError(err, conn) {
	if (conn) {
		conn.send("A fatal error occurred: " + err + "\n");
		conn.send("You will be disconnected immediately!\n");
		conn.terminate();
 	}
	throw {name: "FatalError", description: err};
}

function createMUDObject(conn, obj, cb) {
	db.MUDObject.build(obj).save().complete(function(err, nobj) {
		if (!!err) {
			fatalError(err, conn);
		} else {
			cb(nobj);
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
	console.log("updatePropertyInternal");
	console.log(targets);
	var me = controller.findActivePlayerByConnection(conn);

	if (!Array.isArray(targets)) 
		targets = [targets];

	for (var i=0; i<targets.length; i++) {
		var target = targets[i];

		if (me.id === target.ownerId || !target.ownerId) {
			target[propertyName] = value;
			target.save().complete(function(err, obj) {
				if (!!err) {
					fatalError(err, conn);
				} else {
					controller.sendMessage(conn, "{{property}} set.", {property: propertyName});
				}
			});
		} else {
			controller.sendMessage(conn, "The object isn't owned by you");
		}
	}
}

function updateProperty(conn, targetName, propertyName, value) {
	var me = controller.findActivePlayerByConnection(conn);

	if (targetName === 'me') {
		updatePropertyInternal(conn, me, propertyName, value);
	} else if (targetName === 'here') {
		me.getLocation().success(function(loc) {
			updatePropertyInternal(conn, loc, propertyName, value);
		});
	} else {
		loadMUDObjects(conn, {name: targetName, ownerId: me.id, locationId: me.locationId}, function(objs) {
			if (objs) objs = objs.filter(function(o){ return o.type !== 'EXIT'});

			if (objs && objs.length>0) {
				updatePropertyInternal(conn, objs, propertyName, value);
			} else {
				me.getLocation().success(function(loc) {
					loc.getExits({where: {name: targetName}}).success(function(exits) {
						if (exits && exits.length>0) {
							updatePropertyInternal(conn, exits, propertyName, value);
						} else {
							controller.sendMessage(conn, "cannot find object (or object isn't owned by you)");
						}
					});
				});
			}
		});
	}
}
