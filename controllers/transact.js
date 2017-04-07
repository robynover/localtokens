"use strict";

module.exports = function(sender,receiver,amt,note,app,sequelize){
  var User = app.get('models').user;
  var Coin = app.get('models').coin;
  var Ledger = app.get('models').ledger;
  var Note = app.get('models').ledgernote;

  var ln = Ledger.belongsTo(Note,{as:'note'});

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
          amount: amt,
          note: {note:note}
        },
        {
          include: [ln],
          transaction: t,
        }).then(l=>{
          //console.log(l);
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
        });


      } //end if
      
    });
    
  });
};