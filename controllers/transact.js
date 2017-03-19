"use strict";

// config
var Config = require('../config.js');
var Sequelize = require('sequelize');
// DB
var sequelize = new Sequelize(Config.pg);

var Coin = sequelize.import('../models/coin.js');
var User = sequelize.import('../models/user.js');
var Ledger = sequelize.import('../models/ledger.js');

module.exports = function(sender,receiver,amt){
  return sequelize.transaction(function(t){
    // first check if sender has enough coins
    return Coin.countUserCoins(sender).then(ct=>{
      // if sender has enough
      if (ct < amt){
        throw new Error("sender doesn't have enough coins");
      } else {
        // Create ledger record
        return Ledger.create({
          receiver_id: receiver,
          sender_id: sender,
          amount: amt
        },
        {
          transaction: t,
        }).then(l=>{
          //get sender's coins
          return Coin.getUserCoins(sender,amt).then(coins=>{
              var coin_ids = [];
              var promises = [];
              for (var i = 0; i < coins.length; i++){
                // change owner
                promises.push(coins[i].changeOwner(receiver,t));
                // collect ids
                coin_ids.push(coins[i].id);
              }
              return Promise.all(promises).then(p=>{
                  // add all the coins to the ledger (join table)
                  return l.setCoins(coin_ids,{transaction:t});
              });
    
          });
        })


      } //end if
      
    });
    
  });
}