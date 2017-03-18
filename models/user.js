"use strict";

var Config = require('../config.js');
var Sequelize = require('sequelize');
var sequelize = new Sequelize(Config.pg);
const crypto = require('crypto');

//var Coin = sequelize.import('./coin.js');

module.exports = function(sequelize, DataTypes) {
	var User = sequelize.define('user', {
	  id: {
	  	type: DataTypes.INTEGER,
	  	primaryKey: true,
	  	autoIncrement: true
	  },
	  username: {
	    type: DataTypes.STRING,
	    unique: true
	  },
	  password: {
	  	type: DataTypes.STRING(64)
	  }
	},{
		classMethods:{
			getByUsername: function(username){
				return User.findOne({
					where:{username:username}
				});
			}
		},
		instanceMethods:{
			verifyPassword: function(pw){
				const hash = crypto.createHmac('sha256', Config.salt)
				                   .update(pw)
				                   .digest('hex');
				return hash == this.password;
			},
			getAcctBalance: function(){
				var q = 'SELECT count(*) FROM coins LEFT JOIN users on users.id = "ownerId" WHERE "ownerId" = ?';
				return sequelize.query(q,
				  { replacements: [this.id], type: sequelize.QueryTypes.SELECT }
				);
			},
			getUserLedger: function(){
				//var q = 'SELECT * FROM ledger WHERE "senderId"=? OR "receiverId"=? ORDER BY "createdAt" DESC';
				var q = 'SELECT ledger.*,u1.username AS sender, u2.username AS receiver ';
				q += ' FROM ledger LEFT JOIN users AS u1 ON u1.id = "senderId" ';
				q += ' LEFT JOIN users AS u2 ON u2.id = "receiverId" ';
				q += ' WHERE "senderId"=1 OR "receiverId"=1 ';
				q += ' ORDER BY "createdAt" DESC ';
				return sequelize.query(q,
				  { replacements: [this.id,this.id], type: sequelize.QueryTypes.SELECT }
				)
			}
			 
		}
	});


	return User;
};