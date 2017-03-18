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
        // get coins from sender's account
        return Coin.getUserCoins(sender,amt).then(coins=>{
          // coins is an array
          //console.log(coins);
          var promises = [];
          for (var i=0; i< coins.length; i++){
            //console.log(coins[0].serialNum);
            // change owner
            //console.log(t);
            promises.push(coins[i].changeOwner(receiver,t));
          } //end for
          return Promise.all(promises).then(r=>{
            var ledgerPromises = [];
            // record in ledger
            for (var j=0; j< promises.length; j++){
              //var p = r[j];
              var sn = r[j].serialNum;
              
              var l = Ledger.create({
                receiverId:receiver,
                senderId:sender,
                coinSerialnum:sn
              },{transaction: t});
              ledgerPromises.push(l);
                
            } //end for
            return Promise.all(ledgerPromises);
            
          });
        }); 
      } //end if
      
    });
    
  });
}