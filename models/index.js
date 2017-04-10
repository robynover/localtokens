'use strict';

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(module.filename);
var env       = process.env.NODE_ENV || 'development';
var config    = require('../config.js')[env];
//var config    = require(__dirname + '/../config/config.json')[env];
var db        = {};

/*if (config.use_env_variable) {
  var sequelize = new Sequelize(process.env[config.use_env_variable]);
} else {
  var sequelize = new Sequelize(config.database, config.username, config.password, config);
}*/
var sequelize = new Sequelize(config.pg,{logging: false,timezone:'-04:00'});

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(function(file) {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// trigger/hook
db.ledger.afterCreate('notify',function(ledger, options) {
  return db.user.findById(Ledger.sender_id,{
    //attributes: ['username']
  }).then(u=>{
      var obj = {
        receiver_id:ledger.receiver_id,
        sender_id: ledger.sender_id,
        transaction_date: ledger.created_at,
        ledger_id: ledger.id,
        amount: ledger.amount
      };
      if (u){ //if it had a sender_id, get the user attached to it
          obj.sender_username = u.username;
      }

      return db.notification.create(obj,
      {
        transaction: options.transaction
      });
  });

  
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
