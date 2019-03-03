var express = require('express');
var router = express.Router();
const string = require('../constants').string
const id = require('../constants').id
const utils = require('../utils')
const values = require('../constants').values
const service = require('./service')

router.get('/subscribe',(req,res,next)=>{
    const email=req.query[id.mailer.email]
    const from=req.query[id.mailer.from]
    const to=req.query[id.mailer.to]
    service.sendOtp(email,from,to,(status,message)=>{
        res.json({
            status:status,
            message:message
        })
    })
})
router.get('/subscribe/validate',(req,res,next)=>{
    const email=req.query[id.mailer.email]
    const from=req.query[id.mailer.from]
    const to=req.query[id.mailer.to]
    const otp=req.query[id.mailer.otp]

    service.validateOtp(email,from,to,otp,(status)=>{
        var message=''
        if(status===values.status.error){
            message=string.someWrong
        }else{
            message=string.subscribe.subscribedMessage(from,to)
            service.sendMail(email,string.subscribe.subscribed(from,to),message)
            service.saveSubscription(email,from,to)
        }
        res.json({
            status:values.status.ok,
            message:message,
        })
    })
})

router.get('/subscribe/subscribed',(req,res,next)=>{
    const email=req.query[id.mailer.email]
    const from=req.query[id.mailer.from]
    const to=req.query[id.mailer.to]
    service.isSubscribed(email,from,to,(status,message)=>{
        res.json({
            status:status,
            message:message
        })
    })
})

router.get('/subscribe/unsubscribe',(req,res,next)=>{
    const email=req.query[id.mailer.email]
    const from=req.query[id.mailer.from]
    const to=req.query[id.mailer.to]
    service.unSubscribe(email,from,to,(status,message)=>{
        service.sendMail(email,string.subscribe.unsubscribed,string.subscribe.unsubscribedMessage(from,to),undefined)
        res.json({
            status:status,
            message:message
        })
    })
})

// get 4day summary mailer
router.get('/sum', function(req, res, next) {
    var interval=req.query[id.params.type]
    interval=(interval==undefined||interval==null)?'1h':interval
    service.mailSummary(interval,(status,message)=>{
        res.json({
            status:status,
            message: message
        })
    })
});


module.exports={
    router:router,
    summary4Days:(interval,callback)=>{
        service.mailSummary(interval,callback),values.binance.candle_interval_milliseconds[`_${interval}`]
        setInterval(()=>service.mailSummary(interval,callback),values.binance.candle_interval_milliseconds[`_${interval}`])
    },
    trendChangeAlert:(from,to,interval,data,prevTrend,callback)=>{ service.mailTrendChangeSpecific(from,to,interval,data,prevTrend,callback) },
    bigVolumeAlert:(from,to,interval,currentPrice,previousPrice,callback)=>{ service.mailBigVolumeSpecific(from,to,interval,currentPrice,previousPrice,callback) },
    bigPriceMove:(from,to,interval,currentPrice,prevPrice,callback)=>{ service.mailBigPriceMove(from,to,interval,currentPrice,prevPrice,callback) },
}