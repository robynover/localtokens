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
				/*return User.findOne({
					where:{username:this.username,password:hash}
				});*/
			},
			getAcctBalance: function(){
				var q = 'SELECT count(*) FROM coins LEFT JOIN users on users.id = "ownerId" WHERE "ownerId" = ?';
				return sequelize.query(q,
				  { replacements: [this.id], type: sequelize.QueryTypes.SELECT }
				);
			},
			getUserLedger: function(){
				var q = 'SELECT * FROM ledger WHERE "senderId"=? OR "receiverId"=?';
				return sequelize.query(q,
				  { replacements: [this.id,this.id], type: sequelize.QueryTypes.SELECT }
				)
			}
			 
		}
	});


	return User;
};