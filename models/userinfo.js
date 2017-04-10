"use strict";
var gm = require('gm').subClass({imageMagick: true});

module.exports = function(sequelize, DataTypes) {
	var UserInfo = sequelize.define('userinfo', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		profile_text:{
			type: DataTypes.TEXT
		},
		profile_photo: {
			type: DataTypes.STRING(255)
		}
		// user_id
	},{
		underscored: true,
		freezeTableName: true,
		classMethods: {
			associate: function(models){
				UserInfo.belongsTo(models.user,{as:'user'});
			},
			sizePhoto: function(filepath,callback){
				gm(filepath)
				.autoOrient()
    			.resize(350)  // max 350 width
    			.write(filepath, function (err) {
    				if (err){
    				  console.log(err);
    				} else {
    					callback();
    				}
    			})
			}
		}
	});

	return UserInfo;

};