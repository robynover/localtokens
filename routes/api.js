"use strict";
var express = require('express');
var router = express.Router();

var Config = require('../config.js');
//DB
var Sequelize = require('sequelize');
var sequelize = new Sequelize(Config.pg);
// models
var User = sequelize.import('../models/user.js');


// == API routes == //
router.get('/user/transactions',function(req,res){
	if (req.user){
		var limit = 0;
		if (req.query.n){
			limit = parseInt(req.query.n);
		}
		User.findById(req.user.id).then(u=>{
			u.getUserLedger(limit).then(l=>{				
				res.json(l);
			});
		});	
	} else {
		res.json({error:'user not logged in'});
	}
});
router.get('/user/exists',function(req,res){
	//if (req.user){
	console.log(req.query.u);
		if (req.query.u){
			User.getByUsername(req.query.u).then(u=>{
				if (u){
					res.json({success:true,user_exisits:true});
				} else {
					res.json({error:'user does not exist',user_exisits:false});
				}
			});
		} else {
			res.json({error:'no username given'});
		}		
	//} else {
	//	res.json({error:'user not logged in'});
	//}
});

module.exports = router;