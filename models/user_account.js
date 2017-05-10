'use strict';

module.exports = function(sequelize, DataTypes) {
  var UserAcct = sequelize.define('user_account', {
  	id: {
  	  type: DataTypes.INTEGER,
  	  primaryKey: true,
  	  autoIncrement: true
  	},
  	balance: {
  		type: DataTypes.INTEGER,
  		defaultValue: 0
  	}

  }, {
  	underscored:true,
  	timestamps:false,
  	classMethods: {
  	  associate: function(models) {
  	    UserAcct.belongsTo(models.user); //user_id field    
  	  }
  	}
  });
  return UserAcct;
};