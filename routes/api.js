"use strict";
module.exports = function(express,sequelize){

	//var express = require('express');
	var router = express.Router();

	var Config = require('../config.js');
	//DB
	//var Sequelize = require('sequelize');
	//var sequelize = new Sequelize(Config.pg);
	

	// models
	var User = sequelize.import('../models/user.js');
	var Ledger = sequelize.import('../models/ledger.js');
	// mongoose model -- for message board
	var Post = require('../models/post.js');


	// == API routes == //
	router.get('/user/transactions/count',function(req,res){
		if (req.user){
			Ledger.getNumUserTransactions(req.user.id).then(ledger=>{
				res.json({success:true,count:ledger[0].count});
			});
		} else {
			res.json({error:'user not logged in'});
		}
	});

	router.get('/user/transactions/people',function(req,res){
		if (req.user){
			Ledger.getNumPeopleUserTransactions(req.user.id).then(p=>{
				res.json({success:true,count:p[0].count});
			});
		} else {
			res.json({error:'user not logged in'});
		}
	});

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
	});

	router.get('/posts/recent',function(req,res){
		if (req.user){
			Post.find()
				.limit(5)
				.sort({datetime:-1})
				.exec((err,r)=>{
					res.json({success:true,records:r});
				});

		} else {
			res.json({error:'user not logged in'});
		}
	});



	return router;
}
//module.exports = router;