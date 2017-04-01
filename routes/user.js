"use strict";
module.exports = function(express,sequelize,app){

	//var express = require('express');
	var router = express.Router();
	
	var User = app.get('models').user;
	var Coin = app.get('models').coin;
	var Ledger = app.get('models').ledger;

	// controllers
	//var Issue = require('../controllers/issue.js');

	// ======= USER routes ======= //

	router.get('/',function(req,res,next){
		//console.log(req.user);
		if (req.user){
			res.redirect('/user/profile/'+req.user.username);
		} else {
			//next();
			res.redirect('/login');
		}
		
	});

	router.get('/dashboard',function(req,res){
		if (req.user){
			User.findById(req.user.id).then(u=>{
				var context = {};
				context.username = u.username;
				context.is_admin = u.is_admin;
				context.greeting = "Welcome "+ u.username + "!";
				u.getAcctBalance().then(b=>{
					context.balance = b[0].count;
					u.getUserLedger(6).then(l=>{
						context.ledger = l;
						context.loggedin = true;
						context.success = req.flash('success');
						res.render('dashboard',context);
					});
				});
				
			});	
		} else {
			res.redirect('/login');
		}
	});

	router.get('/profile/:username',function(req,res,next){
		if (req.user){
			User.getByUsername(req.params.username).then(u=>{
				if (!u){
					// go to 404
					next();
				} else{
					u.getAcctBalance().then(ct=>{
						var context = {};
						context.pagetitle = u.username;
						context.balance = ct[0].count;
						context.profile_user = u.username;
						context.loggedin = true;
						context.username = req.user.username;
						context.is_admin = req.user.is_admin;
						res.render('profile',context);
						
					});
				}	
			});
		} else {
			res.redirect('/login');
		}
	});

	router.get('/transactions',function(req,res,next){
		if (req.user){
			var perPg = 10;
			var pg = 0;
			if (req.query.pg){
				pg = parseInt(req.query.pg) - 1;
			}
			var offset = pg * perPg;
			var uid = req.user.id;
			User.findById(req.user.id).then(u=>{
				u.getUserLedger(perPg,offset).then(l=>{
					/*if (l.length < 1){
						throw new Error('There are currently no records in the ledger');
					} */
					var context = {};
					var total_entries = 0;
					var total_pages = 0;
					if (l.length > 0){
						total_entries = l[0].total_entries;
						total_pages = Math.ceil(l[0].total_entries / perPg);
						pg = pg + 1;
						context.ledger = l;
						if (pg + 1 <= total_pages){
							context.nextpage = pg + 1;
						}
						if (pg - 1 > 0){
							context.prevpage = pg - 1;
						}
						
					}
					context.page = pg;
					context.total_entries = total_entries;
					context.total_pages = total_pages;
					context.loggedin = true;
					context.username = req.user.username;
					if (req.user.is_admin){
						context.is_admin = true;
					}
					res.render('transactions',context);
				})
				.catch(err=>{
					//res.status(422);
					res.render('generic',{msg:err});
				});
			});
			
		} else {
			res.redirect('/login');
		}
	});
	return router;
};
