"use strict";

// config
var Config = require('../config.js');

// issue new coin from bank to user

var Sequelize = require('sequelize');
var sequelize = new Sequelize(Config.pg);

var Coin = sequelize.import('../models/coin.js');
var User = sequelize.import('../models/user.js');
var Ledger = sequelize.import('../models/ledger.js');

module.exports = function(userId,amt){
	return sequelize.transaction(function(t){
		// make sure the bank has that much!
		return Coin.countBankCoins().then(ct=>{
			if (ct < amt){
				throw new Error("bank doesn't have that much");
			} else {
				return Coin.getBankCoins(amt).then(coins=>{
					var promises = [];
					//var serials = [];
			        for (var i=0; i< coins.length; i++){
						var newPromise = coins[i].changeOwner(userId,t);
						promises.push(newPromise);
						//serials[i] = coins[i]	
					}
					console.log("PROMISES");
					console.log(promises.length);
					return Promise.all(promises).then(r=>{
						var ledgerPromises = [];
						// record in ledger
						for (var j=0; j< promises.length; j++){
							//var p = r[j];
							var sn = r[j].serialNum;
							
							var l = Ledger.create({
							  receiverId:userId,
							  coinSerialnum:sn
							},{transaction: t});
							ledgerPromises.push(l);
								
						} //end for
						return Promise.all(ledgerPromises);
						
						
						
						//.then(x=>{
						 // console.log("New coin to user # "+userId);
						//});
						
					});
				});
			}
		})
	});

}