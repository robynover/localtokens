"use strict";

var Config = require('../config.js');
var Sequelize = require('sequelize');
var sequelize = new Sequelize(Config.pg);
const crypto = require('crypto');

//var Coin = sequelize.import('./coin.js');
/*
isIn: {
  args: [['en', 'zh']],
  msg: "Must be English or Chinese"
}
 */
module.exports = function(sequelize, DataTypes) {
	var User = sequelize.define('user', {
	  id: {
	  	type: DataTypes.INTEGER,
	  	primaryKey: true,
	  	autoIncrement: true
	  },
	  username: {
	    type: DataTypes.STRING,
	    unique: true,
	    validate: {
	    	len: {
	    		args: [3,20],
	    		msg: 'Username must be between 3 and 20 characters'
	    	},
	    	isAlphanumeric: {msg: 'Username must be alphanumeric'}
	    }
	  },
	  password: {
	  	type: DataTypes.STRING(64),
	  	/*validate: { 
	  		len: {
	  			args: [6,64],
	  			msg: 'Password must be at least 6 characters'
	  		}
	  	}*/
	  },
	  email: {
	  	type: DataTypes.STRING(64),
	  	validate: {
	  		isEmail: {msg: 'Email is not valid'}
	  	},
	  	unique: {msg: 'Email is already in use'}
	  },
	  firstname:{
	  	type: DataTypes.STRING(64),
	  	validate: { 
	  		len: {
	  			args: [1,32],
	  			msg: 'First name is required'
	  		}
	  	}
	  },
	  lastname:{
	  	type: DataTypes.STRING(64)
	  },
	  is_admin: {
	  	type: DataTypes.BOOLEAN,
	  	defaultValue: false
	  },
	  is_active: {
	  	type: DataTypes.BOOLEAN,
	  	defaultValue: false
	  }
	},{
		underscored: true,
		classMethods:{
			getByUsername: function(username){
				return User.findOne({
					where:{username:username}
				});
			},
			getIdByUsername: function(username){
				var q = "SELECT id FROM users WHERE username = ?";
				return sequelize.query(q,
				  { replacements: [username], type: sequelize.QueryTypes.SELECT }
				);
			},
			encryptPassword: function(pw){
				const hash = crypto.createHmac('sha256', Config.salt)
			                   .update(pw)
			                   .digest('hex');
			    return hash;
			}
		},
		instanceMethods:{
			verifyPassword: function(pw){
				const hash = crypto.createHmac('sha256', Config.salt)
				                   .update(pw)
				                   .digest('hex');
				return hash == this.password;
			},
			isAdmin: function(){
				if (this.is_admin){
					return true;
				} else {
					return false;
				}
			},
			getAcctBalance: function(){
				var q = 'SELECT count(*) FROM coins LEFT JOIN users on users.id = owner_id WHERE owner_id = ?';
				return sequelize.query(q,
				  { replacements: [this.id], type: sequelize.QueryTypes.SELECT }
				);
			},
			getUserLedger: function(limit,offset){
				limit = parseInt(limit);
				offset = parseInt(offset);
				var q = "SELECT to_char(ledger.created_at, 'Mon DD YYYY HH12: MI AM') AS formatted_date, ";
				q += ' COUNT(ledger.id) OVER () AS total_entries, ';
				q += ' ledger.*, u1.username AS sender, u2.username AS receiver, ';
				q += ' CASE ';
    			q += " WHEN sender_id <> :id AND sender_id IS NOT NULL THEN CONCAT('from ', u1.username) ";
    			q += " WHEN sender_id IS NULL THEN 'bank issue' ";
    			q += " WHEN receiver_id <> :id THEN CONCAT ('to ',u2.username) ";
  				q += ' END AS description, ';
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
				if (offset > 0){
					q += ' OFFSET :offset';
				}
				return sequelize.query(q,
				  { replacements: {id:this.id,lmt:limit,offset:offset}, type: sequelize.QueryTypes.SELECT }
				);
			}
			 
		}
	});


	return User;
};