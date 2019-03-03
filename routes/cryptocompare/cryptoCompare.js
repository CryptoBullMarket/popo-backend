var express = require('express');
var router = express.Router();
const presenter = require('./presenter')
const service = require('./service')
const id = require('../constants').id
const values = require('../constants').values
const string = require('../constants').string
const db = require('../database')
// const WebSocket = require('ws')

/** get candle stick data from db */
router.get('/gcs', function(req, res, next) {
    var from=req.query[id.params.from]
    var to=req.query[id.params.to]
    var interval=req.query[id.params.type]
    var fromTime=req.query[id.params.fromTime]
    var toTime=req.query[id.params.toTime]
    var isNew=req.query[id.params.isNew]
    
    from=(from==undefined||from==null)?'XRP':from.toUpperCase()
    to=(to==undefined||to==null)?'BTC':to.toUpperCase()
    interval=(interval==undefined||interval==null)?'1h':interval
    fromTime=(fromTime==undefined||fromTime==null)?new Date().getTime()-1000*60*60*500:fromTime
    toTime=(toTime==undefined||toTime==null)?new Date().getTime():toTime
    isNew=(isNew==undefined||isNew==null)?true:isNew
    isNew=isNew=='true'

    if(to=='USDT'||to=='BTC'||to=="ETH"||to=='BNB'){
        presenter.gcs(from,to,interval,fromTime,toTime,isNew,(status,data)=>{
            res.json({
                status:status,
                type:interval,
                message: data,
            })
        })
    }else{
        res.json({
            status:values.status.error,
            type:interval,
            message: [],
        })
    }
});


/** ticker 24 hours for all pair supported in binance api,, defaule from, to undefied returns all*/
router.get('/t', function(req, res, next) {
    var from=req.query[id.params.from]
    var to=req.query[id.params.to]

    from=from!=undefined?from.toUpperCase():from
    to=to!=undefined?to.toUpperCase():to
    
    if(to=='USDT'||to=='BTC'||to=="ETH"||to=='BNB'||to==undefined){
        if(from!=undefined && to!=undefined){
            presenter.cppl(from,to,'1h')
        }
        service.get24HrTicker(from,to,(status,data)=>res.json({
                status:status,
                message: data
            })
        )
    }else{
        res.json({
            status:values.status.error,
            message: [],
        })
    }
});

/** filtered trend for pairs*/
router.get('/gft', function(req, res, next) {
    var filterType=req.query[id.params.filterType]
    var fromTime=req.query[id.params.fromTime]
    filterType=(filterType==undefined || filterType==null || filterType<-1 || filterType>1)? 0 : filterType
    fromTime=(fromTime==undefined||fromTime==null)?new Date().getTime()-96*values.binance.candle_interval_milliseconds['_1h']:fromTime
    
    presenter.getFilterTrend(filterType,fromTime,(status,data)=>res.json({
            status:status,
            message: data
        })
    )
});
/** specific filtered trend for pairs*/
router.get('/gsft', function(req, res, next) {
    var from=req.query[id.params.from]
    var to=req.query[id.params.to]
    var fromTime=req.query[id.params.fromTime]

    from=(from==undefined||from==null)?'XRP':from.toUpperCase()
    to=(to==undefined||to==null)?'BTC':to.toUpperCase()
    fromTime=(fromTime==undefined||fromTime==null)?new Date().getTime()-96*values.binance.candle_interval_milliseconds['_1h']:fromTime


    if(to=='USDT'||to=='BTC'||to=="ETH"||to=='BNB'){
        presenter.getSpecificTrend(id.database.collection.history_from_to_type(from,to,'1h'),fromTime,(status,data)=>res.json({
                status:status,
                message: data
            })
        )
    }else{
        res.json({
            status:values.status.error,
            type:interval,
            message: [],
        })
    }
    
});

/** get specific volatility*/
router.get('/gv', function(req, res, next) {
    var from=req.query[id.params.from]
    var to=req.query[id.params.to]
    var fromTime=req.query[id.params.fromTime]
    from=(from==undefined||from==null)?'XRP':from.toUpperCase()
    to=(to==undefined||to==null)?'BTC':to.toUpperCase()
    fromTime=(fromTime==undefined||fromTime==null)?new Date().getTime()-96*values.binance.candle_interval_milliseconds['_1h']:fromTime

    if(to=='USDT'||to=='BTC'||to=="ETH"||to=='BNB'){
        presenter.getSpecificVolatility(id.database.collection.history_from_to_type(from,to,'1h'),fromTime,(status,data)=>res.json({
                status:status,
                message: data
            })
        )
    }else{
        res.json({
            status:values.status.error,
            type:interval,
            message: [],
        })
    }
    
    
});

/** get summary */
router.get('/gs', function(req, res, next) {
    var from=req.query[id.params.from]
    var to=req.query[id.params.to]
    var fromTime=req.query[id.params.fromTime]

    from=(from==undefined||from==null)?'XRP':from.toUpperCase()
    to=(to==undefined||to==null)?'BTC':to.toUpperCase()
    fromTime=(fromTime==undefined||fromTime==null)?new Date().getTime()-96*values.binance.candle_interval_milliseconds['_1h']:fromTime
    
    if(to=='USDT'||to=='BTC'||to=="ETH"||to=='BNB'){
        presenter.getSummary(id.database.collection.history_from_to_type(from,to,'1h'),fromTime,(status,data)=>res.json({
                status:status,
                message: data
            })
        )
    }else{
        res.json({
            status:values.status.error,
            type:interval,
            message: [],
        })
    }
    
});

/** test velvo */
// router.get('/tvelvo', function(req, res, next) {
//     var from=req.query[id.params.from]
//     var to=req.query[id.params.to]
//     from=(from==undefined||from==null)?'XRP':from.toUpperCase()
//     to=(to==undefined||to==null)?'BTC':to.toUpperCase()
//     const interval='1h'

//     if(to=='USDT'||to=='BTC'||to=="ETH"||to=='BNB'){
//         require('./service').velvo(from,to,interval)
//         res.json({
//             status:values.status.ok,
//             message: "tvelvo initialized."
//         })
//     }else{
//         res.json({
//             status:values.status.error,
//             type:interval,
//             message: `${to} cannot be found for tvelvo`,
//         })
//     }
    
// });

/** get feed list*/
router.get('/gfl', function(req, res, next) {
    presenter.getFeedList('1h',(status,data)=>res.json({
            status:status,
            message: data
        })
    )
});

/** test uscs */
// router.get('/tuscs', function(req, res, next) {
//     var from=req.query[id.params.from]
//     var to=req.query[id.params.to]
//     from=(from==undefined||from==null)?'XRP':from.toUpperCase()
//     to=(to==undefined||to==null)?'BTC':to.toUpperCase()
//     const interval='1h'

//     if(to=='USDT'||to=='BTC'||to=="ETH"||to=='BNB'){
//         require('./service').uscs(from,to,interval)
//         res.json({
//             status:values.status.ok,
//             message: "tvelvo initialized."
//         })
//     }else{
//         res.json({
//             status:values.status.error,
//             type:interval,
//             message: `${to} cannot be found for tvelvo`,
//         })
//     }
    
// });

/** test update trend levels  */
// router.get('/tutl', function(req, res, next) {
//     service.utl('BTC','USDT','1h',(status,data)=>res.json({
//             status:status,
//             message: data
//         })
//     )
// });
router.get('/gtl', function(req, res, next) {
    var from=req.query[id.params.from]
    var to=req.query[id.params.to]
    from=(from==undefined||from==null)?'BTC':from.toUpperCase()
    to=(to==undefined||to==null)?'USDT':to.toUpperCase()
    const interval='1h'

    if(to=='USDT'||to=='BTC'||to=="ETH"||to=='BNB'){
        const key=id.database.collection.history_from_to_type(from,to,interval)
        presenter.getTrendLevels(key,(status,data)=>res.json({
                status:status,
                message: data
            })
        )
    }else{
        res.json({
            status:values.status.error,
            type:interval,
            message: `${to} cannot be found for tvelvo`,
        })
    }
});

/** get stop percentage level :: calculate percentage diff from price to level  */
/** stop percentage is set to default value of 98.0 from the last cloing price i.e 2% below closing price */
router.get('/gsll', function(req, res, next) {
    presenter.getStopPercentageLevel((status,data)=>res.json({
            status:status,
            message: data
        })
    )

});


module.exports = { 
    router:router,
    service:service,
    uscs:()=>{
        require('./service').puscs() /** call funciton  then create an interval for it */
        setInterval(()=>{
            require('./service').puscs()
            console.log('puscs initialized')
        },require('../constants').values.binance.candle_interval_milliseconds[`_1h`])
    },
    utl:()=>{
        require('./service').putl() /** call funciton  then create an interval for it */
        setInterval(()=>{
            require('./service').putl()
            console.log('putl initialized')
        },require('../constants').values.binance.candle_interval_milliseconds[`_1d`])
    },
    forecast:()=>{
        require('./service').forecast()
        setInterval(()=>{
            require('./service').forecast()
            console.log('forecast initialized')
        },require('../constants').values.binance.candle_interval_milliseconds[`_1d`])
    },
}