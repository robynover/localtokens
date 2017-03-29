"use strict";

var Sequelize = require("sequelize");
var Config = require('../config.js');
var sequelize = new Sequelize(Config.pg); //,{logging: false}

// load models
var models = [
  'coin',
  'ledger',
  'notification',
  'user'
];
models.forEach(function(model) {
  module.exports[model] = sequelize.import(__dirname + '/' + model);
});

// describe relationships
(function(m) {
  m.ledger.belongsTo(m.user, { foreignKey: {name: 'sender_id'} }); // creates senderId col
  m.ledger.belongsTo(m.user, { foreignKey: {name: 'receiver_id',allowNull: false} }); // creates receiverId col
  m.ledger.belongsToMany(m.coin,{ through: 'ledger_coin'});
  m.coin.belongsToMany(m.ledger, {through: 'ledger_coin'});
  m.coin.belongsTo(m.user,{as: 'owner'}); // creates 'ownerId' column
  m.notification.belongsTo(m.user,{as: 'receiver'}); //receiver_id col
  m.notification.belongsTo(m.user,{as: 'sender'}); //sender_id col
  m.notification.belongsTo(m.ledger,{as: 'ledger'}); //ledger_id col
})(module.exports);

// export connection
module.exports.sequelize = sequelize;