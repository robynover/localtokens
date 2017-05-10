"use strict";
var striptags = require('striptags');
var Sequelize = require('sequelize');
var passport = require('passport');
var config = require('../config/config.js')[process.env.NODE_ENV];

module.exports = function(express,app){

	var router = express.Router();
	
	var User = app.get('models').user;
	//var Item = app.get('models').item;

	/*router.get('/user/:username/items/:itype',(req,res)=>{
		if (req.user){
			User.getByUsername(req.params.username)
				.then(user=>{
					var item_type = 'seeking';
					if (req.params.itype != 'seeking'){
						item_type = 'offering';
					}
					user.getItems({where:{offering_seeking:item_type}})
						.then(items=>{
							res.render('items-test',{items:JSON.stringify(items),item_type:item_type});
						});
				});
		} else {
			res.json({success:false,error:'Not logged in'});
		}
	});

	router.get('/user/:username',(req,res)=>{
		if (req.user){
			User.getByUsername(req.params.username)
				.then(user=>{
					var context = {};
					context.profilename = user.username;
					context.username = req.user.username;
					context.profile_text = user.profile_text;
					context.url = "/api/user/profile/edit";

					res.render('editbox-test',context);
				});
		} else {
			res.json({success:false,error:'Not logged in'});
		}
	});*/
	
	router.get('/',function(req,res){
		var context = {};
		context.layout = "home";
		if (req.user){
			context.username = req.user.username;
			context.loggedin = true;
			context.is_admin = req.user.is_admin;
		}
		res.render('generic',context);
	});

	router.get('/signin',(req,res)=>{
		res.render('login');
	});

	router.post('/signin',passport.authenticate('local'),(req,res)=>{
		// If this function gets called, authentication was successful.
		// 401 status is sent if authentication fails
		res.redirect('/user/dashboard');
	});

	router.get('/signout',(req,res)=>{
		req.logout();
		res.render('generic',{msg:"You've been successfully logged out."});
	});

	router.get('/signup',(req,res)=>{
		if (req.user){
			req.logout();
		}
		var context = {};
		context.pagetitle = 'Sign Up';
		context.error = req.flash('err');
		context.loggedin = false;
		res.render('signup',context);
	});

	router.post('/signup', (req,res)=>{
		// set up variables to return in errors, if needed
		var context = {};
		context.username = striptags(req.body.username);
		context.email = striptags(req.body.email);
		context.firstname = striptags(req.body.firstname);
		context.lastname = striptags(req.body.lastname);
		context.pagetitle = 'Sign Up';
		context.loggedin = false;

		// check password before encryption,
		//    because Model.create() function takes the encrypted version
		try{
			if (req.body.password.length < 6){
				throw new Error("Password must be at least 6 characters");
			}
		} catch(err){
			context.error = err.message;
			res.render('signup',context);
			return;
		}
		
		User.create({
			username: req.body.username,
			password: User.encryptPassword(req.body.password),
			email: req.body.email,
			firstname: striptags(req.body.firstname),
			lastname: striptags(req.body.lastname)
		}).then(user=>{
			// TODO: send email verification
			res.render('generic',{msg:'Signup successful! Check your inbox for a confirmation.'});
		}).catch(Sequelize.ValidationError, err => {
			var msg = '';
			for(var i in err.errors){
				msg += err.errors[i].message += ', ';
			}
			msg = msg.substring(0,msg.length - 2);
			
			context.error = msg;
			res.render('signup',context);

		}).catch(err => {
			console.log(err);
			//res.render('signup');
		});
	});



	return router;
};