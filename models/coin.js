"use strict";

module.exports = function(sequelize, DataTypes) {
	var User = sequelize.import('./user.js');

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
				var q = 'SELECT coins.*, username, ';
				q += " to_char(coins.created_at, 'Mon DD YYYY HH12: MI AM') AS formatted_date ";
				q += ' FROM coins ';
				q += ' LEFT JOIN users ON users.id = owner_id ';
				q += ' ORDER BY created_at DESC';
				return sequelize.query(q, { type: sequelize.QueryTypes.SELECT});
			}
			
		},
		instanceMethods:{
			changeOwner: function(newOwnerId,t){
				var option = {};
				if (t){
					option = {transaction: t};
				} 
				//console.log("OPTION");
				//console.log(option);
				return this.update({owner_id:newOwnerId,in_circulation:true},option);
			}
		}
	   
	});

	Coin.belongsTo(User,{as: 'owner'}); // creates 'ownerId' column
	
	return Coin;
};
