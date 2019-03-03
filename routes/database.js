const network = require('./constants').network;
const id = require('./constants').id;
const values = require('./constants').values;
const string = require('./constants').string;
const utils = require('./utils');
var MongoClient = require('mongodb').MongoClient;


module.exports={
    // for subscribe
    validateOtp(key,otp,callback){
        this.find(`select * from ${id.database.collection.otp} where _key='${key}' and ${id.database.otp}='${otp}' and ${id.database.isDeleted}='false';`,(status,data)=>{
            if(status==values.status.ok){
                if(data!=null && data.length>0){
                    this.deleteWhere(id.database.collection.otp,`_key='${key}' and otp = ${otp}`,(status,message)=>{
                        // console.log(`validateOtp database.js: status:${status}, message:${message}`)
                    })
                    return callback(values.status.ok,callback)
                }else{
                    return callback(values.status.error,callback)
                }
            }
            return callback(status,data)
        })
    },
    deleteWhere(collection,where,callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            const query = client.query(
                `update ${id.database.collection.otp} set is_deleted = true where ${where};`,(err, res) => {
                    if(err){
                        client.end()
                        return callback(values.status.error,err)
                    }
                    client.end()
                    return callback(values.status.ok,string.subscribe.unsubscribed)
                })
        })
    },
    isSubscribed(email,from,to,mailerCallback){
        this.find(`select * from ${id.database.collection.subscribed} where ${id.database.email}='${email}' and ${id.database.from}='${from}' and ${id.database.to}='${to}' and ${id.database.isDeleted}='false';`,(status,data)=>{
            if(status==values.status.ok){
                if(data.length>0){
                    return mailerCallback(values.status.ok,true)
                }else{
                    return mailerCallback(values.status.ok,false)
                }
            }
            return mailerCallback(status,data)
        })
    },
    getGoodBadTweets(callback){
        this.find(`select * from ${id.database.collection.goodBadTweets} inner join ${id.database.collection.tweets} on cast(${id.database.collection.goodBadTweets}._id as int)=cast(${id.database.collection.tweets}._id as int) order by ${id.database.collection.goodBadTweets}._id desc;`,(status,data)=>{
            if(status==values.status.ok){
                for(var i in data){
                    data[i][id.database.text]=utils.base64Decode(data[i][id.database.text])
                    data[i][id.database.name]=utils.base64Decode(data[i][id.database.name])
                    data[i][id.database.screenName]=utils.base64Decode(data[i][id.database.screenName])
                    data[i][id.database.profileImageUrl]=utils.base64Decode(data[i][id.database.profileImageUrl])
                }
            }
            return callback(status,data)
        })
    },
    getGoodBadTweetsFew(count,callback){
        this.find(`select * from ${id.database.collection.goodBadTweets} inner join ${id.database.collection.tweets} on cast(${id.database.collection.goodBadTweets}._id as int)=cast(${id.database.collection.tweets}._id as int) order by ${id.database.collection.goodBadTweets}._id desc limit ${count};`,(status,data)=>{
            if(status==values.status.ok){
                for(var i in data){
                    data[i][id.database.text]=utils.base64Decode(data[i][id.database.text])
                    data[i][id.database.name]=utils.base64Decode(data[i][id.database.name])
                    data[i][id.database.screenName]=utils.base64Decode(data[i][id.database.screenName])
                    data[i][id.database.profileImageUrl]=utils.base64Decode(data[i][id.database.profileImageUrl])
                }
            }
            return callback(status,data)
        })
    },
    getClusterTweets(callback){
        this.find(`select * from ${id.database.collection.clusterTweets} inner join ${id.database.collection.tweets} on ${id.database.collection.clusterTweets}._id=${id.database.collection.tweets}._id order by ${id.database.collection.clusterTweets}.cluster,${id.database.collection.tweets}.timestamp_ms desc;`,(status,data)=>{
            if(status==values.status.ok){
                for(var i in data){
                    data[i][id.database.text]=utils.base64Decode(data[i][id.database.text])
                    data[i][id.database.name]=utils.base64Decode(data[i][id.database.name])
                    data[i][id.database.screenName]=utils.base64Decode(data[i][id.database.screenName])
                    data[i][id.database.profileImageUrl]=utils.base64Decode(data[i][id.database.profileImageUrl])
                }
            }
            return callback(status,data)
        })
    },
    createSubscribedTable(callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            const query = client.query(
                `create table if not exists ${id.database.collection.subscribed} (
                    _id bigint primary key, 
                    email varchar(52), 
                    _from varchar(7), 
                    _to varchar(7), 
                    created_at varchar(13), 
                    is_deleted varchar(13) 
                );`,(err, res) => {
                    if(err){
                        client.end()
                        return callback(values.status.error,err)
                    }
                    client.end()
                    return callback(values.status.ok,string.database.create.table(id.database.collection.subscribed))
                })
        })
    },
    createOTPTable(callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            const query = client.query(
                `create table if not exists ${id.database.collection.otp} (
                    _id serial primary key , 
                    _key varchar(84), 
                    otp char(6), 
                    created_at varchar(13), 
                    is_deleted varchar(13) 
                );`,(err, res) => {
                    if(err){
                        client.end()
                        return callback(values.status.error,err)
                    }
                    client.end()
                    return callback(values.status.ok,string.database.create.table(id.database.collection.otp))
                })
        })
    },
    createCandleStickTable(name,callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            const query = client.query(
                `create table if not exists ${name} (
                    _id bigint, 
                    open real, 
                    high real, 
                    low real, 
                    close real, 
                    volume real, 
                    close_time bigint, 
                    quote_asset_volume real, 
                    number_of_trades int, 
                    taker_buy_base_asset_volume real, 
                    taker_buy_quote_asset_volume real, 
                    primary key(_id)
                ) ;`,(err, res) => {
                    if(err){
                        client.end()
                        return callback(values.status.error,err)
                    }
                    client.end()
                    return callback(values.status.ok,string.database.create.table(name))
                })
        })
    },
    createGoodbadTable(callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            const query = client.query(
                `create table if not exists ${id.database.collection.goodBadTweets} (
                    _id bigint,
                    category char(1),
                    probability real,
                    timestamp bigint,
                    primary key(_id)
                );`,(err, res) => {
                    if(err){
                        client.end()
                        return callback(values.status.error,err)
                    }
                    client.end()
                    return callback(values.status.ok,string.database.create.table(id.database.collection.goodBadTweets))
                })
        })
    },
    createTrendLevelsTable(callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            const query = client.query(
                `create table if not exists ${id.database.collection.trendLevels} (
                    _id serial primary key,
                    _key varchar(15), 
                    close real, 
                    type char(1)
                );`,(err, res) => {
                    if(err){
                        client.end()
                        return callback(values.status.error,err)
                    }
                    client.end()
                    return callback(values.status.ok,string.database.create.table(id.database.collection.trendLevels))
                })
        })
    },
    createClusterTweetsTable(callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            const query = client.query(
                `create table if not exists ${id.database.collection.clusterTweets} (
                    _id bigint,
                    cluster varchar(2),
                    frequency int,
                    primary key(_id)
                );`,(err, res) => {
                    if(err){
                        client.end()
                        return callback(values.status.error,err)
                    }
                    client.end()
                    return callback(values.status.ok,string.database.create.table(id.database.collection.clusterTweets))
                })
        })
    },
    createSentimentTrendTable(callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            const query = client.query(
                `create table if not exists ${id.database.collection.sentimentTrend} (
                    _id bigint,
                    close real,
                    high real,
                    low real,
                    open real,
                    time bigint,
                    primary key(_id)
                ) ;`,(err, res) => {
                    if(err){
                        client.end()
                        return callback(values.status.error,err)
                    }
                    client.end()
                    return callback(values.status.ok,string.database.create.table(id.database.collection.sentimentTrend))
                })
        })
    },
    createPairListTable(callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            const query = client.query(
                `create table if not exists ${id.database.collection.pairList} (
                    _id serial primary key,
                    _from varchar(7),
                    _to varchar(7),
                    history_type varchar(3)
                );`,(err, res) => {
                    if(err){
                        client.end()
                        return callback(values.status.error,err)
                    }
                    client.end()
                    return callback(values.status.ok,string.database.create.table(id.database.collection.pairList))
                })
        })
    },
    createPredictionTable(callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            const query = client.query(
                `create table if not exists ${id.database.collection.prediction} (
                    _id serial primary key,
                    _from varchar(7),
                    _to varchar(7),
                    start_time bigint,
                    end_time bigint,
                    price real,
                    trend_change_time bigint,
                    trend smallint
                );`,(err, res) => {
                    if(err){
                        client.end()
                        return callback(values.status.error,err)
                    }
                    client.end()
                    return callback(values.status.ok,string.database.create.table(id.database.collection.prediction))
                })
        })
    },
    createTweetsTable(callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            const query = client.query(
                `create table if not exists ${id.database.collection.tweets} (
                    _id SERIAL PRIMARY KEY,
                    created_at char(32),
                    id_str bigint,
                    text text,
                    name varchar(120),
                    screen_name varchar(120),
                    profile_image_url text,
                    timestamp_ms bigint
                );`,(err, res) => {
                    if(err){
                        client.end()
                        return callback(values.status.error,err)
                    }
                    client.end()
                    return callback(values.status.ok,string.database.create.table(id.database.collection.tweets))
                })
        })
    },
    createTrendTable(callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            const query = client.query(
                `create table if not exists ${id.database.collection.trend} (
                    _id serial PRIMARY KEY,
                    _key varchar(15),
                    trend smallint,
                    confidence real,
                    velocity real,
                    start_time bigint,
                    end_time bigint
                );`,(err, res) => {
                    if(err){
                        client.end()
                        // console.log(err)                    
                        return callback(values.status.error,err)
                    }
                    client.end()
                    return callback(values.status.ok,string.database.create.table(id.database.collection.trend))
                })
        })
    },
    createVolatilityTable(callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            const query = client.query(
                `create table if not exists ${id.database.collection.volatility} (
                    _id serial PRIMARY KEY,
                    _key varchar(15),
                    volatility real,
                    start_time bigint,
                    end_time bigint
                );`,(err, res) => {
                    if(err){
                        client.end()
                        return callback(values.status.error,err)
                    }
                    client.end()
                    return callback(values.status.ok,string.database.create.table(id.database.collection.volatility))
                })
        })
    },
    createStopLossLevelTable(callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            const query = client.query(
                `create table if not exists ${id.database.collection.stopLossLevel} (
                    _id serial PRIMARY KEY,
                    _key varchar(15),
                    close real
                );`,(err, res) => {
                    if(err){
                        client.end()
                        return callback(values.status.error,err)
                    }
                    client.end()
                    return callback(values.status.ok,string.database.create.table(id.database.collection.stopLossLevel))
                })
        })
    },
    createStrategyFilterTable(callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            const query = client.query(
                `create table if not exists ${id.database.collection.strategyFilterTable} (
                    _id serial primary key , 
                    _key varchar(8), 
                    interval varchar(3),
                    strategy_name varchar(52),
                    time bigint, 
                    is_deleted varchar(13) 
                );`,(err, res) => {
                    if(err){
                        client.end()
                        return callback(values.status.error,err)
                    }
                    client.end()
                    return callback(values.status.ok,string.database.create.table(id.database.collection.strategyFilterTable))
                })
        })
    },
    insert(tableName,keys,_values,callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            var columnName=``
            for(var i in keys){
                columnName+=`${keys[i]},`
            }
            columnName=columnName.substring(0,columnName.length-1)// remove last comma
            columnName=`(${columnName})`
    
    
            var valueString=``
            for(var j in _values){
                var insertString=``
                for(var i in keys){
                    insertString+=`'${_values[j][keys[i]]}',`
                }
                insertString=insertString.substring(0,insertString.length-1)// remove last comma
                insertString=`(${insertString}),`
                valueString+=insertString
            }
            valueString=valueString.substring(0,valueString.length-1) // remove last comma
    
            const finalQ=`insert into ${tableName} ${columnName} values ${valueString};`
            const query = client.query(finalQ,(err, res) => {
                if(err){
                    client.end()
                    return callback(values.status.error,err)
                }
                client.end()
                return callback(values.status.ok,string.database.insert.values(_values.length))
            })
        })
    },
    find(_query,callback){
        const pg = require('pg');
        var pool = new pg.Pool(network.database_details)
        pool.connect((err, client, done)=>{
            if(err){
                done()
                return callback(values.status.error,err)
            }
            const query = client.query(_query,(err, res) => {
                    if(err){
                        client.end()
                        return callback(values.status.error,err)
                    }
                    client.end()
                    return callback(values.status.ok,res.rows)
                })
        })
    },

}