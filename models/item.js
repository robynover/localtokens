"use strict";
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
			type:   DataTypes.ENUM('offering', 'seeking')
		}
		
	},{
		underscored: true
	});

	return Item;
};