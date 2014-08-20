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
		/* boolean operation that is required to use object (as a string) */
		key: {
			type: DataTypes.TEXT,
			allowNull: false,
			defaultValue: "true"
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
	  			// Objects contained inside the object
	  			MUDObject.hasMany(MUDObject, {as: 'contents', through: 'MUDObjectContents'});

	  			// Exits to the object (0..many for rooms; 0..1 for people [home])
				MUDObject.hasMany(MUDObject, {as: 'exits', through: 'MUDObjectExits'});

				//the location of the object (or where it links to for exits)
				MUDObject.belongsTo(MUDObject, {foreignKey: 'locationId', as: 'location'});

				// owner who controls this object
				MUDObject.belongsTo(MUDObject, {foreignKey: 'ownerId', as: 'owner'});
			}
		}
	});

	return MUDObject;
};
