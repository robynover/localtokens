'use strict';

module.exports = function(sequelize, DataTypes) {
  var Item = sequelize.define('item', {
  	id: {
  	  type: DataTypes.INTEGER,
  	  primaryKey: true,
  	  autoIncrement: true
  	},
  	description: {
  		type: DataTypes.STRING(255)
  	},
  	offering_seeking: {
  		type: DataTypes.ENUM('offering', 'seeking')
  	}

  }, {
  	underscored:true,
  	timestamps:false,
  	classMethods: {
  	  associate: function(models) {
  	  	Item.belongsTo(models.user);
  	  },
      getItems: function(type){
        if (type != 'offering'){
          type = 'seeking';
        }
        /*return Item.findAll({
          where: {offering_seeking: type}
        });*/
        var q = 'SELECT items.*, users.username FROM items '
              + 'LEFT JOIN users ON users.id = items.user_id '
              + 'WHERE offering_seeking = :os';
        return sequelize.query(q,
          { replacements: {os:type}, type: sequelize.QueryTypes.SELECT }
        );

      }
  	}
  });
  return Item;
};