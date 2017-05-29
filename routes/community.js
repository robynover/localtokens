"use strict";
//var Sequelize = require('sequelize');
//var passport = require('passport');
var config = require('../config/config.js')[process.env.NODE_ENV];
var striptags = require('striptags');

// mongoose
/*var mongoose = require('mongoose');
mongoose.connect(config.mongo);
mongoose.Promise = require('bluebird');*/

// for file submission in forms
var multer  = require('multer');
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


module.exports = function(express){
	var router = express.Router();

	var Post = require('../models/mongoose/post.js');
	var Bookmark = require('../models/mongoose/bookmark.js');

	// === require users to be logged in for this section=== //
	router.all('/*',function(req,res,next){
		if (req.user){
			next();
		} else {
			res.status(401);
			res.render('generic',{msg:'You must be logged in to view this page'});
		}	
	});

	/*router.get('/',(req,res)=>{
		var context = {};
		context.loggedin = true;
		context.username = req.user.username;

		Item.getItems('offering')
			.then(items=>{
				context.items_offering = items;
				Item.getItems('seeking')
					.then(items2=>{
						context.items_seeking = items2;
						Post.find()
							.limit(8)
							.sort({datetime:-1})
							.exec((err,posts)=>{
								context.posts = posts;
								res.render('community',context);
							});
					});	
			});	
	});*/

	router.get('/posts/new',function(req,res){
		var context = {};
		context.loggedin = true;
		context.username = req.user.username;
		context.is_admin = req.user.is_admin;
		context.pagetitle = "New Post";
		res.render('postform',context);
	});

	router.post('/posts/new',upload.single('photo'),function(req,res){
		var photo = null;
		var thumb = null;

		var post = new Post({
			username: req.user.username,
			title: req.body.title,
			body: req.body.messagebody,
			photo: photo,
			thumb: thumb,
			type: req.body.type,
			contact: req.body.contact
		})

		// creating a promise so mongo will wait to save if needed 
		// (if there is no image, it saves right away)

		var prom = new Promise((resolve,reject)=>{
			if (req.file){
				post.photo = '/uploads/' + req.file.filename;
				post.thumb = '/uploads/thumbs/100x100/' + req.file.filename;
				var options = {
					srcPath: './'+req.file.path,
					destPath: './public/uploads/',
					destName: req.file.filename,
					thumbPath: './public/uploads/thumbs/100x100/'
				};
				post.convertPhotos(options,function(){
					resolve();
				});
				
			} else {
				resolve();
			}
		}); //end promise 
		
		prom.then(()=>{
			// Save it
			post.save(function(err){
				if (err){ console.log(err); }
				req.flash('message', 'Posted successfully');
				res.redirect('/community/marketplace');
			});
		});
		
	});

	/*router.get('/posts',(req,res)=>{
		var context = {};
		context.success_msg = req.flash('message');
		if (req.query.del){
			context.success_msg = "Post deleted successfully";
		}
		context.loggedin = true;
		context.username = req.user.username;
		context.is_admin = req.user.is_admin;
		context.pagetitle = "Market";

		var limit = 20;
		var findparams = {};
		if (req.query.start){
			findparams = { datetime: { $lt: req.query.start}};
		} else if (req.query.prev){
			findparams = { datetime: { $gt: req.query.prev}};
		}
		var firstDate = null;
		var lastDate = null;

		var type = 'offering';
		if (req.query.type == 'seeking'){
			type = 'seeking';
		}
		context.type = type;
		findparams.type = type;

		// find first and last dates so you know when to stop paging
		var findFirst = Post.find({type:type})
			.limit(1)
			.sort({datetime:-1})
			.lean()
			.exec((err,r)=>{
				if (err){
					res.render('generic',{msg:err});
				}
				if (r[0]){
					//console.log(r);
					firstDate = r[0].datetime;
				}
				
			});
		
		var findLast = Post.find({type:type})
				.limit(1)
				.sort({datetime:1})
				.lean()
				.exec((err,r)=>{
					if (err){
						res.render('generic',{msg:err});
					}
					if (r[0]){
						//console.log(r);
						lastDate = r[0].datetime;
					}
					
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
							
							if (msgs[msgs.length - 1].datetime.getTime() != lastDate.getTime()){
								context.startdate = msgs[msgs.length - 1].datetime.toISOString();
							}
							if (msgs[0].datetime.getTime() != firstDate.getTime()){
								context.prevdate = msgs[0].datetime.toISOString();
							}
							
							res.render('posts',context);
						} else {
							//res.render('generic',{msg:'No more results found.'});
							res.render('posts',context);
						}
						
					});
			});
		});
		
	});*/

	router.get('/post/:id',(req,res,next)=>{
		Post.findById(req.params.id, function (err, doc){
			// fixes naming conflict: 'username' is name of author in doc, 
			// but needs to be name of logged in user
			if (doc){
				doc.loggedin = true;
				doc.author = doc.username;
				doc.username = req.user.username;
				doc.is_admin = req.user.is_admin;
				doc.pagetitle = doc.title;
				// for JS:
				doc.body_str = JSON.stringify(doc.body);
				doc.title_str = JSON.stringify(doc.title);
				if (!doc.contact){
					doc.contact_str= JSON.stringify("_");
				} else {
					doc.contact_str = JSON.stringify(doc.contact);
				}
				
				res.render('post',doc);
			} else {
				next();
			}

		});
	});

	router.get('/marketplace',(req,res,next)=>{
		var limit = 20;
		var firstDate = null;
		var lastDate = null;

		var context = {};
		context.pagetitle = "Marketplace";
		context.success_msg = req.flash('message');
		if (req.query.del){
			context.success_msg = "Post deleted successfully";
		}
		context.loggedin = true;
		context.username = req.user.username;
		context.is_admin = req.user.is_admin;
		context.type = 'offering';
		var type = 'offering';
		if (req.query.type == 'seeking'){
			type = 'seeking';
			context.type = 'seeking';
		}
		var findObj = {};
		findObj.type = type;

		if (req.query.start){
			findObj.datetime =  { $lt: req.query.start};
		} else if (req.query.prev){
			findObj.datetime = { $gt: req.query.prev};
		}

		if (req.query.q){
			context.q = striptags(req.query.q);
			findObj['$text'] = { $search : req.query.q };	
		}

		context.yours = 0;
		if(req.query.yours == 1){
			findObj.username = req.user.username;
			context.yours = 1;
		}

		context.bookmarks = 0;
		var prom = new Promise((resolve,reject)=>{
			if (req.query.bookmarks == 1){
				context.bookmarks = 1;
				// get this user's bookmarks
				Bookmark.find({
					username: req.user.username
				}).then( bookmarks=>{
					findObj._id = [];
					for (var i in bookmarks){
						findObj._id.push(bookmarks[i].post_id);
					}
					resolve();
				});
			} else {
				resolve();
			}

		});

		// find first and last dates so you know when to stop paging
		var findFirst = Post.find(findObj)
			.limit(1)
			.sort({datetime:-1})
			.lean()
			.exec((err,r)=>{
				if (err){
					res.render('generic',{msg:err});
				}
				if (r[0]){
					//console.log(r);
					firstDate = r[0].datetime;
				}
				
			});
		
		var findLast = Post.find(findObj)
				.limit(1)
				.sort({datetime:1})
				.lean()
				.exec((err,r)=>{
					if (err){
						res.render('generic',{msg:err});
					}
					if (r[0]){
						//console.log(r);
						lastDate = r[0].datetime;
					}
					
				});

		prom.then( ()=> {
			findFirst.then(()=>{
				findLast.then(()=>{
					Post.find(findObj)
						.limit(limit)
						.sort({datetime:-1})
						.exec(function(err,results){
							if(err){
								console.log(err);
								next();
								return;
							}
							if (results.length > 0){
								context.results = results;
								if (results[results.length - 1].datetime.getTime() != lastDate.getTime()){
									context.startdate = results[results.length - 1].datetime.toISOString();
								}
								if (results[0].datetime.getTime() != firstDate.getTime()){
									context.prevdate = results[0].datetime.toISOString();
								}
							} else {
								context.noresults = "No results found";
							}
							res.render('marketplace',context);

						});
				});
			});
		});
			
	});



	return router;
};