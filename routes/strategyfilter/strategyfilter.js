var express = require('express');
var router = express.Router();
const presenter = require('./presenter')
const id = require('../constants').id
const values = require('../constants').values
const service = require('./service')

// for general search tweets
router.get('/gsf', function(req, res, next) {
    presenter.getStrategyFilter((status,data)=>{
        res.json({
            status: status,
            message: data
        })
    })
});



module.exports ={
    router: router,
    // update strategy filter
    usf: (interval,callback)=>{
        setInterval(()=>{
            console.log(`update strategy filter ${interval}`)
            service.updateStrategyFilter(interval)
        },values.binance.candle_interval_milliseconds[`_${interval}`])
        callback(values.status.ok,`update strategy filter service started with interval ${interval}`)
    }
};