module.exports = function(sequelize, DataTypes) {
  return sequelize.define("MUDObject", {
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
  });
};