"use strict";
var express = require('express');
var router = express.Router();

var Config = require('../config.js');
//DB
// mongoose
var mongoose = require('mongoose');
mongoose.connect(Config.mongo);
mongoose.Promise = require('bluebird');

// mongoose model -- for message board
var Post = require('../models/post.js');

// === require users to be logged in for this section=== //
router.all('/*',function(req,res,next){
	if (req.user){
		next();
	} else {
		res.status(401);
		res.send('You are not authorized to view this page');
	}	
});

// --- ROUTES --- //

router.get('/',function(req,res){
	//var msg = '<h2>Message Board</h2>';
	Post.find({}).sort({datetime:-1}).exec(function(err,msgs){
		var context = {posts:msgs,pagetitle:"Message Board"};
		res.render('messageboard',context);
	});
	
});

router.get('/new',function(req,res){
	res.render('messageform');
});

router.post('/new',function(req,res){
	new Post({
		username: req.user.username,
		title: req.body.title,
		body: req.body.messagebody
	}).save(function(err){
		if (err){ console.log(err); }
		res.redirect('/messageboard');
	});
});

// show a thread
router.get('/thread/:id',function(req, res){
	Post.findById(req.params.id, function (err, doc){
		//var context = {messages: doc};
		res.render('thread',doc);
	});
});

router.post('/reply/:parentId',function(req,res){
	var obj = {};
	obj.body = req.body.messagebody;
	obj.username = req.user.username;
	Post.findById(req.params.parentId, function (err, doc){
		if (err){
			console.log(err);
			res.render('500');
		}
	  	doc.replies.push(obj);
	  	doc.save();
	  	res.redirect('/messageboard/thread/'+req.params.parentId);
	});
});

router.post('/post/edit/:id',function(req,res,next){
	Post.findById(req.params.id, function (err, doc){
		console.log("DOC---------");
		console.log(doc);
		if (err){
			console.log("ERR--------------");
			console.log(err);
			res.render('500');
			return;
		}
		if (req.body.title){
			doc.title = req.body.title;
		}
	  	
	  	doc.body = req.body.message;

	  	console.log(req.body.message);

	  	doc.save(function(err,doc){
	  		if (err){
	  			console.log(err);
	  			res.json({success:false});
	  		} else {
	  			console.log("saved");
	  			console.log(doc);
	  			res.json({success:true});
	  		}
	  	});
	  	//res.send("Saved reply");
	  	
	});
});
/*router.get('/post/edit/:id',function(req,res){
	res.send(req.params.id);
});*/

module.exports = router;