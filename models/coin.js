"use strict";

// config
var Config = require('../config.js');

var Sequelize = require('sequelize');
// DB
var sequelize = new Sequelize(Config.pg);

var User = sequelize.import('./user.js');

module.exports = function(sequelize, DataTypes) {
	var Coin =  sequelize.define('coin', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		serialNum: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV1,
			unique: true
		},
		inCirculation: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		value: {
			type: DataTypes.INTEGER,
			defaultValue: 1
		}

	},{
		classMethods:{
			countUserCoins: function(userId) {
				return Coin.count({
					where:{ownerId:userId}
				});
			},
			getUserCoins: function(userId,limit){
				return Coin.findAll({
					where:{ownerId:userId},
					limit: limit
				});
			},
			countBankCoins: function(){
				return Coin.count({
					where:{ownerId:null}
				});
			},
			getBankCoins: function(limit){
				return Coin.findAll({
					where:{ownerId:null},
					limit: limit
				});
			},
			getBankLedger: function(){
				var q = 'SELECT coins.*, username FROM coins LEFT JOIN users ON users.id = "ownerId" ';
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
				return this.update({ownerId:newOwnerId,inCirculation:true},option);
			}
		}
	   
	});

	Coin.belongsTo(User,{as: 'owner'}); // creates 'ownerId' column

	return Coin;
};
