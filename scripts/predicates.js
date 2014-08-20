var Flags = require('./flags');

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
		if (room.ownerId === player.id || !room.ownerId) return true;
		return room.flags & Flags.LINK_OK;
	}
}