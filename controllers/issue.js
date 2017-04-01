"use strict";

module.exports = function(userId,amt,app,sequelize){
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