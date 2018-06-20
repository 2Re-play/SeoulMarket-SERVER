var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var myConfig = require("./config/myConfig.js");
//세션과 인증
var session = require('express-session');
var passport = require('passport');

//레디스 서버의 세션구성을 위한 정보
var redis = require('redis');
var redisClient = redis.createClient();
var redisStore = require('connect-redis')(session);

var routes = require('./routes/index');
var auth = require('./routes/auth');
var main = require('./routes/main');
var me = require('./routes/me');
var connect = require('./routes/connect');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  secret: myConfig.SESSION_SECRET,
  //store로 redis를 사용하겠다는 이야기
  store: new redisStore({
    host: "127.0.0.1",
    port: 6379,
    client: redisClient
  }),
  resave: true,
  // 변경이 된게 있을 때만 resave해라!, false일 경우 변경된게 없어도 resave해라.
  saveUninitialized: false,
  // 초기화된게 없으면(저장된게 없으면) 굳이 세션을 만들지 말아라! true일 경우 내용이 없어도 무조건 만듬.
  cookie: {
    path :'/',
    httpOnly:true,
    secure :false, //안전한 상태에서만 쿠키를 내보겠습니다. http에서만 보내겠다.
    maxAge : 1000*60*60*24*30
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// images라는 마운트포인트에 static한 서비스를 제공하겠다는 의미다.
app.use('/images', express.static(path.join(__dirname, 'uploads/images')));

app.use('/', routes);
app.use('/auth', auth);
app.use('/main', main);
app.use('/me', me);
app.use('/connect', connect);

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
    console.log(err);
    console.log(err.message);
    res.send({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  console.log(err);
  console.log(err.message);
  res.send({
    message: err.message,
    error: {}
  });
});

module.exports = app;