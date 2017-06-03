"use strict";
process.setMaxListeners(12); // suppress warning re: up to 10 listeners

var express = require('express');
var app = express();
var crypto = require('crypto');
//set port
app.set('port', process.env.PORT || 3333);

// config
var config = require('./config/config.js')[app.get('env')];

var passport = require('passport');
var flash = require('connect-flash');
var helmet = require('helmet');

// set up handlebars view engine
var exphbs  = require('express-handlebars');
app.engine('handlebars', exphbs({
	defaultLayout: 'main',
	partialsDir: __dirname + '/views/partials/',
	helpers: require("./views/helpers/handlebars.helpers.js").helpers
}));
app.set('view engine', 'handlebars');

// set up the public directory to serve static files
app.use(express.static('public'));

// helmet for security in headers
app.use(helmet());

// body parser -- for form and query string processing
app.use(require('body-parser').urlencoded({extended:true}));

// sessions
var session = require('express-session');
const MongoStore = require('connect-mongo')(session);
app.use(session({
  secret: config.session,
  store: new MongoStore({ url: config.mongoSession }),
  resave: false,
  saveUninitialized: true,
  name: 'curSess', //name of the cookie
  cookie: { 
  	secure: false,
  	maxAge: 3 * 60 * 60 * 1000, // 3 hours
  	httpOnly: true
  }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


// sequelize models
app.set('models',require('./models'))
var User = app.get('models').user;

var sequelize = app.get('models').sequelize;

sequelize.sync(); //{force:true}

// mongoose
var mongoose = require('mongoose');
mongoose.connect(config.mongo);
mongoose.Promise = require('bluebird');



// passport
var passport = require('passport');
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id,{
      attributes: ['id', 'username', 'firstname','is_admin', 'is_active', 'max_negative_balance']
    }).then(user=>{
  	 done(null, user);
  	 return null;
  }).catch(err=>{
  	done(err);
  });
});

var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(
  function(username, password, done) {
  	User.getByUsername(username).then(user=>{
  		if (!user) { 
  			return done(null, false, { message: 'Incorrect username or password.' }); 
  		}
  		if (!user.verifyPassword(password)) { 
  			return done(null, false, { message: 'Incorrect username or password.' }); 
  		}
  		if (!user.is_active){
  			return done(null, false, { message: 'Your account has not been activated.' }); 
  		}
      // Success
  		return done(null, user);
  	}).catch(err=>{
		if (err) { return done(err); }
  	});  
  }
));
var savePath = require('./savePath');
app.use(savePath);

// -----------------------------//
// ROUTES
// -----------------------------//
var apiRoutes = require('./routes/api.js')(express,app);
var homeRoutes = require('./routes/home.js')(express,app);
var userRoutes = require('./routes/user.js')(express,app);
var exchangeRoutes = require('./routes/exchange.js')(express,app);
var communityRoutes = require('./routes/community.js')(express);
var adminRoutes = require('./routes/admin.js')(express,app);
var inviteRoutes = require('./routes/invite.js')(express);

app.use('/api', apiRoutes);
app.use('/', homeRoutes);
app.use('/user', userRoutes);
app.use('/exchange', exchangeRoutes);
app.use('/community', communityRoutes);
app.use('/admin', adminRoutes);
app.use('/invite', inviteRoutes);


// 404
app.use(function (req,res,next) {
	res.status(404);
	res.render('404');
});
// 500
app.use(function (err, req, res, next) {
	console.error(err.stack);
  console.log(err);
	res.status(500);
	res.render('generic',{msg:err});
});

// listen
app.listen(app.get('port'), function(){
	console.log( 'Express started on http://localhost:' +
    app.get('port') + '; press Ctrl-C to terminate.' );
});
module.exports = app;
