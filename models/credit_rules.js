module.exports = function(sequelize, DataTypes) {

	var CreditRules = sequelize.define('credit_rules', {
	  id: {
	  	type: DataTypes.INTEGER,
	  	primaryKey: true,
	  	autoIncrement: true
	  },
	  rule_order: {
	  	type: DataTypes.INTEGER,
	  	unique: true
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
				var q = " SELECT * FROM credit_rules WHERE rule_order = "
					  + " (SELECT MAX(credit_rules.rule_order)+1 FROM credits_granted "
					  + " LEFT JOIN credit_rules ON rule_id = credit_rules.id "
					  + " WHERE user_id = :id); ";
				return sequelize.query(q,
				  { replacements: {id:user_id}, type: sequelize.QueryTypes.SELECT }
				);
			},
			userEligibleForRule: function(user_id,rule_num,CreditsGranted){
				// does user have any records in the table already?
				return CreditsGranted.userHasHistory(user_id)
					.then(ct=>{
						if (ct[0].count == 0){
							// don't ref table
							var q = "SELECT "
								  + "	(SELECT SUM(amount) FROM ledger WHERE receiver_id=:uid AND sender_id IS NOT NULL) "
								  + " >= benchmark AS result FROM credit_rules WHERE rule_order = :rid ";
						} else {
							var q = "SELECT ("
								  + "	SELECT " 
								  + "	   (SELECT SUM(amount) FROM ledger WHERE receiver_id=:uid AND sender_id IS NOT NULL) "
								  + "		- SUM(credit_given) "
								  + "		FROM credits_granted WHERE user_id = :uid "
								  + ") >= benchmark AS result FROM credit_rules WHERE rule_order = :rid ";
						}

						return sequelize.query(q,
						  { replacements: {uid:user_id,rid:rule_num}, type: sequelize.QueryTypes.SELECT }
						);
					});

			}

		}
	});

	return CreditRules;
};