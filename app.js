"use strict";
process.setMaxListeners(12); // suppress warning re: up to 10 listeners

var express = require('express');
var app = express();
var crypto = require('crypto');
//set port
app.set('port', process.env.PORT || 3000);

// config
var Config = require('./config.js');

var passport = require('passport');
var flash = require('connect-flash');
var helmet = require('helmet');

// set up handlebars view engine
var exphbs  = require('express-handlebars');
app.engine('handlebars', exphbs({
	defaultLayout: 'main',
	partialsDir: __dirname + '/views/partials/',
	helpers: require("./helpers/handlebars.helpers.js").helpers
}));
app.set('view engine', 'handlebars');

// set up the public directory to serve static files
app.use(express.static('public'));

app.use(helmet());

// cookies
var cookieParser = require('cookie-parser');
app.use(cookieParser());

// body parser -- for form and query string processing
app.use(require('body-parser').urlencoded({extended:true}));

// sessions
var session = require('express-session');
const MongoStore = require('connect-mongo')(session);
app.use(session({
  secret: Config.session,
  store: new MongoStore({ url: Config.mongo }),
  resave: false,
  saveUninitialized: true,
  name: 'sessionId',
  cookie: { 
  	secure: false,
  	maxAge: 60 * 60 * 1000, // 1 hour
  	httpOnly: true
  }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

//DB
var Sequelize = require('sequelize');
var sequelize = new Sequelize(Config.pg,{logging: false});

// models
var User = sequelize.import('./models/user.js');
//var Coin = sequelize.import('./models/coin.js');
//var Ledger = sequelize.import('./models/ledger.js');
//sequelize.sync(); //<--creates join table on first run

// controllers
var Transact = require('./controllers/transact.js');
var Issue = require('./controllers/issue.js');

// routes 
var adminRoutes = require('./routes/admin.js')(express,sequelize);
var userRoutes = require('./routes/user.js')(express,sequelize);
var homeRoutes = require('./routes/home.js')(express,sequelize);
var transactRoutes = require('./routes/transact.js')(express,sequelize);
var apiRoutes = require('./routes/api.js')(express,sequelize);
var postRoutes = require('./routes/post.js')(express); // post uses mongo, not sequelize


// passport
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
		if (!user.is_active){
			return done(null, false, { message: 'Your account has not been activated. Check your email for an activation link.' }); 
		}
		// Success
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

app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use('/', homeRoutes);
app.use('/transact', transactRoutes);
app.use('/api', apiRoutes);
app.use('/messageboard', postRoutes);


// 404
app.use(function (req,res,next) {
	res.status(404);
	res.render('404');
});
// 500
app.use(function (err, req, res, next) {
	console.error(err.stack);
	res.status(500);
	res.render('generic',{msg:err});
});

// listen
app.listen(app.get('port'), function(){
	console.log( 'Express started on http://localhost:' +
    app.get('port') + '; press Ctrl-C to terminate.' );
});
