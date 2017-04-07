"use strict";
module.exports = function(express,sequelize,app){

	//var express = require('express');
	var router = express.Router();

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
		    	res.status(422);
		    	res.render('generic',{msg:'Invalid values for transaction'});
		    	return;
		    }
		    // Verify receiver username
		    User.getIdByUsername(receiver).then(u=>{
		    	//console.log(u);
		    	if (u[0].id > 0){
		    		var uid = u[0].id;
		    		return Transact(sender_id,uid,amt,app,sequelize).then(tr=>{
		    			//console.log(tr);
		    			var word = "token";
		    			if (amt > 1){
		    				word += 's';
		    			}
		    			var msg = 'Successfully sent ' + amt + ' ' + word + ' to ' + receiver;
		    			req.flash('success', msg);
		    			res.redirect('/user/dashboard');
		    		}).catch(err=>{
		    			//console.log(err.stack);
		    			res.status(422);
		    			res.render('generic',{msg:err});
		    		});

		    	} else {
		    		throw Error;
		    	}
		    }).catch(err=>{
		    	res.status(422);
		    	res.render('generic',{msg:'Invalid username for receiver'});
		    });
		    
		} else {
		    // not logged in
		    res.status(401);
			res.render('generic',{msg:'You must be logged in to send tokens'});
		}
		
	});

	router.get('/send',function(req,res){
		if (req.user) {
		    // logged in
		    var context = {
		    	pagetitle:'Send',
		    	loggedin:true,
		    	username:req.user.username,
		    	is_admin: req.user.is_admin
		    };
		    res.render('transact',context);
		} else {
		    // not logged in
		    res.status(401);
			res.render('generic',{msg:'You must be logged in to send tokens'});
		}
		
	});
	return router;
};
