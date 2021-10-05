var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
const sessions = require('express-session');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var user = require('./routes/user');
var startup = require('./routes/startup');
var gameMenu = require('./routes/gameMenu'); 
var gameType = require('./routes/gameType'); 
var gameplay = require('./routes/gameplay'); 

//api end point for game lunch
var gamelunch = require('./routes/gamelaunch'); 

var app = express();
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
  });
// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;

 


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cookie parser middleware
app.use(cookieParser());
//session middleware
//session middleware
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:false,
    cookie: { maxAge: oneDay },
    resave: false
}));
app.use('/', routes);
app.use('/startup', startup);
app.use('/user', user);
app.use('/gameMenu', gameMenu);
app.use('/gameType', gameType);
app.use('/gameplay', gameplay);

//api end point for game lunch
app.use('/game/launch', gamelunch);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


var debug = require('debug')('code');
var io = require('./lib/io');

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
});

io.init(server);

module.exports = app;
