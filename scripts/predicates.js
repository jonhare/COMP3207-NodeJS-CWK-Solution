module.exports = {
	/**
	 * Test if the given password is valid
	 * @param str the password
	 * @return true if valid; false otherwise
	 */
	isPasswordValid: function(str) {
		return /[!-~]+/.test(str);
	},
	/**
	 * Test if the given username is valid
	 * @param str the username
	 * @return true if valid; false otherwise
	 */
	isUsernameValid: function(str) {
		return /[!-~^=]+/.test(str) && str.indexOf('=') === -1;
	},
	/**
	 * Test if the given room/thing name is valid
	 * @param str the username
	 * @return true if valid; false otherwise
	 */
	isNameValid: function(str) {
		return /[!-~]+/.test(str);
	},
	/**
	 * 
	 * @return true if valid; false otherwise
	 */
	isLinkable: function(room, player) {
		if (room.ownerId === player.id) return true;
		return room.canLink();
	},
	canDoIt: function(controller, player, thing, callback, defaultFailureMessage) {
		var playerConn = controller.findActiveConnectionByPlayer(player);
		
		if (!playerConn) {
			if (callback) callback(false);
			return;
		}

		couldDoIt(player, thing, function(doit) {
			if (!doit) {
				if (thing.failureMessage) {
					controller.sendMessage(playerConn, thing.failureMessage);
				} else if (defaultFailureMessage) {
					controller.sendMessage(playerConn, defaultFailureMessage);
				}

				if (thing.otherFailureMessage) {
					controller.sendMessageExcept(playerConn, player.name + " " + thing.otherSuccessMessage);
				}
			} else {
				if (thing.successMessage) {
					controller.sendMessage(playerConn, thing.successMessage);
				}

				if (thing.otherSuccessMessage) {
					controller.sendMessageExcept(playerConn, player.name + " " + thing.otherSuccessMessage);
				}
			}

			if (callback)
				callback(doit);
		});
	},
	sameName: function(ftargets) {
		if (ftargets.length <= 1) return true;

		var name = ftargets[0].name;

		for (var i=1; i<ftargets.length; i++) {
			if (name !== target.name) 
				return false;
		}

		return true;
	}
}


//private functions

function couldDoIt(player, thing, callback) {
	if(thing.type !== 'ROOM' && !thing.locationId) {
		callback(false);
		return;
	}

	var keyId = thing.keyId;
    if(!keyId) {
    	callback(true);
    	return;
    }

    if (player.id === keyId) {
		callback(!thing.hasAntiLock());
		return;
	}

	thing.getContents({where: {id: keyId}}).success(function(obj) {
		if (obj) callback(!thing.hasAntiLock());
		else callback(thing.hasAntiLock());
	});
}
