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

	// for image resize and orientation
	var gm = require('gm').subClass({imageMagick: true});

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
	});

	var restrictImgType = function(req, file, cb) {
	  var allowedTypes = ['image/jpeg','image/gif','image/png'];
	  if (allowedTypes.indexOf(req.file.mimetype) !== -1){
	  	// To accept the file pass `true`
	  	cb(null, true);
	  } else {
		// To reject this file pass `false`
	  	cb(null, false);
	  	//cb(new Error('File type not allowed'));
	  }
	};
	 
	var upload = multer({ storage: storage, limits: {fileSize:4000000, fileFilter:restrictImgType} });

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
		var limit = 20;
		var findparams = {};
		if (req.query.start){
			findparams = { datetime: { $lt: req.query.start}};
		} else if (req.query.prev){
			findparams = { datetime: { $gt: req.query.prev}};
		}
		var firstDate = null;
		var lastDate = null;

		// find first and last dates so you know when to stop paging
		var findFirst = Post.find()
			.limit(1)
			.sort({datetime:-1})
			.exec((err,r)=>{
				firstDate = r[0].datetime;
			});
		
		var findLast = Post.find()
				.limit(1)
				.sort({datetime:1})
				.exec((err,r)=>{
					lastDate = r[0].datetime;
				});

		findFirst.then(()=>{
			findLast.then(()=>{
				Post.find(findparams)
					.limit(limit)
					.sort({datetime:-1})
					.exec(function(err,msgs){
						if (err){
							res.render('generic',{msg:err});
							return;
						} 
						if(msgs.length > 0) {
							context.posts = msgs;
							context.pagetitle = "Community Posts";
							context.loggedin = true;
							context.username = req.user.username;
							if (msgs[msgs.length - 1].datetime.getTime() != lastDate.getTime()){
								context.startdate = msgs[msgs.length - 1].datetime.toISOString();
							}
							if (msgs[0].datetime.getTime() != firstDate.getTime()){
								context.prevdate = msgs[0].datetime.toISOString();
							}
							
							res.render('messageboard',context);
						} else {
							res.render('generic',{msg:'No more results found.'});
						}
						
					});
			});
		});


		
	});

	router.get('/new',function(req,res){
		var context = {};
		context.loggedin = true;
		context.username = req.user.username;
		res.render('messageform',context);
	});

	router.post('/new',upload.single('photo'),function(req,res){
		console.log(req.file);
		var photo = null;
		var thumb = null;

		// creating a promise so mongo will wait to save if needed 
		// (if there is no image, it saves right away)

		var prom = new Promise((resolve,reject)=>{
			if (req.file){
				photo = '/uploads/' + req.file.filename;
				thumb = '/uploads/thumbs/100x100/' + req.file.filename;
				// save thumbnail
				// './public/uploads/'+ req.file.filename,
				gm(req.file.path)
				.autoOrient()
				.write('./public/uploads/'+ req.file.filename, function (err) {
				  if (err){
				  	console.log(err);
				  } else {
				  	//console.log('upload and autoOrient success');
				  }
				})
				gm(req.file.path).size(function (err, size) {
					if (!err){
						//console.log(size);
				    	var orientation = size.width > size.height ? 'wide' : 'tall'
				    	//console.log(this);

				    	var w = null;
				    	var h = null;
				    	var thumbsize = 100;
				    	if (orientation == 'wide'){
				    		h = thumbsize;
				    	} else {
				    		w = thumbsize;
				    	}
				    	this.resize(w,h)
				    		.crop(thumbsize,thumbsize,0,0)
				    		.write('./public/uploads/thumbs/100x100/'+ req.file.filename, err=>{
				    			if (err){
				    				console.log(err);
				    			} else {
				    				console.log('crop success');
				    			}
				    			resolve();
				    		});
				   	}
				});
			} else {
				resolve();
			}
		}); //end promise 
		
		prom.then(()=>{
			// Save it
			new Post({
				username: req.user.username,
				title: req.body.title,
				body: req.body.messagebody,
				photo: photo,
				thumb: thumb 
			}).save(function(err){
				if (err){ console.log(err); }
				req.flash('message', 'Posted successfully');
				res.redirect('/messageboard');
			});
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