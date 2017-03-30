module.exports = function(sequelize, DataTypes) {

	var Notification = sequelize.define('notification', {
	  id: {
	  	type: DataTypes.INTEGER,
	  	primaryKey: true,
	  	autoIncrement: true
	  },
	  transaction_date: {
	  	type: 'TIMESTAMP WITH TIME ZONE'
	  },
	  sender_username:{
	  	type: DataTypes.STRING(32)
	  },
	  amount: {
	  	type: DataTypes.INTEGER
	  }
	},
	{
		underscored: true,
		timestamps: false,
		classMethods:{
			getUserNotifications: function(user_id){
				var q = "SELECT notifications.*, users.username AS sender FROM notifications ";
				q += " LEFT JOIN users ON users.id = sender_id "; 
				q += " WHERE receiver_id = ? LIMIT 3 ORDER BY transaction_date DESC";
				return sequelize.query(q,
				  { replacements: [user_id], type: sequelize.QueryTypes.SELECT }
				);
			}
		}
	});

	return Notification;

};