"use strict";

module.exports = function(sequelize){
  // load models
  var models = [
    'coin',
    'ledger',
    'notification',
    'user'
  ];
  var m = {};
  models.forEach(function(model) {
    //module.exports[model] = sequelize.import(__dirname + '/' + model);
    
    m[model] = sequelize.import(__dirname + '/' + model);
  });

// describe relationships
//(function(m) {


  m.ledger.belongsTo(m.user, { foreignKey: {name: 'sender_id'} }); // creates senderId col
  m.ledger.belongsTo(m.user, { foreignKey: {name: 'receiver_id',allowNull: false} }); // creates receiverId col
  m.ledger.belongsToMany(m.coin,{ through: 'ledger_coin'});
  m.coin.belongsToMany(m.ledger, {through: 'ledger_coin'});
  m.coin.belongsTo(m.user,{as: 'owner'}); // creates 'ownerId' column
  m.notification.belongsTo(m.user,{as: 'receiver'}); //receiver_id col
  m.notification.belongsTo(m.user,{as: 'sender'}); //sender_id col
  m.notification.belongsTo(m.ledger,{as: 'ledger'}); //ledger_id col

  // trigger/hook
  m.ledger.afterCreate('notify',function(ledger, options) {
    return m.user.findById(ledger.sender_id,{
      //attributes: ['username']
    }).then(u=>{
        var obj = {
          receiver_id:ledger.receiver_id,
          sender_id: ledger.sender_id,
          transaction_date: ledger.created_at,
          ledger_id: ledger.id,
          amount: ledger.amount
        };
        if (u){ //if it had a sender_id, get the user attached to it
            obj.sender_username = u.username;
        }

        return m.notification.create(obj,
        {
          transaction: options.transaction
        });
    });

    
  });
  return m;
//})(module.exports);
};
// export connection
//module.exports.sequelize = sequelize;