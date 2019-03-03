const db = require('../database')
const connection = require('../connection')
const presenter = require('./presenter')
const id = require('../constants').id
const values = require('../constants').values
const string = require('../constants').string
const pythoninvoker=require('../../routes/pythoninvoker')

module.exports={
    updateStrategyFilter(interval,callback){
        pythoninvoker.updateStrategyFilter(interval,(status,message)=>{
            callback(values.status.ok,message)
        })
    },
}