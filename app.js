"use strict";
var express = require('express');
var app = express();
var crypto = require('crypto');
//set port
app.set('port', process.env.PORT || 3000);

// config
var Config = require('./config.js');
var passport = require('passport');

// set up handlebars view engine
var exphbs  = require('express-handlebars');
app.engine('handlebars', exphbs({
	defaultLayout: 'main',
	helpers: require("./helpers/handlebars.helpers.js").helpers
}));
app.set('view engine', 'handlebars');

// set up the public directory to serve static files
app.use(express.static('public'));

// cookies
var cookieParser = require('cookie-parser');
app.use(cookieParser());

// body parser -- for form and query string processing
app.use(require('body-parser').urlencoded({extended:true}));

// sessions
var session = require('express-session')
app.use(session({
  secret: Config.session,
  resave: false,
  saveUninitialized: true,
  cookie: { 
  	secure: false,
  	maxAge: 60 * 60 * 1000 // 1 hour
  }
}))
app.use(passport.initialize());
app.use(passport.session());

//DB
var Sequelize = require('sequelize');
var sequelize = new Sequelize(Config.pg);

// models
var User = sequelize.import('./models/user.js');
var Coin = sequelize.import('./models/coin.js');
var Ledger = sequelize.import('./models/ledger.js');
//sequelize.sync({force:true}); // <--- use to rebuild tables, with option {force:true}

// controllers
var Transact = require('./controllers/transact.js');
var Issue = require('./controllers/issue.js');

//passport
var passport = require('passport');
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id).then(user=>{
  		done(null, user);
  }).catch(err=>{
  		done(err);
  });
});
var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(
  function(username, password, done) {
  	User.getByUsername(username).then(user=>{
		if (!user) { 
			return done(null, false, { message: 'Incorrect username.' }); 
		}
		if (!user.verifyPassword(password)) { 
			return done(null, false, { message: 'Incorrect password.' }); 
		}
		//console.log(user);
		return done(null, user);
  	}).catch(err=>{
		if (err) { return done(err); }
  	});
    
  }
));

//--- testing ----//

/*Ledger.findById(22).then(ledger=>{
	ledger.setCoins([1,2]).then(sc=>{
		console.log(sc);
	});
});*/






// -----------------------------//
// ROUTES
// -----------------------------//
app.get('/',function(req,res){
	res.send('Hello');
});
app.post('/login',
  passport.authenticate('local', { successRedirect: '/dashboard',
                                   failureRedirect: '/login',
                                   failureFlash: false })
);
app.get('/login',function(req,res){
	res.render('login',{pagetitle:'Login'});
});

app.get('/dashboard',function(req,res){
	if (req.user){
		User.findById(req.user.id).then(u=>{
			var context = {};
			context.username = u.username;
			context.greeting = "Welcome "+ u.username + "!";
			u.getAcctBalance().then(b=>{
				context.balance = b[0].count;
				u.getUserLedger(6).then(l=>{
					context.ledger = l;
					res.render('dashboard',context);
				});
			})
			
		});	
	} else {
		res.redirect('/login');
	}
});

app.get('/mint', function(req,res){
	Coin.create({}).then(c=>{
		res.send("New coin created with Serial # " + c.serial_num);
	});
});

app.get('/ledger',function(req,res){
	Ledger.getRecords().then(l=>{
		let context = {};
		context.pagetitle = 'Ledger';
		context.records = l;
		res.render('ledger',context);
	});
});	

app.get('/bank',function(req,res){
	Coin.getBankLedger().then(l=>{
		let context = {};
		context.pagetitle = "Bank"
		context.records = l;
		res.render('bank',context);
	});
});

app.get('/bestow/:userid',function(req,res){
	let uid = req.params.userid;
	let amt = 1;
	if (uid > 0){
		Issue(uid,amt).then(r=>{
			var msg = 'The following coins were bestowed on user #' + uid + ':<br>';
			for (var i = 0; i<r.length; i++){
				msg += '<li>' + r[i].serial_num + '</li>';
			}
			var context = {};
			context.msg = msg;
			res.render('generic',{msg: msg});
			//console.log(r);
		}).catch(err=>{
			console.log('ERROR');
			console.log(err);
			res.send('Error '+ err);
		});
	} else {
		res.send("no user id");
	}
	
});

app.get('/profile/:username',function(req,res,next){
	User.getByUsername(req.params.username).then(u=>{
		if (!u){
			// go to 404
			next();
		} else{
			u.getAcctBalance().then(ct=>{
				var context = {};
				context.pagetitle = u.username;
				context.balance = ct[0].count;
				context.username = u.username;
				// if user is logged in, show them the ledger
				
				if (req.user && u.id == req.user.id){
					u.getUserLedger(0).then(l=>{
						//console.log(l);
						context.ledger = l;
						res.render('profile',context);
					});
				} else {
					// otherwise, just show the basic profile
					res.render('profile',context);
				}
				
				
			});
		}	
	});
});

app.get('/profile',function(req,res,next){
	console.log(req.user);
	if (req.user){
		res.redirect('/profile/'+req.user.username);
	} else {
		next();
	}
	
})

app.post('/send',function(req,res){
	if (req.user) {
	    // logged in
	    let sender_id = req.user.id; 
	    let receiver_id = parseInt(req.body.receiver_id);
	    let amt = parseInt(req.body.amt);
	    if (sender_id <= 0 || receiver_id <= 0 || amt <= 0){
	    	res.send('invalid values for transaction');
	    	return;
	    }
	    Transact(sender_id,receiver_id,amt).then(tr=>{
	    	console.log(tr);
	    	var msg = 'Successfully sent ' + amt + ' to user #' + receiver_id;
	    	res.send(msg);
	    }).catch(err=>{
	    	res.send('Error '+ err);
	    	console.log(err.stack);
	    });
	} else {
	    // not logged in
	    res.send("You must be logged in to send tokens");
	}
	
});

app.get('/send',function(req,res){
	if (req.user) {
	    // logged in
	    res.render('transact',{pagetitle:'Send'});
	} else {
	    // not logged in
	    res.send("You must be logged in to send tokens");
	}
	
});

// API routes
app.get('/api/user/transactions',function(req,res){
	if (req.user){
		var limit = 0;
		if (req.query.n){
			var limit = parseInt(req.query.n);
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

/*
other api routes:
/api/user/:username
/api/user/new  ?



 */

// 404
app.use(function (req,res,next) {
	res.status(404);
	res.render('404');
});
// 500
app.use(function (err, req, res, next) {
	console.error(err.stack);
	res.status(500);
	res.render('500');
});

// listen
app.listen(app.get('port'), function(){
	console.log( 'Express started on http://localhost:' +
    app.get('port') + '; press Ctrl-C to terminate.' );
});