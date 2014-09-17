
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');

var http = require('http');
var path = require('path');
var MongoStore = require('connect-mongo')(express);
var settings = require('./settings');

var fs = require('fs');
var accessLog = fs.createWriteStream('access.log',{flags : 'a'});
var errorLog = fs.createWriteStream('error.log',{flags:'a'});

var app = express();

//using github login
var passport = require('passport');
var GithubStrategy = require('passport-github').Strategy;
// var qqStrategy = require('passport-qq').Strategy;

var flash = require('connect-flash');
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use(flash());
// app.use(express.bodyParser({keepExtensions:true,uploadDir:'./public/images'}));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.logger({stream:accessLog}));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());//cookie解析的中间件
app.use(express.session({       //为会话提供支持
	secret : settings.cookieSecret,
	key : settings.db,
	cookie : {maxAge:30*24*60*60*1000},
	store : new MongoStore({
		db : settings.db
	})
}));
app.use(passport.initialize());//initialize the Passport

app.use(app.router);
app.use(express.static(path.join(__dirname, '/public')));

//github login
passport.use(new GithubStrategy({
	clientID:"b3039d694a76ee1d1bc4",
	clientSecret : "610a00c4a3188be4423951d93f5894e040e20c74",
	callbackURL:"http://localhost:3000/login/github/callback"
	},function(accessToken,refreshToken,profile,done){
	done(null,profile);
}));
// qq  login
// passport.use(new qqStrategy({
    // clientID: client_id,
    // clientSecret: client_secret,
    // callbackURL: "http://127.0.0.1:3000/login/qq/callback"
  // },function(accessToken, refreshToken, profile, done) {
    // User.findOrCreate({ qqId: profile.id }, function (err, user) {
    // return done(err, user);
    // });
// }));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

routes(app);
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
