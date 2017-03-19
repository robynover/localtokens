"use strict";

// config
var Config = require('../config.js');

var Sequelize = require('sequelize');
// DB
var sequelize = new Sequelize(Config.pg);

var User = sequelize.import('./user.js');
//var Ledger = sequelize.import('./ledger.js');

module.exports = function(sequelize, DataTypes) {
	var Coin =  sequelize.define('coin', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		serial_num: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV1,
			unique: true
		},
		in_circulation: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		value: {
			type: DataTypes.INTEGER,
			defaultValue: 1
		}

	},{
		underscored: true,
		classMethods:{
			countUserCoins: function(userId) {
				return Coin.count({
					where:{owner_id:userId}
				});
			},
			getUserCoins: function(userId,limit){
				return Coin.findAll({
					where:{owner_id:userId},
					limit: limit
				});
			},
			countBankCoins: function(){
				return Coin.count({
					where:{owner_id:null}
				});
			},
			getBankCoins: function(limit){
				return Coin.findAll({
					where:{owner_id:null},
					limit: limit
				});
			},
			getBankLedger: function(){
				var q = 'SELECT coins.*, username ';
				q += ' FROM coins ';
				q += ' LEFT JOIN users ON users.id = owner_id ';
				q += ' ORDER BY created_at DESC';
				return sequelize.query(q, { type: sequelize.QueryTypes.SELECT});
			}
			
		},
		instanceMethods:{
			changeOwner: function(newOwnerId,t){
				if (t){
					var option = {transaction: t};
					//console.log("GOT t");
				} else {
					var option = {};
					//console.log("NO t");
				}
				//console.log("OPTION");
				//console.log(option);
				return this.update({owner_id:newOwnerId,in_circulation:true},option);
			}
		}
	   
	});

	Coin.belongsTo(User,{as: 'owner'}); // creates 'ownerId' column
	//Coin.belongsToMany(Ledger, {through: 'LedgerCoin'});

	return Coin;
};
