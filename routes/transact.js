"use strict";
module.exports = function(express,sequelize,app){

	//var express = require('express');
	var router = express.Router();

	var Config = require('../config.js');
	//DB
	//var Sequelize = require('sequelize');
	//var sequelize = new Sequelize(Config.pg);
	// models
	// var User = sequelize.import('../models/user.js');
	// var Coin = sequelize.import('../models/coin.js');
	// var Ledger = sequelize.import('../models/ledger.js');
	var User = app.get('models').user;
	var Coin = app.get('models').coin;
	var Ledger = app.get('models').ledger;

	// controllers
	var Transact = require('../controllers/transact.js');

	// ======= TRANSACT routes ======= //

	router.post('/send',function(req,res){
		if (req.user) {
		    // logged in
		    let sender_id = req.user.id; 
		    let receiver = req.body.receiver;
		    let amt = parseInt(req.body.amt);
		    if (sender_id <= 0 || amt <= 0){
		    	res.send('invalid values for transaction');
		    	return;
		    }
		    // Verify receiver username
		    User.getIdByUsername(receiver).then(u=>{
		    	//console.log(u);
		    	if (u[0].id > 0){
		    		var uid = u[0].id;
		    		Transact(sender_id,uid,amt,app).then(tr=>{
		    			//console.log(tr);
		    			var word = "token";
		    			if (amt > 1){
		    				word += 's';
		    			}
		    			var msg = 'Successfully sent ' + amt + ' ' + word + ' to ' + receiver;
		    			//res.render('generic',{msg:msg,loggedin:true});
		    			req.flash('success', msg);
		    			res.redirect('/user/dashboard');
		    		}).catch(err=>{
		    			res.send('Error '+ err);
		    			console.log(err.stack);
		    		});

		    	} else {
		    		throw Error;
		    	}
		    }).catch(err=>{
		    	res.send('invalid username for receiver');
		    });
		    
		} else {
		    // not logged in
		    res.send("You must be logged in to send tokens");
		}
		
	});

	router.get('/send',function(req,res){
		if (req.user) {
		    // logged in
		    res.render('transact',{pagetitle:'Send',loggedin:true,username:req.user.username});
		} else {
		    // not logged in
		    res.send("You must be logged in to send tokens");
		}
		
	});
	return router;
}

//module.exports = router;