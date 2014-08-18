if (!global.hasOwnProperty('db')) {
  var Sequelize = require('sequelize');
  var sequelize = null;
 
  //choose database based on environment
  var dbUrl = process.env.HEROKU_POSTGRESQL_BRONZE_URL || "postgres://jsh2:@localhost:5432/comp3207";
  var match = dbUrl.match(/postgres:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)/);

  sequelize = new Sequelize(match[5], match[1], match[2], {
    dialect:  'postgres',
    protocol: 'postgres',
    port:     match[4],
    host:     match[3],
    logging:  true
  });
  
  global.db = {
    Sequelize:  Sequelize,
    sequelize:  sequelize,
    MUDObject:  sequelize.import(__dirname + '/mudobject')
  };
 
  // Objects contained inside the object
  global.db.MUDObject.hasMany(global.db.MUDObject, {as: 'contents', through: 'MUDObjectContents'});

  // Exits to the object (0..many for rooms; 0..1 for people [home])
  global.db.MUDObject.hasMany(global.db.MUDObject, {as: 'exits', through: 'MUDObjectExits'});

  //the parent container object
  global.db.MUDObject.belongsTo(global.db.MUDObject, {foreignKey: 'locationId', as: 'location'});

  // owner who controls this object
  global.db.MUDObject.belongsTo(global.db.MUDObject, {foreignKey: 'ownerId', as: 'owner'});
}

module.exports = global.db;