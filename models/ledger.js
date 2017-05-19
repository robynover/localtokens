'use strict';

module.exports = function(sequelize, DataTypes) {
	var Ledger = sequelize.define('ledger', {
	  id: {
	  	type: DataTypes.INTEGER,
	  	primaryKey: true,
	  	autoIncrement: true
	  },
	  sender_id: {
	  	type: DataTypes.INTEGER
	  },
	  receiver_id: {
	  	type: DataTypes.INTEGER
	  },
	  amount: {
	  	type: DataTypes.FLOAT
	  },
	  transaction_timestamp: {
	  	type: DataTypes.DATE,
	  	defaultValue: sequelize.fn('NOW')
	  },
	  note:{
		type: DataTypes.STRING(255)
	  }
	},
	{
		underscored: true,
		freezeTableName: true,
		timestamps: false,
		classMethods:{
			associate: function(models) {
				Ledger.belongsTo(models.user, { 
					foreignKey: {
						name: 'sender_id'
					} 
				});
				Ledger.belongsTo(models.user, { 
					foreignKey: {
						name: 'receiver_id',
						allowNull: false
					} 
				});	
			},
			getTransactions: function(limit,offset){
				limit = parseInt(limit);
				offset = parseInt(offset);
				var q = 'SELECT ledger.*, u1.username AS sender, u2.username AS receiver, '
					   + "to_char(ledger.transaction_timestamp , 'Mon DD YYYY HH12: MI AM') AS formatted_date, "
					   + 'COUNT(ledger.id) OVER () AS total_entries '
					   + 'FROM ledger '
					   + 'LEFT JOIN users AS u1 ON u1.id = sender_id ' 
					   + 'LEFT JOIN users AS u2 ON u2.id = receiver_id '
					   + 'ORDER BY transaction_timestamp DESC '
					   + 'OFFSET :offset LIMIT :limit';
				return sequelize.query(q,
				  { replacements: {offset:offset,limit:limit}, type: sequelize.QueryTypes.SELECT }
				);
			},
			getCirculation: function(){
				var q = 'SELECT SUM(amount) FROM ledger';
				return sequelize.query(q,
				  { type: sequelize.QueryTypes.SELECT }
				);
			},
			getUserExchangeRatio: function(userid){
				var q = '  SELECT COUNT(*),'
					  + '	CASE  '
					  + "	 WHEN sender_id = :uid THEN 'spent' "
				 	  + "	 WHEN receiver_id = :uid THEN 'gained' "
					  + '	END AS action'
					  + '  FROM ledger '
				      + '  WHERE sender_id = :uid OR receiver_id = :uid AND sender_id IS NOT NULL '
					  + '  GROUP BY action ';	 
				return sequelize.query(q,
				  { replacements: {uid:userid}, type: sequelize.QueryTypes.SELECT }
				);
			},
			
			getNumUserTransactions: function(userid){
				var q = 'SELECT COUNT(*) FROM ledger '
				      + ' WHERE sender_id = :uid OR receiver_id = :uid AND sender_id IS NOT NULL';
				return sequelize.query(q,
				  { replacements: {uid:userid}, type: sequelize.QueryTypes.SELECT }
				);
			},
			getNumPeopleUserTransactions: function(userid){
				var q = 'SELECT COUNT(*) FROM ('
					  + '  SELECT '
					  + '	CASE  '
					  + '	 WHEN sender_id = :uid THEN receiver_id '
				 	  + '	 WHEN receiver_id = :uid THEN sender_id '
					  + '	END AS other_person '
					  + '  FROM ledger '
				      + '  WHERE sender_id = :uid OR receiver_id = :uid AND sender_id IS NOT NULL '
					  + '  GROUP BY other_person '
					  + ') AS p';
				return sequelize.query(q,
				  { replacements: {uid:userid}, type: sequelize.QueryTypes.SELECT }
				);
			}
		},
		hooks: {
			afterCreate: function(ledger, options) {
        		return sequelize.models.user.findById(ledger.sender_id,{
        		  //attributes: ['username']
        		}).then(u=>{
        		    var obj = {
        		      receiver_id:ledger.receiver_id,
        		      sender_id: ledger.sender_id,
        		      transaction_date: ledger.transaction_timestamp,
        		      ledger_id: ledger.id,
        		      amount: ledger.amount
        		    };
        		    if (u){ //if it had a sender_id, get the user attached to it
        		        obj.sender_username = u.username;
        		    }

        		    return sequelize.models.notification.create(obj);
        		});
      		}
		}
	});
	return Ledger;
};
