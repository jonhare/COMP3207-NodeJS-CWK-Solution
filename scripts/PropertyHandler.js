

var S = require('string');
var strings = require('./Strings');
var CommandHandler = require('./CommandHandler');
var controller = require('./Controller');
var predicates = require('./Predicates');

var PropertyHandler = CommandHandler.extend({
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
		index = (index === -1) ? argsArr[0].length : index;
		var targetName = argsArr[0].substring(0, index).trim();
		var value = argsArr[0].substring(index + 1).trim();

		updateProperty(conn, targetName, this.prop, value);
	}
});

module.exports = PropertyHandler;
 
function updatePropertyInternal(conn, targets, propertyName, value) {
	var me = controller.findActivePlayerByConnection(conn);

	if (!Array.isArray(targets)) 
		targets = [targets];

	var ftargets = targets.filter(function(obj) {
		return obj.ownerId === me.id;
	});

	if (ftargets.length === 0) {
		//nothing that belongs to you
		controller.sendMessage(conn, strings.permissionDenied);
	} else if (ftargets.length>1 && predicates.sameName(ftargets)) {
		controller.sendMessage(conn, strings.ambigSet);
	} else {
		var target = ftargets[0];

		target[propertyName] = value;
		target.save().success(function(obj) {
			controller.sendMessage(conn, strings.set, {property: S(strings[propertyName]).capitalize().s});
		});
	}
}

function updateProperty(conn, targetName, propertyName, value) {
	controller.findPotentialMUDObjects(conn, targetName, function(objs) {
		updatePropertyInternal(conn, objs, propertyName, value);
	}, true, true);
}

