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
	  },
	  amount: {
	  	type: DataTypes.INTEGER
	  }
	},
	{
		underscored: true,
		freezeTableName: true,
		classMethods:{
			getRecords: function(){
				var q = 'SELECT ledger.*, sender.username AS sender, receiver.username AS receiver ';
				q += ' FROM ledger ';
				//q += ' LEFT JOIN ledger_coin ON ledger_id = ledger.id '; 
				//q += ' LEFT JOIN coins ON coin_id=coins.id '; 
				q += ' LEFT JOIN users AS sender ON sender.id = "sender_id" ';
				q += ' LEFT JOIN users as receiver ON receiver.id = "receiver_id" ';
				q += ' ORDER BY created_at DESC ';
				return sequelize.query(q, { type: sequelize.QueryTypes.SELECT});
			}
			
		},
		instanceMethods:{
			associateCoins: function(coins){
				//var q = "INSERT INTO ledger_coin (ledger_id,coin_id) VALUES ()"
			}
		}
	});

	Ledger.belongsTo(User, { foreignKey: {name: 'sender_id'} }); // creates senderId col
	Ledger.belongsTo(User, { foreignKey: {name: 'receiver_id',allowNull: false} }); // creates receiverId col
	//Ledger.belongsTo(Coin,{foreignKey: 'coinSerialnum', targetKey: 'serialNum'}); // coinSerialnum column
	//Ledger.belongsToMany(Coin, { through: 'LedgerCoin', foreignKey: 'ledgerId', otherKey: 'coinId'});
	Ledger.belongsToMany(Coin,{ through: 'ledger_coin'});
	Coin.belongsToMany(Ledger, {through: 'ledger_coin'});
	return Ledger;

};