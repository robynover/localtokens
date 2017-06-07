"use strict";
var Sequelize = require('sequelize');
var striptags = require('striptags');

module.exports = function(express,app){

	var router = express.Router();
	
	var User = app.get('models').user;
	var transact = require('../transact.js')(app);

	router.get('/send',(req,res)=>{
		if (req.user){
			var context = {};
			context.loggedin = true;
			context.username = req.user.username;
			context.is_admin = req.user.is_admin;
			context.success = req.flash('success');
			context.pagetitle = "Send";
			if(req.query.to){
				context.to = striptags(req.query.to);
			}

			res.render('sendform',context);
		} else {
			res.render('generic',{msg:'Not logged in'});
		}
	});

	router.post('/send',(req,res)=>{
		if (req.user){
			if (req.body.amt <= 0){
				res.status(422);
				res.render('generic',{msg:'Invalid values for transaction'});
				return;
			}
			var context = {};
			context.loggedin = true;
			context.username = req.user.username;
			context.is_admin = req.user.is_admin;

			var receiver_id;
			// get receiver id
			User.getIdByUsername(req.body.receiver)
				.then(idObj=>{
					receiver_id = idObj.id;
					return transact.send(req.user.id,idObj.id,req.body.amt,req.body.note)
						.then(result=>{
							var word = "cred";
							if (req.body.amt > 1){
								word += 's';
							}
							var msg = 'Successfully sent ' + req.body.amt + ' ' + word + ' to ' + req.body.receiver;
							req.flash('success', msg);
							
							context.success = req.flash('success');
							res.render('sendform',context);
						})
						.catch(err=>{
							res.status(422);
							res.render('generic',{msg:err.message});
						})
				})
				// log the transaction after response, to handle receiver credits
				.then( ()=>{
					transact.log(receiver_id);
				})
				.catch(err=>{
					//res.status(422);
					console.log(err.message);	
				});
		} else {
			res.render('generic',{msg:'Not logged in'});
		}
	});

	return router;

}