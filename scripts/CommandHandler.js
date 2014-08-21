var controller = require('./controller');

module.exports = {
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
	},
	extend: function(ext) {
		var clone = Object.create(this);

		for (var prop in ext) {
			if (ext.hasOwnProperty(prop)) {
				clone[prop] = ext[prop];
			}
		}

		return clone;
	}
}
