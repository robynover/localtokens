"use strict";

module.exports = function(sequelize, DataTypes) {
	var LedgerNote = sequelize.define('ledgernote', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		note:{
			type: DataTypes.TEXT
		}
		// ledger_id
	},{
		underscored: true,
		timestamps: false		
	});

	return LedgerNote;

};