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
var Transact = require('../controllers/transact.js');

// ======= TRANSACT routes ======= //

router.post('/send',function(req,res){
	if (req.user) {
	    // logged in
	    let sender_id = req.user.id; 
	    let receiver_id = parseInt(req.body.receiver_id);
	    let amt = parseInt(req.body.amt);
	    if (sender_id <= 0 || receiver_id <= 0 || amt <= 0){
	    	res.send('invalid values for transaction');
	    	return;
	    }
	    Transact(sender_id,receiver_id,amt).then(tr=>{
	    	console.log(tr);
	    	var msg = 'Successfully sent ' + amt + ' to user #' + receiver_id;
	    	res.send(msg);
	    }).catch(err=>{
	    	res.send('Error '+ err);
	    	console.log(err.stack);
	    });
	} else {
	    // not logged in
	    res.send("You must be logged in to send tokens");
	}
	
});

router.get('/send',function(req,res){
	if (req.user) {
	    // logged in
	    res.render('transact',{pagetitle:'Send'});
	} else {
	    // not logged in
	    res.send("You must be logged in to send tokens");
	}
	
});

module.exports = router;