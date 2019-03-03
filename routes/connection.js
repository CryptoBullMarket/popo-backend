const network = require('./constants').network
const values = require('./constants').values
const string = require('./constants').string
const id = require('./constants').id
const utils = require('./utils')
const fetch = require('node-fetch')


module.exports={
    getNews(type,count,page,callback){
        // console.log('fetcing data')
        fetch(network.news(type,count,page),{
            method: 'GET',
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:57.0) Gecko/20100101 Firefox/57.0",
                "Accept": 'application/json',
                "X-API-Key": values.news.apiKey
            },
        }).then(response=>{
            // console.log('data fetched')
            if(response.ok){
                response.json().then(json=>{
                    console.log('sending data back')
                    callback(values.status.ok,json[id.news.articles])
                })
            }
        }).catch((error)=>{
            callback(values.status.error,[])
            console.log(error)
        })
    },

    getHistory(type,from,to,exchange,toTime,callback){
        // console.log(network.history(type,from,to,exchange,toTime))
        fetch(network.history(type,from,to,exchange,toTime),{
            method: 'GET',
            headers: values.baseHeader,
        }).then(response=>{
            response.json().then(json=>{
                callback(values.status.ok,json[id.cryptocompare.data])
            })
        }).catch((error)=>{
            callback(values.status.error,[])
            console.log(error)
        })
    },

    getFavourites(from,to,exchange,callback){
        // console.log(network.favourites(from,to,exchange))
        fetch(network.favourites(from,to,exchange),{
            method: 'GET',
            headers: values.baseHeader,
        }).then(response=>{
            response.json().then(json=>{
                if(json[id.cryptocompare.raw]===undefined){
                    callback(values.status.error,[])
                }else{
                    callback(values.status.ok,json[id.cryptocompare.raw])
                }
            })
        }).catch((error)=>{
            callback(values.status.error,string.someWrong)
            console.log(error)
        })
    },

    getCoinList(callback){
        // console.log(network.coinList)
        fetch(network.coinList,{
            method: 'GET',
            headers: values.baseHeader,
        }).then(response=>{
            response.json().then(json=>{
                callback(values.status.ok,Object.values(json[id.cryptocompare.data]),json[id.cryptocompare.baseImageUrl])
            })
        }).catch((error)=>{
            callback(values.status.error,[],'')
            console.log(values.status.error)
        })
    },

    getSocketScubscriptionList(from,to,callback){
        // console.log(network.socketSubsList(from,to))
        fetch(network.socketSubsList(from,to),{
            method: 'GET',
            headers: values.baseHeader,
        }).then(response=>{
            response.json().then(json=>{
                callback(values.status.ok,json[to][id.cryptocompare.trades])
            })
        }).catch((error)=>{
            callback(values.status.error,[])
            console.log(error)
        })
    },
    searchTweets(client,name,symbol,callback){
        // console.log(network.searchTweet(name,symbol))
        client.get('search/tweets', {q: `${symbol}%20${name}`})
        .then((tweet)=>{
            callback(values.status.ok,tweet[id.twitter.statuses])
        })
        .catch((error)=>{
            console.log('search tweet error')
            callback(values.status.error,[])
        })
    },
    streamTweets(client,track,follow,callback){
        var bufferTweets=[]
        // console.log('streaming tweets from twitter api')
        // client.stream('statuses/filter', {track: `${track}`,follow: `${follow}`,language: 'en'},  function(stream) {
        client.stream('statuses/filter', { follow: follow,language: 'en'},  function(stream) {
            stream.on('data', function(tweet) {
                const tweet_obj={}
                tweet_obj[id.database.collection.keyList.tweets[0]]=tweet.created_at
                tweet_obj[id.database.collection.keyList.tweets[1]]=tweet.id_str
                tweet_obj[id.database.collection.keyList.tweets[2]]=utils.base64(tweet.text)
                tweet_obj[id.database.collection.keyList.tweets[3]]=utils.base64(tweet.user.name)
                tweet_obj[id.database.collection.keyList.tweets[4]]=utils.base64(tweet.user.screen_name)
                tweet_obj[id.database.collection.keyList.tweets[5]]=utils.base64(tweet.user.profile_image_url)
                tweet_obj[id.database.collection.keyList.tweets[6]]=tweet.timestamp_ms

                bufferTweets.push(tweet_obj)
                // console.log(bufferTweets.length);
                // console.log(tweet.text)
                if(bufferTweets.length>50){
                    // console.log('--------------===========-------------')
                    callback(bufferTweets)
                    bufferTweets=[]
                }
            });
            stream.on('error', function(error) {
                console.log(error);
            });
        });
    },
    get24HrTicker(from,to,callback){
        // console.log('fetching 24hrs ticker price')
        var url=network.binance.ticker24h(from,to)
        if(from==undefined||to==undefined){
            url=network.binance.ticker24hAll
        }
        fetch(url,{
            method: 'GET',
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:57.0) Gecko/20100101 Firefox/57.0",
                "Accept": 'application/json',
            },
        }).then(response=>{
            // console.log('ticker fetched')
            if(response.ok){
                response.json().then(json=>{
                    callback(values.status.ok,json)
                })
            }
        }).catch((error)=>{
            callback(values.status.error,[])
            console.log(error)
        })
    },
    getCandleStick(from,to,interval,fromTime,toTime,callback){
        // console.log(`${network.binance.candleStick(from,to,interval,fromTime,toTime)}`)
        fetch(network.binance.candleStick(from,to,interval,fromTime,toTime),{
            method: 'GET',
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:57.0) Gecko/20100101 Firefox/57.0",
                "Accept": 'application/json',
            },
        }).then(response=>{
            // console.log('candlestick fetched')
            if(response.ok){
                response.json().then(json=>{
                    callback(values.status.ok,json)
                })
            }else{
                callback(values.status.error,[])
            }
        }).catch((error)=>{
            callback(values.status.error,[])
            console.log(error)
        })
    }
}