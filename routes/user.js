"use strict";
var striptags = require('striptags');
var Sequelize = require('sequelize');
var passport = require('passport');

module.exports = function(express,app){

	var router = express.Router();
	
	var User = app.get('models').user;
	var Ledger = app.get('models').ledger;
	var Post = require('../models/mongoose/post.js');

	router.get('/',(req,res)=>{
		if (req.user){
			res.redirect('/user/profile/'+req.user.username);
		} else {
			res.redirect('/signin');
		}
	});

	router.get('/ledger',(req,res)=>{
		if (req.user){
			var perPg = 10;
			var pg = 0;
			if (req.query.pg){
				pg = parseInt(req.query.pg) - 1;
			}
			var offset = pg * perPg;
			
			User.findById(req.user.id)
				.then(user=>{
					user.getLedgerWithBalance(perPg,offset)
						.then(ledger=>{
							var context = {};
							var total_entries = 0;
							var total_pages = 0;
							if(ledger.length > 0){
								total_entries = ledger[0].total_entries;
								total_pages = Math.ceil(ledger[0].total_entries / perPg);
								pg = pg + 1;
								context.ledger = ledger;
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
							context.pagetitle = "Ledger";
							context.loggedin = true;
							context.username = req.user.username;
							context.is_admin = req.user.is_admin;
							res.render('ledger-user',context);
						});
				})
				.catch(err=>{
					res.status(422);
					res.render('generic',{msg:err});
				});
		} else {
			res.redirect('/signin');
		}
	});

	router.get('/dashboard',(req,res)=>{
		if (req.user){
			var context = {};
			context.loggedin = true;
			context.username = req.user.username;
			context.is_admin = req.user.is_admin;
			context.credit = req.user.max_negative_balance;
			context.pagetitle = "Dashboard";

			Ledger.getUserExchangeRatio(req.user.id)
				.then(result=>{
					
					for (var i in result){
						if (result[i].action == 'spent'){
							context.spent = result[i].count;
						} else if (result[i].action == 'gained'){
							context.gained = result[i].count;
						}
					}
					User.findById(req.user.id)
						.then(user=>{
							user.getLedgerWithBalance(6)
								.then(ledger=>{
									context.ledger = ledger;
									res.render('dashboard3',context);
								});
						});
					
				})
				.catch(err=>{
					res.status(422);
					res.render('generic',{msg:err});
				});

		} else {
			res.redirect('/signin');
		}
	});

	router.get('/profile/:username',(req,res)=>{
		if (req.user){
			var context = {};
			context.loggedin = true;
			context.username = req.user.username;
			context.is_admin = req.user.is_admin;

			
			User.getByUsername(req.params.username)
				.then(user=>{
					context.user = user;
					context.pagetitle = user.username;
					Ledger.getUserExchangeRatio(user.id)
						.then(result=>{
							for (var i in result){
								if (result[i].action == 'spent'){
									context.spent = result[i].count;
								} else if (result[i].action == 'gained'){
									context.gained = result[i].count;
								}
							}
							res.render('profile3',context);
						})
					
				});
				
		} else {
			res.redirect('/signin');
		}
	});

	router.get('/search',(req,res)=>{
		if (req.user){
			var context = {};
			context.loggedin = true;
			context.username = req.user.username;
			context.is_admin = req.user.is_admin;
			context.pagetitle = "Find People";

			if (req.query.q){
				context.query = striptags(req.query.q);
				User.searchUsers(req.query.q)
					.then(users=>{
						context.users = users;
						res.render('user-search',context);
					});
			} else {
				User.getRecentUsers(21)
					.then(users=>{
						context.users = users;
						res.render('user-search',context);
					});
				
			}
			
		} else{
			res.redirect('/signin');
		}
	});


	return router;
}