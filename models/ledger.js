"use strict";

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
	  	type: DataTypes.INTEGER
	  }
	},
	{
		underscored: true,
		freezeTableName: true,
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
				Ledger.belongsToMany(models.coin,{ 
					through: 'ledger_coin'
				});
				Ledger.hasOne(models.ledgernote,{
					as:'note'
				});
			},
			getRecords: function(limit,offset){
				limit = parseInt(limit);
				offset = parseInt(offset);
				// heads up! time zone is hard-coded here
				var q = 'SELECT ledger.*, sender.username AS sender, receiver.username AS receiver, ';
				q += " to_char(ledger.created_at AT TIME ZONE 'America/New_York', 'Mon DD YYYY HH12: MI AM') AS formatted_date, ";
				q += ' COUNT(ledger.id) OVER () AS total_entries ';
				q += ' FROM ledger ';
				q += ' LEFT JOIN users AS sender ON sender.id = "sender_id" ';
				q += ' LEFT JOIN users as receiver ON receiver.id = "receiver_id" ';
				q += ' ORDER BY created_at DESC ';
				if (limit > 0){
					q += ' LIMIT :lmt';
				}
				if (offset > 0){
					q += ' OFFSET :offset';
				}
				return sequelize.query(q,
				  { replacements: {lmt:limit,offset:offset}, type: sequelize.QueryTypes.SELECT }
				);
			},
			getNumUserTransactions: function(userid){
				var q = 'SELECT COUNT(*) FROM ledger ';
				q += ' WHERE sender_id = :uid OR receiver_id = :uid AND sender_id IS NOT NULL';
				return sequelize.query(q,
				  { replacements: {uid:userid}, type: sequelize.QueryTypes.SELECT }
				);
			},
			getNumPeopleUserTransactions: function(userid){
				var q = 'SELECT COUNT(*) FROM (';
				q += '	SELECT ';
				q += '	CASE  ';
				q += '	 WHEN sender_id = :uid THEN receiver_id ';
				q += '	 WHEN receiver_id = :uid THEN sender_id ';
				q += '	END AS other_person ';
				q += '	FROM ledger ';
				q += '	WHERE sender_id = :uid OR receiver_id = :uid AND sender_id IS NOT NULL ';
				q += '	GROUP BY other_person ';
				q += ') AS p';
				return sequelize.query(q,
				  { replacements: {uid:userid}, type: sequelize.QueryTypes.SELECT }
				);
			}
			
		}
		
	});


	return Ledger;

};