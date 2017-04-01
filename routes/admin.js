"use strict";
module.exports = function(express,sequelize,app){

	//var express = require('express');
	var router = express.Router();

	var User = app.get('models').user;
	var Coin = app.get('models').coin;
	var Ledger = app.get('models').ledger;

	// controllers
	var Issue = require('../controllers/issue.js');

	// === require admin users for this section=== //
	router.all('/*',function(req,res,next){
		if (req.user){
			User.findById(req.user.id).then(u=>{
				if (u.isAdmin()){
					next();
				} else {
					res.status(401);
					res.render('generic',{msg:'You are not authorized to view this page'});
				}	
			});
		} else {
			res.status(401);
			res.render('generic',{msg:'You are not authorized to view this page'});
		}	
	});

	// ======= ADMIN routes ======= //
	
	router.get('/',function(req,res){
		res.redirect('/admin/ledger');
	});

	router.get('/mint',function(req,res){
		var context = {};
		context.layout = 'admin';
		if (req.user){
			context.username = req.user.username;
			context.loggedin = true;
		}
		res.render('mintform',context);
	});
	
	router.post('/mint', function(req,res){
		Coin.create({}).then(c=>{
			var context = {};
			context.msg = "New coin created with Serial # " + c.serial_num;
			context.layout = 'admin';

			if (req.user){
				context.username = req.user.username;
				context.loggedin = true;
			}
			res.render('generic',context);
		});
	});

	router.get('/ledger',function(req,res){

		var perPg = 10;
		var pg = 0;
		if (req.query.pg){
			pg = parseInt(req.query.pg) - 1;
		}
		var offset = pg * perPg;
		var total_entries, total_pages;

		Ledger.getRecords(perPg,offset).then(l=>{
			if (l.length > 0){ // correct for empty result set
				total_entries = l[0].total_entries;
				total_pages = Math.ceil(l[0].total_entries / perPg);
			}
			
			pg = pg + 1;

			let context = {};
			context.pagetitle = 'Ledger';
			context.records = l;
			context.loggedin = true;
			if (pg + 1 <= total_pages){
				context.nextpage = pg + 1;
			}
			if (pg - 1 > 0){
				context.prevpage = pg - 1;
			}
			context.page = pg;
			context.total_entries = total_entries;
			context.total_pages = total_pages;
			context.layout = 'admin';
			if (req.user){
				context.username = req.user.username;
			}
			res.render('ledger',context);
		});
	});	

	router.get('/bank',function(req,res){
		var perPg = 10;
		var pg = 0;
		if (req.query.pg){
			pg = parseInt(req.query.pg) - 1;
		}
		var offset = pg * perPg;
		var context = {};
		// get the total num coins in the bank
		Coin.count({ where: {owner_id: null} }).then(function(c) {
			context.bankcount = c;

			Coin.getBankLedger(perPg,offset).then(l=>{
				var total_entries = l[0].total_entries;
				var total_pages = Math.ceil(l[0].total_entries / perPg);
				pg = pg + 1;
				
				context.pagetitle = "Bank";
				context.records = l;
				context.layout = 'admin';
				if (pg + 1 <= total_pages){
					context.nextpage = pg + 1;
				}
				if (pg - 1 > 0){
					context.prevpage = pg - 1;
				}
				context.page = pg;
				context.total_entries = total_entries;
				context.total_pages = total_pages;

				if (req.user){
					context.username = req.user.username;
				}
				res.render('bank',context);
			});

		});

	});

	router.get('/bestow',function(req,res){
		var context = {};
		context.layout = 'admin';
		context.loggedin = true;
		if (req.user){
			context.username = req.user.username;
		}
		res.render('bestowform',context);
	});

	router.post('/bestow',function(req,res){
		var username = req.body.receiver;
		var amt = parseInt(req.body.num);
		if (amt <= 10 && amt > 0){
			User.getIdByUsername(username).then(u=>{
				var uid = u[0].id;
				if (uid > 0){
					Issue(uid,amt,app,sequelize).then(r=>{
						var msg = 'The following coins were bestowed on user ' + username + ':<br>';
						for (var i = 0; i<r.length; i++){
							msg += '<li>' + r[i].serial_num + '</li>';
						}
						var context = {};
						context.msg = msg;
						context.layout = 'admin';
						context.loggedin = true;
						if (req.user){
							context.username = req.user.username;
						}
						res.render('generic',context);
						//console.log(r);
					}).catch(err=>{
						console.log('ERROR');
						console.log(err);
						res.status(500);
						res.render('generic',{msg:err});
					});
				} else {
					res.status(422);
					res.render('generic',{msg:'No user id supplied'});
				}
			});	
		} else {
			res.status(422);
			res.render('generic',{msg:'You can only bestow 10 tokens max at one time'});
		}
		
	});

	router.get('/users',function(req,res){
		var context = {};
		context.layout = 'admin';
		if (req.user){
			context.username = req.user.username;
		}
		var unactivated = false;
		if (req.query.unact){
			unactivated = true;
		}
		User.getUsersWithBalance(unactivated).then(users=>{
			context.users = users;
			res.render('users',context);
		});
	});

	router.post('/users/activate',function(req,res){
		User.update(
		    { is_active: true }, 
		    { where: { id: req.body.userids }} 
		).then(users=>{
			//console.log(users);
			res.json({ok:true});
		}).catch(err=>{
			res.json({ok:false});
		});

	});

	return router;
};
