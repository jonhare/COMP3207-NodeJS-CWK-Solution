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
		/* what you see if op fails */
		failureMessage: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		/* what you see if op succeeds */
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
		/* number of pennies object contains */
		pennies: DataTypes.INTEGER,
		type: {
			type: DataTypes.ENUM,
			values: ['ROOM', 'THING', 'EXIT', 'PLAYER'],
			allowNull: false
		},
		/* bitflags defining the type of the object and its attributes */
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
			}
		},
		instanceMethods: {
			canLink: function() {
				return this.flags & 0x01;
			},
			hasAntiLock: function() {
				return this.flags & 0x02;
			},
			getContents: function() {
				return db.MUDObject.findAll({ where : {locationId: this.id}});
			}
		}
	});

	return MUDObject;
};
