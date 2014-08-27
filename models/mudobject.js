/**
 * models/mudobject.js
 * 
 * Sequelize database table/object definition for a `MUDObject`.
 * Every thing in the game (players, rooms, exits and things)
 * is an instance of a MUDObject.
 * 
 * @author Jonathon Hare (jsh2@ecs.soton.ac.uk)
 */
module.exports = function(sequelize, DataTypes) {
	var MUDObject = sequelize.define("MUDObject", {
		/* Name of the object */
		name: {
			type: DataTypes.STRING, 
			allowNull:false
		},
		/* Description text */
		description: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		/* what player sees if op fails */
		failureMessage: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		/* what player sees if op succeeds */
		successMessage: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		/* what others see if op fails */
		othersFailureMessage: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		/* what others see if op succeeds */
		othersSuccessMessage: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		/* type of MUDObject */
		type: {
			type: DataTypes.ENUM,
			values: ['ROOM', 'THING', 'EXIT', 'PLAYER'],
			allowNull: false
		},
		/* bitflags defining the attributes of the object */
		flags: DataTypes.INTEGER,
		/* Password (only for people) */
		password: {
			type: DataTypes.STRING,
			allowNull: true
		}
	}, {
		classMethods: {
			associate: function(models) {
	  			//the target of the object (this is where exits go and things dropped in rooms go)
				MUDObject.belongsTo(MUDObject, {foreignKey: 'targetId', as: 'target'});

				//the location of the object
				MUDObject.belongsTo(MUDObject, {foreignKey: 'locationId', as: 'location'});

				// owner who controls this object
				MUDObject.belongsTo(MUDObject, {foreignKey: 'ownerId', as: 'owner'});

				// key required to use this object
				MUDObject.belongsTo(MUDObject, {foreignKey: 'keyId', as: 'key'});
			},
			FLAGS: {
				link_ok: 1<<0,
				anti_lock: 1<<1,
				temple: 1<<2
			},
		},
		instanceMethods: {
			getFlag: function(flag) {
				return this.flags & db.MUDObject.FLAGS[flag];
			},
			canLink: function() {
				return this.flags & db.MUDObject.FLAGS.link_ok;
			},
			hasAntiLock: function() {
				return this.flags & db.MUDObject.FLAGS.anti_lock;
			},
			isTemple: function() {
				return this.flags & db.MUDObject.FLAGS.temple;
			},
			getContents: function() {
				return db.MUDObject.findAll({ where : {locationId: this.id}});
			},
			setFlag: function(flagbit) {
				console.log("Old " + this.flags);
				this.flags |= flagbit;
				console.log("Set " + this.flags);
				return this.save();
			},
			resetFlag: function(flagbit) {
				this.flags &= ~flagbit;

				return this.save();
			}
		}
	});

	return MUDObject;
};
