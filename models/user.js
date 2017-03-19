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
		underscored: true,
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
				var q = 'SELECT count(*) FROM coins LEFT JOIN users on users.id = owner_id WHERE owner_id = ?';
				return sequelize.query(q,
				  { replacements: [this.id], type: sequelize.QueryTypes.SELECT }
				);
			},
			getUserLedger: function(limit){
				var limit = parseInt(limit);
				var q = 'SELECT ledger.*, u1.username AS sender, u2.username AS receiver, ';
				q += ' CASE ';
    			q += " WHEN sender_id <> :id AND sender_id IS NOT NULL THEN CONCAT('from ', u1.username) ";
    			q += " WHEN sender_id IS NULL THEN 'bank issue' ";
    			q += " WHEN receiver_id <> :id THEN CONCAT ('to ',u2.username) ";
  				q += ' END AS description, ',
				q += 'CASE WHEN sender_id = :id THEN -1 * amount ELSE amount END AS signed_amt, ';
				q += 'SUM(CASE WHEN sender_id = :id THEN -1 * amount ELSE amount END) ';
				q += 'OVER (ORDER BY ledger.created_at) AS balance ';
				q += 'FROM ledger ';
				q += 'LEFT JOIN users AS u1 ON u1.id = sender_id ';
				q += 'LEFT JOIN users AS u2 ON u2.id = receiver_id ';
				q += 'WHERE sender_id = :id OR receiver_id = :id ';
				q += 'ORDER BY created_at DESC';
				if (limit > 0){
					q += ' LIMIT :lmt';
				}
				return sequelize.query(q,
				  { replacements: {id:this.id,lmt:limit}, type: sequelize.QueryTypes.SELECT }
				)
			}
			 
		}
	});


	return User;
};