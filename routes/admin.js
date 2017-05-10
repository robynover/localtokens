"use strict";

module.exports = function(express,app){
	var router = express.Router();
	
	var User = app.get('models').user;
	var Ledger = app.get('models').ledger;

	// === require admin users for this section=== //
	router.all('/*',function(req,res,next){
		if (req.user){
			User.findById(req.user.id).then(u=>{
				if (u.isAdmin()){
					next();
				} else {
					res.status(401);
					res.render('generic',{msg:'You are not authorized to view this page'});
				}	
			});
		} else {
			res.status(401);
			res.render('generic',{msg:'You are not authorized to view this page'});
		}	
	});

	router.get('/',function(req,res){
		res.redirect('/admin/ledger');
	});

	router.get('/ledger',function(req,res){

		var perPg = 10;
		var pg = 0;
		var page = 1;
		if (req.query.pg){
			page = req.query.pg;
			pg = parseInt(req.query.pg) - 1;
		}
		var offset = pg * perPg;
		var total_entries, total_pages;

		var context = {};
		context.layout = 'admin';
		context.pagetitle = 'Ledger';
		context.loggedin = true;
		context.is_admin = req.user.is_admin;
		context.username = req.user.username;

		Ledger.getTransactions(perPg,offset)
			.then(records=>{
				if (records.length > 0){ 
					total_entries = records[0].total_entries;
					total_pages = Math.ceil(records[0].total_entries / perPg);
				}
				context.total_entries = total_entries;
				context.total_pages = total_pages;
				if (parseInt(page) + 1 <= total_pages){
					context.nextpage = parseInt(page) + 1;
				}
				if (parseInt(page) - 1 > 0){
					context.prevpage = parseInt(page) - 1;
				}
				context.page = page;

				context.records = records;
				res.render('ledger-admin.handlebars',context);
			})
			.catch(err=>{
				res.render('generic',{msg:err});
			});
	});

	router.get('/users',(req,res)=>{
		var context = {};
		context.layout = 'admin';
		context.pagetitle = 'Users';
		context.loggedin = true;
		context.is_admin = req.user.is_admin;
		context.username = req.user.username;

		var limit = 20;
		var pg = 0;
		if (req.query.pg){
			pg = parseInt(req.query.pg);
		}
		var offset = limit * pg;
		var page = pg + 1;

		var onlyInactive = false;
		if (req.query.inactive){
			onlyInactive = true;
		}

		User.getUsersWithBalance(onlyInactive,limit,offset)
			.then(users=>{
				context.users = users;

				var total_entries = users[0].total_entries;
				var total_pages = Math.ceil(total_entries / limit);
				context.total_entries = total_entries;
				context.total_pages = total_pages;
				context.page = page;
				if (parseInt(page) + 1 <= total_pages){
					context.nextpage = parseInt(page) + 1;
				}
				if (parseInt(page) - 1 > 0){
					context.prevpage = parseInt(page) - 1;
				}

				res.render('users-admin',context);
			});
	});

	router.get('/bestow',(req,res)=>{
		var context = {};
		context.layout = 'admin';
		context.pagetitle = 'Bestow';
		context.loggedin = true;
		context.is_admin = req.user.is_admin;
		context.username = req.user.username;
		context.result_msg = req.flash('message');
		res.render('bestowform',context);
	});

	router.post('/bestow',(req,res)=>{
		var context = {};
		context.layout = 'admin';
		context.pagetitle = 'Bestow';
		context.loggedin = true;
		context.is_admin = req.user.is_admin;
		context.username = req.user.username;

		var amount = parseInt(req.body.num);

		if (amount > 10){
			context.msg = "Cannot bestow more than 10 tokens";
			res.render('generic',context);
			return;
		}

		User.getByUsername(req.body.receiver)
			.then(idObj=>{
				Ledger.create({
					receiver_id: idObj.id,
					amount: amount,
					note: ''
				})
					.then(ledger=>{
						req.flash('message', 'Successfully bestowed ' + amount + ' on ' + idObj.username);
						res.redirect('/admin/bestow');
					})
					.catch(err=>{
						res.render('generic',{msg:err});
					});
			});
	});

	return router;
}
