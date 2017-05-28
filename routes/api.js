"use strict";
var striptags = require('striptags');
var Sequelize = require('sequelize');
var passport = require('passport');
var Image = require('../image.js');

module.exports = function(express,app){

	var router = express.Router();

	var sequelize = app.get('models').sequelize;
	
	var User = app.get('models').user;
	var Ledger = app.get('models').ledger;
	var Notification = app.get('models').notification;
	var Post = require('../models/mongoose/post.js');
	var CreditRules = app.get('models').credit_rules;
	var CreditsGranted = app.get('models').credits_granted;
	var Bookmark = require('../models/mongoose/bookmark.js');

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

	router.post('/admin/user/:id/credit',function(req,res){
		if (req.user){
			if(req.user.is_admin){
				User.findById(req.params.id)
					.then(user=>{
						user.max_negative_balance = parseInt(req.body.num);
						user.save()
							.then(u=>{
								res.json({success:true});
							})
							.catch(err=>{
								res.json({success:false,error:err});
							});
					})
			} else {
				res.json({success:false,error:'User is not admin'});
			}
			
		} else{
			res.json({success:false,error:'Not logged in'});
		}
	})

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
					return user.getBalance()
						.then(bal=>{
							return res.json({success:true,balance:bal[0].balance});
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
			//where: {username: req.params.username}	
			where: {username: sequelize.where(sequelize.fn('LOWER', sequelize.col('username')),req.params.username.toLowerCase())}
		})
			.then(user=>{
				if (user){
					return res.json({success:true,user_id:user.id});
				} else {
					return res.json({success:false,error:'User not found'});
				}	
			})
			.catch(err=>{
				return res.json({success:false,error:err.message});
			});
		
	});

	router.get('/admin/user/:id/credit/eligible', (req,res)=>{
		if (req.user){
			if (req.user.is_admin){
				var rule_num;
				// has user used any credit rules?
				CreditsGranted.userHasHistory(req.params.id)
					.then(ct=>{
						if (ct[0].count == 0){
							rule_num = 1; // user is not in table; start with 1st rule
						} else {
							// get next rule
							return CreditRules.nextUserRule(req.params.id)
								.then( nr=>{
									if (nr[0]){
										rule_num = nr[0].rule_order;
									} else {
										rule_num = 0;
									}
								})
						}	
					})
					.then( ()=>{
						if (rule_num > 0){
							// is user eligible for next rule?
							CreditRules.userEligibleForRule(req.params.id,rule_num,app.get('models').credits_granted)
								.then(ue =>{
									var result = ue[0].result;
									if (result == null){
										result = false;
									}
									return res.json({success:true, eligible: result });
									
								})
						} else {
							return res.json({success:true, eligible: false });

						}	
					})
			} else {
				res.json({success:false,error:'Must be admin'});
			}
		} else {
			res.json({success:false,error:'Not logged in'});
		}
	});

	router.get('/admin/user/:id/credit/grant/rule/:rule_num', (req,res)=>{
		if (req.user){
			if (req.user.is_admin){

				CreditRules.findOne({
					where:{rule_order:req.params.rule_num}
				})
					.then( rule=>{
						// make sure user hasn't used this rule already
						CreditsGranted.findOne({
							where:{
								user_id: req.params.id,
								rule_id: rule.id
							}
						})
							.then( cg=>{
								console.log(cg);
								if (cg){
									return res.json({success:false,error:'Already used this rule'});
								} else {
									// add new CreditsGranted
									CreditsGranted.create({
										amount_used: rule.benchmark,
										credit_given: rule.gain,
										user_id: req.params.id,
										rule_id: rule.id
									})
										.then(granted=>{
											//console.log(granted);
											return res.json({success:true, rule_id: rule.id});
										});
								}

							});
					});
			} else {
				res.json({success:false,error:'Must be admin'});
			}
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
			doc.type = req.body.type;
		  	
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

	/* --- ITEMS (as Posts) --- */

	router.get('/items/:type',(req,res)=>{
		Post.find({type:req.params.type})
			.limit(8)
			.sort({datetime:-1})
			.exec((err,posts)=>{
				if (err){
					res.json({success:false});
				} else {
					res.json({success:true,items:posts});
				}
				
			});
	});

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

	/* -- Bookmarks -- */
	router.post('/bookmark/add', (req,res)=>{
		if (req.user){
			var post_id = req.body.post_id;
			console.log(req.body.post_id);
			console.log(req.body);
			// does it exist already?
			Bookmark.findOne({
				username: req.user.username,
				post_id: req.body.post_id
			})
				.then(b=>{
					if (b){
						//update -- make active
						b.active = true;
						b.save()
							.then(b1=>{
								return res.json({success:true,bookmark:b1});
							})
					} else {
						// create
						console.log(post_id);
						Bookmark.create({
							username: req.user.username,
							post_id: post_id
						})
							.then(b1=>{
								return res.json({success:true,bookmark:b1});
							});
					}
				});
			
		} else {
			return res.json({success:false,error:'Not logged in'});
		}
	});

	router.post('/bookmark/remove', (req,res)=>{
		if (req.user){
			Bookmark.update({
				username: req.user.username,
				post_id: req.body.post_id
			},{
				active: false
			}).exec()
				.then(result=>{
					return res.json({success:true});
				})

		} else {
			return res.json({success:false,error:'Not logged in'});
		}
	});

	router.get('/bookmark/:postid/status', (req,res)=>{
		if (req.user){
			Bookmark.findOne({
				username: req.user.username,
				post_id: req.params.postid
			})
				.then(b=>{
					console.log(b);
					var active;
					if (b){
						active = b.active;
					} else {
						active = false;
					}
					return res.json({success:true,active:active});
				})
		} else {
			return res.json({success:false,error:'Not logged in'});
		}
	});

	return router;
};