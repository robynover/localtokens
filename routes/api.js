"use strict";
module.exports = function(express,sequelize,app){

	//var express = require('express');
	var router = express.Router();
	
	var User = app.get('models').user;
	var Ledger = app.get('models').ledger;
	var Notification = app.get('models').notification;
	// // mongoose model -- for message board
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
					res.json({success:true,user_exists:true});
				} else {
					res.json({error:'user does not exist',user_exists:false});
				}
			});
		} else {
			res.json({error:'no username given'});
		}			
	});

	router.get('/user/notifications',function(req,res){
		if (req.user){
			Notification.findAll({
				where: {receiver_id: req.user.id},
				limit: 3,
				order:[['transaction_date', 'DESC']]
			}).then(n=>{
				if (n.length > 0){
					var notifications = [];
					
					// store the time of the most recent record
					var last_seen = n[0].transaction_date.getTime();
					for (var i in n){
						var amount;
						if (n[i].amount == 1){
							amount = "1 token";
						} else {
							amount = n[i].amount.toString() + " tokens";
						}
						var obj = {};
						obj.date = n[i].transaction_date;
						if (!n[i].sender_id){
							obj.message = 'The bank issued you ' + amount;
						} else {
							obj.message = n[i].sender_username + ' sent you ' +amount;
						}
						notifications.push(obj);
					}

					res.json({success:true,notifications:notifications,last_seen:last_seen});
				} else {
					res.json({error:'no results'});
				}
			});
			/*Notification.getUserNotifications(req.user.id).then(n=>{
				
			})*/
		} else {
			res.json({error:'user not logged in'});
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
};
