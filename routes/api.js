"use strict";
module.exports = function(express,sequelize,app){

	//var express = require('express');
	var router = express.Router();
	
	var User = app.get('models').user;
	var Ledger = app.get('models').ledger;
	var Notification = app.get('models').notification;
	var Item = app.get('models').item;
	var UserInfo = app.get('models').userinfo;
	// // mongoose model -- for message board
	var Post = require('../models/post.js');

	// for file submission in forms
	var multer  = require('multer');
	//var upload = multer({dest: 'uploads/'});
	var storage = multer.diskStorage({
	  destination: function (req, file, cb) {
	    cb(null, './public/uploads/user');
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


	// == API routes == //
	router.get('/user/transactions/count',function(req,res){
		if (req.user){
			Ledger.getNumUserTransactions(req.user.id).then(ledger=>{
				res.json({success:true,count:ledger[0].count});
			});
		} else {
			res.json({error:'user not logged in'});
		}
	});

	router.get('/user/transactions/people',function(req,res){
		if (req.user){
			Ledger.getNumPeopleUserTransactions(req.user.id).then(p=>{
				res.json({success:true,count:p[0].count});
			});
		} else {
			res.json({error:'user not logged in'});
		}
	});

	router.get('/user/transactions',function(req,res){
		if (req.user){
			var limit = 0;
			if (req.query.n){
				limit = parseInt(req.query.n);
			}
			User.findById(req.user.id).then(u=>{
				u.getUserLedger(limit).then(l=>{				
					res.json(l);
				});
			});	
		} else {
			res.json({error:'user not logged in'});
		}
	});
	router.get('/user/exists',function(req,res){		
		if (req.query.u){
			User.getByUsername(req.query.u).then(u=>{
				if (u){
					res.json({success:true,user_exists:true});
				} else {
					res.json({error:'user does not exist',user_exists:false});
				}
			});
		} else {
			res.json({error:'no username given'});
		}			
	});

	router.get('/user/notifications',function(req,res){
		if (req.user){
			Notification.findAll({
				where: {receiver_id: req.user.id},
				limit: 3,
				order:[['transaction_date', 'DESC']]
			}).then(n=>{
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

					res.json({success:true,notifications:notifications,last_seen:last_seen});
				} else {
					res.json({error:'no results'});
				}
			});
			/*Notification.getUserNotifications(req.user.id).then(n=>{
				
			})*/
		} else {
			res.json({error:'user not logged in'});
		}
	});

	router.get('/user/:username/offering',function(req,res){
		if (req.user){
			User.getIdByUsername(req.params.username)
				.then(function(u){
					Item.findAll({
						attributes: ['id','description'],
						where:{user_id:u[0].id,offering_seeking:'offering'}
					}).then(it=>{
						res.json({success:true,items:it});
					});
				});
			

		} else {
			res.json({error:'user not logged in'});
		}
	});

	router.get('/user/:username/seeking',function(req,res){
		if (req.user){
			User.getIdByUsername(req.params.username)
				.then(function(u){
					Item.findAll({
						attributes: ['id','description'],
						where:{user_id:u[0].id,offering_seeking:'seeking'}
					}).then(it=>{
						res.json({success:true,items:it});
					});
				});
			

		} else {
			res.json({error:'user not logged in'});
		}
	});

	router.post('/user/item/add',function(req,res){
		if (req.user){
			if (req.body.type && req.body.description){
				Item.create({
					offering_seeking:req.body.type,
					description:req.body.description,
					user_id: req.user.id
				}).then(u=>{
				  	//console.log(u);
				  	res.json({success:true,id:u.id});
				   });
			} else {
				res.json({error:'no input given'});
			}
		} else {
			res.json({error:'user not logged in'});
		}
	});

	router.post('/item/:id/delete',function(req,res){
		//make sure this item belongs to this user
		// find out which user this item belongs to & check against logged in user
		Item.findOne({id:req.params.id})
			.then(item=>{
				if(item.user_id == req.user.id){
					Item.destroy({
						where: {id:req.params.id}
					})
						.then(function(){
							res.json({success:true});
						});
				} else {
					res.json({success:false});
				}
			})
	})

	router.post('/user/profile/edit',function(req,res){
		// user can only edit their own profile
		UserInfo.findOne({
			where:{user_id:req.user.id}
		})
		.then(info=>{ // if it exists, edit it
			//console.log(info);
			if (!info){ // if it doesn't exist yet
				UserInfo.create({
					profile_text: req.body.profile_text,
					user_id: req.user.id
				})
					.then(function(){
						res.json({success:true,status:'new'});
						return(null);
					});
			} else {
				info.profile_text = req.body.profile_text;
				info.save()
					.then(function(){
						res.json({success:true,status:'edit'});
						return(null);
					});
				
			}
		})
		.catch(err=>{
			res.json({success:false});
		});		
		
	});

	router.get('/user/:id/profile',function(req,res){
		UserInfo.findOne({
			where:{user_id:req.params.id}
			})
			.then(info=>{
				//console.log(info);
				if (info){
					res.json({
						success: true,
						profile: info.profile_text
					})
				} else {
					res.json({success:false});
				}
			});
	});

	router.post('/user/photo',upload.single('photo'),function(req,res){
		console.log(req.file.filename);
		console.log(req.file.path);
		UserInfo.findOne({
			where:{user_id:req.user.id}
		}).then(info=>{

			UserInfo.sizePhoto(req.file.path,function(){
				if (!info){ // if it doesn't exist yet
					UserInfo.create({
						profile_photo: '/uploads/user/'+req.file.filename,
						user_id: req.user.id
					})
						.then(function(){
							res.json({success:true,status:'new'});
							return(null);
						});
				} else {
					info.profile_photo = '/uploads/user/'+req.file.filename;
					info.save()
						.then(function(){
							res.json({success:true,status:'edit'});
							return(null);
						});
					
				}
			});

			
		}).catch(err=>{
			res.json({success:false,msg:err});
		});
	});

	router.get('/user/:id/photo',function(req,res){
		if (req.user){
			UserInfo.findOne({
				where:{user_id:req.params.id}
			}).then(info=>{
				if (info && info.profile_photo){
					res.json({success:true,photo:info.profile_photo});
				} else {
					res.json({success:false});
				}
				
			})
		} else {
			res.json({error:'user not logged in'});
		}
	});

	router.get('/posts/recent',function(req,res){
		if (req.user){
			Post.find()
				.limit(5)
				.sort({datetime:-1})
				.exec((err,r)=>{
					res.json({success:true,records:r});
				});

		} else {
			res.json({error:'user not logged in'});
		}
	});



	return router;
};
