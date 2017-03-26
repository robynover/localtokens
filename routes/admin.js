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
	var Coin = sequelize.import('../models/coin.js');
	var Ledger = sequelize.import('../models/ledger.js');

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
					res.send('You are not authorized to view this page');
				}	
			});
		} else {
			//res.send(401, 'Unauthorized');
			res.status(401);
			res.send('You are not authorized to view this page');
		}	
	});

	// ======= ADMIN routes ======= //

	router.get('/mint', function(req,res){
		Coin.create({}).then(c=>{
			var context = {};
			context.msg = "New coin created with Serial # " + c.serial_num;
			context.layout = 'admin';
			if (req.user){
				context.username = req.user.username;
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

		Ledger.getRecords(perPg,offset).then(l=>{
			var total_entries = l[0].total_entries;
			var total_pages = Math.ceil(l[0].total_entries / perPg);
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
		Coin.getBankLedger().then(l=>{
			let context = {};
			context.pagetitle = "Bank";
			context.records = l;
			context.layout = 'admin';
			if (req.user){
				context.username = req.user.username;
			}
			res.render('bank',context);
		});
	});

	router.get('/bestow',function(req,res){
		res.render('generic',{msg: 'Please choose a user',layout:'admin'});
	});

	router.get('/bestow/:userid',function(req,res){
		let uid = req.params.userid;
		let amt = 1;
		if (uid > 0){
			Issue(uid,amt).then(r=>{
				var msg = 'The following coins were bestowed on user #' + uid + ':<br>';
				for (var i = 0; i<r.length; i++){
					msg += '<li>' + r[i].serial_num + '</li>';
				}
				var context = {};
				context.msg = msg;
				if (req.user){
					context.username = req.user.username;
				}
				res.render('generic',{msg: msg,layout:'admin'});
				//console.log(r);
			}).catch(err=>{
				console.log('ERROR');
				console.log(err);
				res.send('Error '+ err);
			});
		} else {
			res.send("no user id");
		}	
	});

	router.get('/users',function(req,res){
		/*User.findAll({order: 'username DESC'}).then(users=>{
			res.render('users',{users:users,layout:'admin'});
		});*/
		var context = {};
		
		context.layout = 'admin';
		if (req.user){
			context.username = req.user.username;
		}
		User.getUsersWithBalance().then(users=>{
			context.users = users;
			res.render('users',context);
		});
	});
	return router;
}
//module.exports = router;