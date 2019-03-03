const id = require('../constants').id
const values = require('../constants').values
const string = require('../constants').string
const connection = require('../connection')
const db = require('../database')
const pythoninvoker=require('../../routes/pythoninvoker')
const ObjectID = require('mongodb').ObjectID
const utils = require('../utils')


/** twitter api */
var Twitter = require('twitter');
var client = new Twitter({
    consumer_key: values.twitter.consumerKey,
    consumer_secret: values.twitter.consumerSecret,
    access_token_key: values.twitter.accessTokenKey,
    access_token_secret: values.twitter.accessTokenSecret,
});

module.exports={
    // getSpecificTweetsDb(name,from,limit,callback){
    //     console.log(`getting tweet for ${name} ${from}`)
    //     db.find(`select * from ${id.database.collection.tweets} where ${id.database.text}=${name} or ${id.database.text}=${name}`,{[id.twitter.tweet.text] : {$regex : new RegExp( `${name}|${from}`, 'i')}},{'_id':-1},limit,(status,data)=>{
    //         callback(status,data)
    //     })
    // },
    getTweetsDb(callback){
        // console.log(`getting home tweets`)
        db.find(`select * from ${id.database.collection.tweets} order by _id desc limit 20`,(status,data)=>{
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
    searchTweets(name,symbol,callback){
        // console.log(`getting tweet for ${symbol}`)
        connection.searchTweets(client,name,symbol,callback)
    },
    saveTweet(data){

    },
    preFilterTweetsList(data){
        list=[]
        for(var i in data){
            var item={}
            item[id.twitter.tweet.id]=data[i][id.database.collection.keyList.tweets[1]]
            item[id.twitter.tweet.index]=i
            item[id.twitter.tweet.text]=utils.base64Decode(data[i][id.database.collection.keyList.tweets[2]])
            item[id.twitter.tweet.timestamp]=data[i][id.database.collection.keyList.tweets[0]]
            list.push(item)
        }
        return list
    },
    postFilterTweetsList(data,filteredData){
        list=[]
        // console.log(`filtered data length: ${filteredData.length}`)
        for(var i in filteredData){
            var item=data[filteredData[i][id.twitter.tweet.index]]
            list.push(item)
        }
        return list
    },
    getGoodBadTweetsDb(callback){
        // console.log(`getting good bad tweet`)
        db.getGoodBadTweets((status,tweets)=>{
            // console.log(tweets)
            callback(status,tweets)
        })
    },
    getGoodBadTweetsFewDb(count,callback){
        // console.log(`getting good bad tweet few`)
        db.getGoodBadTweetsFew(count,(status,tweets)=>{
            callback(status,tweets)
        })
    },
    streamTweets(track,follow){
        connection.streamTweets(client,track,follow,(tweets)=>{require('./presenter').saveTweetDb(tweets)})
    },

    /**
     * Need to bind context for this function call as it uses the context(this.) to call functions
     */
    saveTweetDb(tweets){
        // console.log(`${tweets.length} tweets received`)
        var preparedList=this.preFilterTweetsList(tweets)
        pythoninvoker.getFilteredTweet(JSON.stringify(preparedList),(status,filteredData)=>{
            filteredData=this.postFilterTweetsList(tweets,filteredData)
            // console.log(`${filteredData.length} tweets filtered`)
            if(filteredData.length>0){
                db.insert(id.database.collection.tweets,id.database.collection.keyList.tweets,filteredData,(status,message)=>{}
                // console.log(message)
            )
            }else{
                console.log(string.database.insert.emptyList)
            }
        })
    },
    getSentimentTrend(callback){
        // console.log(`getting sentiment trend`)
        db.find(`select * from ${id.database.collection.sentimentTrend} order by time asc;`,(status,data)=>{
            callback(status,data)
        })
    },
    getClusterTweets(callback){
        // console.log(`getting cluster trend`)
        db.getClusterTweets(callback)
    }
    
}
