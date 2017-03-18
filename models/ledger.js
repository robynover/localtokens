"use strict";
// config
var Config = require('../config.js');

var Sequelize = require('sequelize');
// DB
var sequelize = new Sequelize(Config.pg);

var User = sequelize.import('./user.js');
var Coin = sequelize.import('./coin.js');

module.exports = function(sequelize, DataTypes) {
	var Ledger = sequelize.define('ledger', {
	  id: {
	  	type: DataTypes.INTEGER,
	  	primaryKey: true,
	  	autoIncrement: true
	  }
	},
	{
		classMethods:{
			getRecords: function(){
				var q = 'SELECT ledger.*, sender.username AS sender, receiver.username AS receiver ';
				q += 'FROM ledger LEFT JOIN users AS sender ON sender.id = "senderId" ';
				q += 'LEFT JOIN users as receiver ON receiver.id = "receiverId" ';
				return sequelize.query(q, { type: sequelize.QueryTypes.SELECT});
			}
			
		},
		freezeTableName: true
	});

	Ledger.belongsTo(User, { foreignKey: {name: 'senderId',allowNull: false} }); // creates senderId col
	Ledger.belongsTo(User, { as: 'receiver' }); // creates receiverId col
	Ledger.belongsTo(Coin,{foreignKey: 'coinSerialnum', targetKey: 'serialNum'}); // coinSerialnum column

	return Ledger;

};