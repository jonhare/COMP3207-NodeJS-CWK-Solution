/**
 * models/index.js
 * 
 * Entry point for sequelize database definition
 *
 * @author Jonathon Hare (jsh2@ecs.soton.ac.uk)
 */
if (!global.hasOwnProperty('db')) {
  var Sequelize = require('sequelize');
  var sequelize = null;

  //choose database based on environment -- edit to suit your heroku and development databases
  var dbUrl = process.env.HEROKU_POSTGRESQL_GREEN_URL || "postgres://jsh2:@localhost:5432/comp3207";
  
  //parse the url
  var match = dbUrl.match(/postgres:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)/);

  // construct the sequelize object
  sequelize = new Sequelize(match[5], match[1], match[2], {
    dialect:  'postgres',
    protocol: 'postgres',
    port:     match[4],
    host:     match[3],
    logging:  console.log
  });
  
  //define the database
  global.db = {
    Sequelize:  Sequelize,
    sequelize:  sequelize,
    MUDObject:  sequelize.import(__dirname + '/mudobject')
  };

  //add relations/assocations by calling the `associate` method defined in the model
  Object.keys(global.db).forEach(function(modelName) {
    if ('associate' in global.db[modelName]) {
      db[modelName].associate(db);
    }
  });
}

module.exports = global.db;