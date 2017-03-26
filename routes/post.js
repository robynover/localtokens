"use strict";
module.exports = function(express){

	//var express = require('express');
	var router = express.Router();

	var Config = require('../config.js');
	//DB
	// mongoose
	var mongoose = require('mongoose');
	mongoose.connect(Config.mongo);
	mongoose.Promise = require('bluebird');

	// mongoose model -- for message board
	var Post = require('../models/post.js');

	// for image resize
	var im = require('imagemagick');

	// for file submission in forms
	var multer  = require('multer');
	//var upload = multer({dest: 'uploads/'});
	var storage = multer.diskStorage({
	  destination: function (req, file, cb) {
	    cb(null, './public/uploads');
	  },
	  filename: function (req, file, cb) {
	  	var fileExt = file.mimetype.split('/')[1];
	  	if (fileExt == 'jpeg'){ fileExt = 'jpg';}
	    cb(null, req.user.username + '-' + Date.now() + '.' + fileExt);
	  }
	})
	 
	var upload = multer({ storage: storage, limits: {fileSize:3000000} });

	// === require users to be logged in for this section=== //
	router.all('/*',function(req,res,next){
		if (req.user){
			next();
		} else {
			res.status(401);
			res.render('generic',{msg:'You must be logged in to view this page'});
		}	
	});

	// --- ROUTES --- //

	router.get('/',function(req,res){
		var context = {};
		if (req.query.del){
			context.success_msg = "Post deleted successfully";
		}
		Post.find().sort({datetime:-1}).exec(function(err,msgs){
			context.posts = msgs;
			context.pagetitle = "Community Posts";
			context.loggedin = true;
			context.username = req.user.username;
			res.render('messageboard',context);
		});
		
	});

	router.get('/new',function(req,res){
		var context = {};
		context.loggedin = true;
		context.username = req.user.username;
		res.render('messageform',context);
	});

	router.post('/new',upload.single('photo'),function(req,res){
		//console.log(req.file);
		var photo = null;
		var allowedTypes = ['image/jpeg','image/gif','image/png'];
		if (req.file){
			if (allowedTypes.indexOf(req.file.mimetype) !== -1){
				photo = '/uploads/' + req.file.filename;
				// save thumbnail
				im.crop({
				  srcPath: './public/uploads/'+ req.file.filename,
				  dstPath: './public/uploads/thumbs/100x100/'+ req.file.filename,
				  width: 100,
				  height: 100
				}, function(err, stdout, stderr){
				  if (err) throw err;
				  console.log('100x100 thumbnail created');
				});
				
			} else {
				var msg = "The file type is not supported. Please use .jpg, .gif, or .png";
				res.render('generic',{msg:msg,loggedin: true});
				return;
			}
		}
		
		// Save it
		new Post({
			username: req.user.username,
			title: req.body.title,
			body: req.body.messagebody,
			photo: photo 
		}).save(function(err){
			if (err){ console.log(err); }
			//req.flash('message') = 'Posted successfully';
			res.redirect('/messageboard');
		});
	});

	// show a post
	router.get('/post/view/:id',function(req, res){
		Post.findById(req.params.id, function (err, doc){
			//var context = {messages: doc};
			doc.loggedin = true;
			doc.username = req.user.username;
			res.render('post',doc);
		});
	});

	router.post('/post/delete/:id',function(req,res){
		Post.findByIdAndRemove(req.params.id,function(err){
			if (err){
				res.json({success:false});
			} else {
				res.json({success:true});
			}
		})
	})

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
	return router;
}

//module.exports = router;