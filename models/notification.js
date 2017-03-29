module.exports = function(sequelize, DataTypes) {

	var Notification = sequelize.define('notification', {
	  id: {
	  	type: DataTypes.INTEGER,
	  	primaryKey: true,
	  	autoIncrement: true
	  },
	  /*receiver_id: {
	  	type: DataTypes.INTEGER
	  },
	  sender_id: {
	  	type: DataTypes.INTEGER //relates to User, but can be null
	  },*/
	  transaction_date: {
	  	type: 'TIMESTAMP WITH TIME ZONE'
	  }
	  /*,
	  ledger_id{
	  	type: DataTypes.INTEGER
	  }*/
	});

	

	return Notification;

}