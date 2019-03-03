const id = require('../constants').id
const values = require('../constants').values
const string = require('../constants').string
const connection = require('../connection')
const db = require('../database')
const pythoninvoker=require('../../routes/pythoninvoker')
const ObjectID = require('mongodb').ObjectID
const utils = require('../utils')

module.exports={
    getStrategyFilter(callback){
        db.find(`select * from ${id.database.collection.strategyFilterTable} order by ${id.database.key}, ${id.database.interval}`,(status,data)=>{
            return callback(status,data)
        })
    },
}