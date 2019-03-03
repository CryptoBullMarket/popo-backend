var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var cryptoCompare = require('./routes/cryptocompare/cryptoCompare')
var twitter = require('./routes/twitter/twitter')
var news = require('./routes/news/news')
var mailer = require('./routes/mailer/mailer')
var strategyFilter = require('./routes/strategyfilter/strategyfilter')

const connection=require('./routes/connection')
const id=require('./routes/constants').id
const network=require('./routes/constants').network

const Lifeline=require('./routes/lifeline/Lifeline')
const LifeObject=require('./routes/lifeline/LifeObject')

const database = require('./routes/database')

/** need to create pool of treads to handle this.  */

global.LIFELINE_CS=new Lifeline('_1h',true) /** candle stick price updates + velvo  */
global.LIFELINE_MAILER=new Lifeline('_1h',true) /** for mailer services */
global.LIFELINE_DAILY=new Lifeline('_1d',true) /** any task to be performed daily (trend levels, prediction) */



var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/** setting up cors options */
var cors = require('cors')


/** Initialize database */
database.createGoodbadTable((status,message)=>{console.log(`status: ${status}, message: ${message}`)})
database.createSentimentTrendTable((status,message)=>{console.log(`status: ${status}, message: ${message}`)})
database.createTweetsTable((status,message)=>{console.log(`status: ${status}, message: ${message}`)})
database.createOTPTable((status,message)=>{console.log(`status: ${status}, message: ${message}`)})
database.createSubscribedTable((status,message)=>{console.log(`status: ${status}, message: ${message}`)})
database.createPairListTable((status,message)=>{console.log(`status: ${status}, message: ${message}`)})
database.createPredictionTable((status,message)=>{console.log(`status: ${status}, message: ${message}`)})
database.createClusterTweetsTable((status,message)=>{console.log(`status: ${status}, message: ${message}`)})
database.createTrendLevelsTable((status,message)=>{console.log(`status: ${status}, message: ${message}`)})
database.createStopLossLevelTable((status,message)=>{console.log(`status: ${status}, message: ${message}`)})
database.createStrategyFilterTable((status,message)=>{console.log(`status: ${status}, message: ${message}`)})

/** Initialize url paths */
app.use(cors())
app.use('/', index);
app.use('/news', news);
app.use('/cc',cryptoCompare.router);
app.use('/twitter',twitter.router);
app.use('/m',mailer.router)
app.use('/sf',strategyFilter.router)




/** 
 * Initialize 4 Day summary mailer 
 * Initialize update sucscribed candlestick services 
 * Initializie update tweet services 
 * Initialize cluster tweets
 * Initialize update trend levels
 * Initialize forecast
 */

/* mailer.summary4Days('1d',(status,message)=>{ console.log(`status: ${status}, message: ${message}`) })*/
// cryptoCompare.uscs()
// twitter.uts('1h',(status,message)=>{ console.log(`status: ${status}, message: ${message}`) })
// twitter.uct('1d',(status,message)=>{ console.log(`status: ${status}, message: ${message}`) })
// cryptoCompare.utl()
// cryptoCompare.forecast()

strategyFilter.usf('5m',(status,message)=>{ console.log(`status: ${status}, message: ${message}`) })
strategyFilter.usf('15m',(status,message)=>{ console.log(`status: ${status}, message: ${message}`) })
strategyFilter.usf('30m',(status,message)=>{ console.log(`status: ${status}, message: ${message}`) })
strategyFilter.usf('1h',(status,message)=>{ console.log(`status: ${status}, message: ${message}`) })
strategyFilter.usf('3h',(status,message)=>{ console.log(`status: ${status}, message: ${message}`) })
strategyFilter.usf('6h',(status,message)=>{ console.log(`status: ${status}, message: ${message}`) })
strategyFilter.usf('12h',(status,message)=>{ console.log(`status: ${status}, message: ${message}`) })
strategyFilter.usf('1D',(status,message)=>{ console.log(`status: ${status}, message: ${message}`) })
strategyFilter.usf('7D',(status,message)=>{ console.log(`status: ${status}, message: ${message}`) })
strategyFilter.usf('14D',(status,message)=>{ console.log(`status: ${status}, message: ${message}`) })
strategyFilter.usf('1M',(status,message)=>{ console.log(`status: ${status}, message: ${message}`) })




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
