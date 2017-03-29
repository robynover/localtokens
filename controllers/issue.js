"use strict";

// config
var Config = require('../config.js');

// issue new coin from bank to user

var Sequelize = require('sequelize');
var sequelize = new Sequelize(Config.pg);

// var Coin = sequelize.import('../models/coin.js');
// var User = sequelize.import('../models/user.js');
// var Ledger = sequelize.import('../models/ledger.js');

// var models = require('../models');
// var Coin = models.coin;
// var User = models.user;
// var Ledger = models.ledger;

module.exports = function(userId,amt,app){
	var User = app.get('models').user;
	var Coin = app.get('models').coin;
	var Ledger = app.get('models').ledger;

	return sequelize.transaction(function(t){
		// make sure the bank has that much!
		return Coin.countBankCoins().then(ct=>{
			if (ct < amt){
				throw new Error("bank doesn't have that much");
			} else {
				return Coin.getBankCoins(amt).then(coins=>{
					// create a record in the ledger
					return Ledger.create({
						receiver_id:userId,
						amount: amt
					},{transaction: t}).then(l=>{
						var promises = [];
						var coin_ids = [];
				        for (var i=0; i< coins.length; i++){
				        	// collect coin ids
				        	coin_ids.push(coins[i].id);
				        	// change owner of each coin
							var p = coins[i].changeOwner(userId,t);
							promises.push(p);
						}
						return Promise.all(promises).then(r=>{
							// attach all coins to ledger record in join table
							return l.setCoins(coin_ids,{transaction:t}).then(sc=>{
								return coins;
							});
						});
					});

					
				});
			}
		});
	});

};