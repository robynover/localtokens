"use strict";
var express = require('express');
var router = express.Router();

var Config = require('../config.js');
//DB
var Sequelize = require('sequelize');
var sequelize = new Sequelize(Config.pg);
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
		res.render('generic',context);
	});
});

router.get('/ledger',function(req,res){
	Ledger.getRecords().then(l=>{
		let context = {};
		context.pagetitle = 'Ledger';
		context.records = l;
		context.layout = 'admin';
		res.render('ledger',context);
	});
});	

router.get('/bank',function(req,res){
	Coin.getBankLedger().then(l=>{
		let context = {};
		context.pagetitle = "Bank";
		context.records = l;
		context.layout = 'admin';
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
	User.findAll().then(users=>{
		res.render('users',{users:users,layout:'admin'});
	});
});

module.exports = router;