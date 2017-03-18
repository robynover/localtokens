"use strict";
var express = require('express');
var app = express();
//set port
app.set('port', process.env.PORT || 3000);

// config
var Config = require('./config.js');
var passport = require('passport');

// set up handlebars view engine
var handlebars = require('express-handlebars').create({ defaultLayout:'main' });
app.engine('handlebars', handlebars.engine);
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
  cookie: { secure: false }
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


/*var receiver = 3;
var sender = 1;
var amt = 1;
Transact(sender,receiver,amt).then(r=>{
	console.log('transaction made');
}).catch(err=>{
	console.log('ERROR');
	console.log(err);
});*/
/*var userId = 1;
var amt = 2;
Issue(userId,amt).then(r=>{
	console.log('transaction complete');
}).catch(err=>{
	console.log('ERROR');
	console.log(err);
});*/


// routing
app.get('/',function(req,res){
	res.send('Hello');
});
app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: false })
);
app.get('/login',function(req,res){
	res.render('login');
});

app.get('/dashboard',function(req,res){
	if (req.user) {
	    // logged in
	    res.send("You're in!");
	} else {
	    // not logged in
	    res.send("You must be logged in");
	}
});

app.get('/mint', function(req,res){
	Coin.create({}).then(c=>{
		res.send("New coin created with Serial # " + c.serialNum);
	});
});

app.get('/ledger',function(req,res){
	Ledger.getRecords().then(l=>{
		//console.log(l);
		let context = {};
		context.records = l;
		res.render('ledger',context);
		//res.send(l[0]);
	});
});	

app.get('/bank',function(req,res){
	Coin.getBankLedger().then(l=>{
		let context = {};
		context.records = l;
		res.render('bank',context);
	});
});

app.get('/bestow/:userid',function(req,res){
	let uid = req.params.userid;
	let amt = 2;
	if (uid > 0){
		Issue(uid,amt).then(r=>{
			var msg = 'The following coins were bestowed on user #' + uid + ':<br>';
			for (var i = 0; i<r.length; i++){
				msg += '<li>' + r[i].coinSerialnum + '</li>';
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

app.get('/profile/:username',function(req,res){
	User.getByUsername(req.params.username).done(u=>{
		u.getAcctBalance().done(ct=>{
			var context = {};
			context.balance = ct[0].count;
			context.username = u.username;
			u.getUserLedger().done(l=>{
				//console.log(l);
				context.ledger = l;
				res.render('profile',context);
			});
			
		})
	});
});

app.post('/send',function(req,res){
	let bid = 1; // TODO: check login and use stored ID in req.user
	let sid = parseInt(req.body.receiver_id);
	let amt = parseInt(req.body.amt);
	if (bid <= 0 || sid <= 0 || amt <= 0){
		res.send('invalid values for transaction');
		return;
	}
	Transact(bid,sid,amt).then(tr=>{
		console.log(tr);
		var msg = 'Successfully sent ' + amt + ' to user #' + tr[0].receiverId;
		res.send(msg);
	}).catch(err=>{
		res.send('Error '+ err);
		console.log(err.stack);
	});
});

app.get('/send',function(req,res){
	res.render('transact');
});

// listen
app.listen(app.get('port'), function(){
	console.log( 'Express started on http://localhost:' +
    app.get('port') + '; press Ctrl-C to terminate.' );
});