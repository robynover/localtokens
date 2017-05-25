module.exports = function(sequelize, DataTypes) {

	var CreditRules = sequelize.define('credit_rules', {
	  id: {
	  	type: DataTypes.INTEGER,
	  	primaryKey: true,
	  	autoIncrement: true
	  },
	  rule_order: {
	  	type: DataTypes.INTEGER
	  },
	  benchmark: {
	  	type: DataTypes.INTEGER
	  },
	  gain: {
	  	type: DataTypes.INTEGER
	  }
	},{
		underscored: true,
		timestamps: false,
		freezeTableName: true,
		classMethods: {
			nextUserRule: function(user_id){
				var q = " SELECT * FROM credit_rules WHERE id = "
					  + " (SELECT MAX(rule_id)+1 FROM credits_granted WHERE user_id = :id); ";
				return sequelize.query(q,
				  { replacements: {id:user_id}, type: sequelize.QueryTypes.SELECT }
				);
			},
			userElgibleForRule: function(user_id,rule_id){
				var q = "SELECT ("
					  + "	SELECT " 
					  + "	   (SELECT SUM(amount) FROM ledger WHERE receiver_id=:uid AND sender_id IS NOT NULL) "
					  + "		- SUM(credit_given) "
					  + "		FROM credits_granted WHERE user_id = :uid "
					  + ") >= benchmark AS result FROM credit_rules WHERE id = :rid ";
				return sequelize.query(q,
				  { replacements: {uid:user_id,rid:rule_id}, type: sequelize.QueryTypes.SELECT }
				);
			}

		}
	});

	return CreditRules;
};