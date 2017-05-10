"use strict";
var striptags = require('striptags');
var Sequelize = require('sequelize');
var passport = require('passport');
var Image = require('../image.js');

module.exports = function(express,app){

	var router = express.Router();
	
	var User = app.get('models').user;
	var Item = app.get('models').item;
	var Ledger = app.get('models').ledger;
	var Notification = app.get('models').notification;
	var Post = require('../models/mongoose/post.js');

	var transact = require('../transact.js')(app);

	// --- for file submission in forms --- //
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

	/* --- ADMIN --- */
	
	router.get('/admin/users/view',(req,res)=>{
		if (req.user){
			if(req.user.is_admin){
				User.findAll({
					limit:100,
					order: 'username DESC'
				}).then(users=>{
					res.json(users);
				}).catch(err=>{
					res.json({success:false,error:err});	
				});
			} else {
				res.json({success:false,error:'User is not admin'});
			}
			
		} else{
			res.json({success:false,error:'Not logged in'});
		}	
	});

	router.get('/admin/ledger',(req,res)=>{
		if (req.user){
			if (req.user.is_admin){
				var offset = 0;
				var limit = 10;
				if (req.query.pg){
					offset = req.query.pg - 1;
				} 
				if (req.query.num){
					limit = req.query.num;
				} 
				Ledger.getTransactions(limit,offset)
					.then(ledger=>{
						res.json({success:true,ledger:ledger});
					});
			} else {
				res.json({success:false,error:'User is not admin'});
			}
		} else {
			res.json({success:false,error:'Not logged in'});
		}
	});

	router.post('/admin/bestow',(req,res)=>{
		if (req.user){
			if (req.user.is_admin){
				// get ID of receiver
				User.getByUsername(req.body.receiver)
					.then(idObj=>{
						Ledger.create({
							receiver_id: idObj.id,
							amount: parseInt(req.body.amount),
							note: ''
						})
							.then(ledger=>{
								res.json({success:true});
							})
							.catch(err=>{
								res.json({success:false,error:err.message});
							});
					});
			} else {
				res.json({success:false,error:'Not logged in'});
			}
		} else {
			res.json({success:false,error:'Not logged in'});
		}
	});

	router.post('/admin/users/activate',function(req,res){
		User.update(
		    { is_active: true }, 
		    { where: { id: req.body.userids }} 
		).then(users=>{
			res.json({success:true});
		}).catch(err=>{
			res.json({success:false,error:err.message});
		});

	});

	/* --- USERS --- */

	router.post('/user/new',(req,res)=>{
		User.create({
			username: req.body.username,
			password: User.encryptPassword(req.body.password),
			email: req.body.email,
			firstname: striptags(req.body.firstname),
			lastname: striptags(req.body.lastname)
		}).then(user=>{
			res.json({success:true})
		}).catch(Sequelize.ValidationError, err => {
			res.json({success:false,type:'validation error',error:err});
		}).catch(err => {
			res.json({success:false,error:err});
		});
	});

	router.post('/user/login',passport.authenticate('local'),(req,res)=>{
		// If this function gets called, authentication was successful.
		// 401 status is sent if authentication fails
		res.json({success:true});
	});

	router.get('/user/:username/profile',(req,res)=>{
		if (req.user){
			User.getByUsername(req.params.username)
				.then(user=>{
					res.json({success:true,profile:user.profile_text});
				})
				.catch(err=>{
					res.json({success:false,error:err});
				});
		} else {
			res.json({success:false,error:'Not logged in'});
		}
		
	});

	router.get('/user/:username/balance',(req,res)=>{
		if (req.user){
			User.getByUsername(req.params.username)
				.then(user=>{
					user.getBalance()
						.then(bal=>{
							res.json({success:true,balance:bal[0].balance});
						});
				})
				.catch(err=>{
					res.json({success:false,error:err});
				});
		} else {
			res.json({success:false,error:'Not logged in'});
		}
	});

	router.get('/user/ledger',(req,res)=>{
		if (req.user){
			var perPg = 10;
			var pg = 0;
			if (req.query.pg){
				pg = parseInt(req.query.pg) - 1;
			}
			var offset = pg * perPg;
			User.getByUsername(req.user.username)
				.then(user=>{
					user.getLedger(perPg,offset)
						.then(ledger=>{
							res.json({success:true,ledger:ledger});
						});
				})
				.catch(err=>{
					res.json({success:false,error:err});
				});
		} else {
			res.json({success:false,error:'Not logged in'});
		}
	});

	router.get('/user/:username/stats',(req,res)=>{
		if (req.user){
			User.getByUsername(req.params.username)
				.then(user=>{
					Ledger.getNumUserTransactions(user.id)
						.then(num=>{
							Ledger.getNumPeopleUserTransactions(user.id)
								.then(ppl=>{
									res.json({success:true,transactions:num[0].count,people:ppl[0].count});
								})
						});
				});
			
		} else {
			res.json({success:false,error:'Not logged in'});
		}
	});

	/*router.post('/user/item/new',(req,res)=>{
		if(req.user){
			if (req.body.type && req.body.description){
				Item.create({
					offering_seeking:req.body.type,
					description:req.body.description,
					user_id: req.user.id
				}).then(item=>{
				  	res.json({success:true,item_id:item.id});
				});
			} else {
				res.json({success:false,error:'no input given'});
			}
		} else {
			res.json({success:false,error:'Not logged in'});
		}
	});*/

	/*router.get('/user/:username/items/:itype/view',(req,res)=>{
		if (req.user){
			User.getByUsername(req.params.username)
				.then(user=>{
					var item_type = 'seeking';
					if (req.params.itype != 'seeking'){
						item_type = 'offering';
					}
					user.getItems({where:{offering_seeking:item_type}})
						.then(items=>{
							res.json({success:true,items:items});
						});
				});
		} else {
			res.json({success:false,error:'Not logged in'});
		}
	});*/

	router.post('/user/profile/edit',(req,res)=>{
		if (req.user){
			User.update({
			  profile_text: striptags(req.body.profile_text)
			}, {
			  where: {
			    id: req.user.id
			  }
			}).then(()=>{
				res.json({success:true});
			});
		} else {
			res.json({success:false,error:'Not logged in'});
		}
	});

	router.post('/user/photo',upload.single('photo'),(req,res)=>{
		if (req.user){
			Image.sizePhoto(req.file.path,'public/uploads/user/'+req.file.filename,350,function(){
				User.update({
					profile_photo: '/uploads/user/'+req.file.filename
				}, {
					where: {
						id: req.user.id
					}
				}).then(()=>{
					res.json({success:true,path:'/uploads/user/'+req.file.filename});
				})
			});
		} else {
			res.json({success:false,error:'Not logged in'});
		}
	});

	router.get('/user/notifications',function(req,res){
		if (req.user){
			Notification.findAll({
				where: {receiver_id: req.user.id},
				limit: 3,
				order:[['transaction_date', 'DESC']]
			})
				.then(n=>{
					if (n.length > 0){
						var notifications = [];
						
						// store the time of the most recent record
						var last_seen = n[0].transaction_date.getTime();
						for (var i in n){
							var amount;
							if (n[i].amount == 1){
								amount = "1 token";
							} else {
								amount = n[i].amount.toString() + " tokens";
							}
							var obj = {};
							obj.date = n[i].transaction_date;
							if (!n[i].sender_id){
								obj.message = 'The bank issued you ' + amount;
							} else {
								obj.message = n[i].sender_username + ' sent you ' +amount;
							}
							notifications.push(obj);
						}

						res.json({success:true, notifications:notifications,last_seen:last_seen});
					} else {
						res.json({success:false, error:'no results'});
					}
					//res.json({success:true,notifications:n});
				});
		} else {
			res.json({success:false,error:'Not logged in'});
		}
	});

	router.post('/user/:username/exists',function(req,res){
		// log in not required, b/c this get called on sign up
		User.findOne({
			where: {username: req.params.username}	
		})
			.then(user=>{
				if (user){
					res.json({success:true,user_id:user.id});
				} else {
					res.json({success:false,error:'User not found'});
				}	
			})
			.catch(err=>{
				res.json({success:false,error:err.message});
			});
		
	});

	/* --- ITEMS --- */

	/*router.post('/item/:id/delete',(req,res)=>{
		if (req.user){
			// this item should belong to the logged in user
			Item.findById(req.params.id)
				.then(item=>{
					if (item.user_id == req.user.id){
						Item.destroy({
							where: {id:req.params.id}
						}).then(()=>{
							res.json({success:true});
						});
					} else {
						res.json({success:false,error:'User does not own this item'});
					}
				}).catch(err=>{
					res.json({success:false,error:err});
				});
		} else {
			res.json({success:false,error:'Not logged in'});
		}
	});*/

	router.post('/items/:type/:username',(req,res)=>{
		if (req.user){
			var type = 'offering';
			if (req.params.type != 'offering'){
				type = 'seeking';
			}
			Post.find({username:req.params.username,type:type}).exec()
				.then(docs=>{
					res.json({success:true,items:docs});
				})
				.catch(err=>{
					res.json({success:false,error:err});
				});
		} else {
			res.json({success:false,error:'Not logged in'});
		}
	});



	/* --- TRANSACT --- */

	router.post('/transact/send',(req,res)=>{
		if (req.user){
			// get receiver id
			User.getIdByUsername(req.body.receiver)
				.then(idObj=>{
					transact.send(req.user.id,idObj.id,req.body.amount,req.body.note)
						.then(result=>{
							res.json({success:true});
						})
						.catch(err=>{
							res.json({success:false,error:err.message});
						})
				})
				.catch(err=>{
					res.json({success:false,error:'Unknown receiver'});
				})
		} else {
			res.json({success:false,error:'Not logged in'});
		}
	});

	/* --- POSTS --- */
	router.post('/post/edit/:id',upload.single('photo'),function(req,res){
		Post.findById(req.params.id, function (err, doc){
			
			if (err){
				console.log(err);
				//res.status(500);
				//res.render('500',{msg:err});
				res.json({success:false});
				return;
			}
			if (!doc){
				res.json({success:false});
				return;
			}
			
			if (doc.username != req.user.username){
				res.json({success:false});
				return;
			}
			if (req.body.remove == 'true'){
				doc.photo = '';
				doc.thumb = '';
			}
			if (req.body.title){
				doc.title = req.body.title;
			}
		  	
		  	doc.body = req.body.message;
		  	doc.contact = req.body.contact;

		  	var prom = new Promise((resolve,reject)=>{
		  		if (req.file){
		  			doc.photo = '/uploads/' + req.file.filename;
		  			doc.thumb = '/uploads/thumbs/100x100/' + req.file.filename;
		  			var options = {
		  				srcPath: './'+req.file.path,
		  				destPath: './public/uploads/',
		  				destName: req.file.filename,
		  				thumbPath: './public/uploads/thumbs/100x100/'
		  			};
		  			doc.convertPhotos(options,function(){
		  				resolve();
		  			})
		  			
		  		} else {
		  			resolve();
		  		}
		  	}); //end promise

		  	prom.then(()=>{
		  		doc.save(function(err,doc){
		  			if (err){
		  				console.log(err);
		  				res.json({success:false});
		  			} else {
		  				res.json({success:true, photo:doc.photo, thumb:doc.thumb});
		  			}
		  		});
		  	});

		  	
		  	
		});
	});

	router.post('/post/delete/:id',function(req,res){
		// make sure the post belongs to this user
		Post.findById(req.params.id,function(err,found){
			if (found){
				if (found.username == req.user.username){
					Post.findByIdAndRemove(req.params.id,function(err){
						if (err){
							res.json({success:false});
						} else {
							res.json({success:true});
						}
					});
				} else {
					res.json({success:false});
				}
			} else {
				res.json({success:false});
			}
			
		});
		
	});

	return router;
};