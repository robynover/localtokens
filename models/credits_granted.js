module.exports = function(sequelize, DataTypes) {

	var CreditsGranted = sequelize.define('credits_granted', {
	  id: {
	  	type: DataTypes.INTEGER,
	  	primaryKey: true,
	  	autoIncrement: true
	  },
	  amount_used: {
	  	type: DataTypes.INTEGER
	  },
	  credit_given: {
	  	type: DataTypes.INTEGER
	  }
	},{
		underscored: true,
		freezeTableName: true,
		classMethods: {
			associate: function(models){
				CreditsGranted.belongsTo(models.user);
				CreditsGranted.belongsTo(models.credit_rules,{
					as: 'rule'
				});
			},
			userHasHistory: function(user_id){
				var q = "SELECT COUNT(*) FROM credits_granted WHERE user_id = :id";
				return sequelize.query(q,
				  { replacements: {id:user_id}, type: sequelize.QueryTypes.SELECT }
				);
			}
		},
		hooks: {
			afterCreate: function(cg, options) {
				// give the credit
				var q = "UPDATE users SET max_negative_balance = (max_negative_balance + :new_credit) "
					  + "WHERE id = :user_id";
				return sequelize.query(q,
				  { replacements: {user_id:cg.user_id,new_credit:cg.credit_given}, type: sequelize.QueryTypes.SELECT }
				);
			}
		}
	});

	return CreditsGranted;
};