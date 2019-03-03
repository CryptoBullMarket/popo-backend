var express = require('express');
var router = express.Router();
const presenter = require('./presenter')
const id = require('../constants').id
const values = require('../constants').values
const string = require('../constants').string
const WebSocket = require('ws')
const service = require('./service')
const db = require('../database')

var locked=false

// for general search tweets
router.get('/q', function(req, res, next) {
    const from=req.query[id.params.from]
    const coinName=req.query[id.twitter.coinName]

    from=(from==undefined||from==null)?'XVG':from.toUpperCase()
    coinName=(coinName==undefined||to==null)?'Verge':coinName
    presenter.getTweetsDb((status,data)=>{
        res.json({
            status:status,
            message: data
        })
    })
});

// for home tweets
router.get('/h', function(req, res, next) {
    presenter.getTweetsDb((status,data)=>{
        res.json({
            status:status,
            message: data
        })
    })
});

// for updating sentiment trend
router.get('/ust',function(req, res, next) {
    service.updateSentimentTrend((status,message)=>{
        res.json({
            status:status,
            message: message
        })
    })
});

router.get('/s',function(req, res, next) {
    presenter.getSentimentTrend((status,data)=>{
        res.json({
            status:status,
            message: data
        })
    })
});

// update tweet (after removing spams)
router.get('/ut',function(req, res, next) {
    if(locked==false){
        db.createTweetsTable((status,message)=>{
            // console.log(`status: ${status}, message: ${message}`)
        })
        locked=true
        service.updateTweetDb()
    }else if(locked){
        res.json({
            status:values.status.error,
            message: string.functionLocked
        })
    }
    
});


// update good bad tweet
router.get('/ugb', function(req, res, next) {
    service.updateGoodBadTweets((status,data)=>{
        res.json({
            status:status,
            message: data
        })
    })
});

// get good bad tweets
router.get('/ggb', function(req, res, next) {
    presenter.getGoodBadTweetsDb((status,data)=>{
        res.json({
            status:status,
            message: data
        })
    })
});

// get good bad few
router.get('/ggbf', function(req, res, next) {
    var count=parseInt(req.query[id.params.count])
    if(count==undefined||count==null||count==''||count=='undefined'||isNaN(count)) count=20
    presenter.getGoodBadTweetsFewDb(count,(status,data)=>{
        res.json({
            status:status,
            message: data
        })
    })
});

// update cluster tweet
router.get('/uct', function(req, res, next) {
    service.updateClusterTweets((status,data)=>{
        res.json({
            status:status,
            message: data
        })
    })
});

// get cluster tweets
router.get('/gct', function(req, res, next) {
    presenter.getClusterTweets((status,data)=>{
        res.json({
            status:status,
            message: data
        })
    })
});

module.exports ={
    router: router,
    uts: (interval,callback)=>{
        setInterval(()=>{
            service.updateGoodBadTweets((status,message)=>{
                // console.log(`updateGoodBadTweets:: status:${status}, message:${message}`)
                if(status==values.status.ok){
                    service.updateSentimentTrend((status,message)=>{
                        // console.log(`updateSentimentTrend:: status:${status}, message:${message}`)
                    })
                }
            })
        },values.binance.candle_interval_milliseconds[`_${interval}`])
        callback(values.status.ok,`update tweet service started with interval ${interval}`)
    },
    uct: (interval,callback)=>{
        setInterval(()=>{
            service.updateClusterTweets((status,message)=>{
                // console.log(`updateClusterTweets:: status:${status}, message:${message}`)
            })
        },values.binance.candle_interval_milliseconds[`_${interval}`])
        callback(values.status.ok,`update cluster service started with interval ${interval}`)
    }
};