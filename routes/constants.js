module.exports = {
    network:{
        news:(type,count,page)=>`https://newsapi.org/v2/${type}?sources=crypto-coins-news&pageSize=${count}&page=${page}`,
        history:(historyType,from,to,exchange,toTime)=>`https://min-api.cryptocompare.com/data/${historyType}?fsym=${from}&tsym=${to}&e=${exchange}&limit=${2000}&toTs=${toTime}`,
        favourites:(fromList,toList,exchange)=>`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${fromList}&tsyms=${toList}&e=${exchange}`,
        coinList:`https://min-api.cryptocompare.com/data/all/coinlist`,
        socketSubsList:(from,to)=>`https://min-api.cryptocompare.com/data/subs?fsym=${from}&tsyms=${to}`,
        cryptocompareWebSocket:`https://streamer.cryptocompare.com/`,
        searchTweet:(name,symbol)=>`https://api.twitter.com/1.1/search/tweets.json?q=${name}%20${symbol}%20crypto%blockchain&result_type=mixed`,
        
        binance:{
            ticker24h:(from,to)=>`https://api.binance.com/api/v1/ticker/24hr?symbol=${from}${to}`,
            ticker24hAll:`https://api.binance.com/api/v1/ticker/24hr`,
            candleStick:(from,to,interval,fromTime,toTime)=>`https://api.binance.com/api/v1/klines?symbol=${from}${to}&interval=${interval}&startTime=${fromTime}&endTime=${toTime}`,

        },

        subscribeOtp:(email,from,to,otp)=>`https://poposerver.herokuapp.com/m/subscribe/validate?email=${email}&from=${from}&to=${to}&otp=${otp}`,
        database:process.env.database,
        database_details:{
            host: process.env.db_host,
            database: process.env.db_database,
            user: process.env.db_user,
            password: process.env.db_password,
            port: process.env.db_port,
            connectionTimeoutMillis: 5000,
        },
    },
    files:{
        python:{
            compiler:'python3.6',
            sentimentTrend:`pythonscript/sentiment_trend.py`,
            filterTweet:`pythonscript/filter_tweet.py`,
            goodBadTweet:`pythonscript/good_bad_tweet.py`,
            velvoCalculator:`pythonscript/velvo_calculator.py`,
            trendLevel:`pythonscript/trend_levels.py`,
            clusterTweets:`pythonscript/cluster_tweets.py`,
            forecast:`pythonscript/forecaster/app.py`,
            binance:{
                candlestick:`pythonscript/binance/candlestick.py`
            },
            strategyFilter:`pythonscript/strategyfilter/main.py`,
        },
        buildPath:(pathFromBin)=>false?`/app/routes/bin/${pathFromBin}`:`/home/nischit/Desktop/awesome/popo-backend/routes/bin/${pathFromBin}`,
        buildPathImage:(name)=>false?`/app/public/images/${name}`:`/home/nischit/Desktop/awesome/popo-backend/public/images/${name}`,
    },
    values:{
        baseHeader:{
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:57.0) Gecko/20100101 Firefox/57.0",
            "Accept": 'application/json',
        },
        news:{
            apiKey: process.env.news_apikey,
            everything:'everything',
            headlines:'top-headlines',
            articles:'articles',
        },
        twitter:{
            consumerKey: process.env.twitter_consumerKey,
            consumerSecret: process.env.twitter_consumerSecret,
            accessTokenKey: process.env.twitter_accessTokenKey,
            accessTokenSecret: process.env.twitter_accessTokenSecret,
        },
        status:{
            ok:'ok',
            error:'error',
        },
        mailer:{
            server:{name:'Gmail',email:process.env.mailer_email,password:process.env.mailer_password},
        },
        binance:{
            candle_interval:{   
                _1m:'1m', //minute
                _3m:'3m',
                _5m:'5m',
                _15m:'15m',
                _30m:'30m',
                _1h:'1h',  //hour
                _2h:'2h',
                _4h:'4h',
                _6h:'6h',
                _8h:'8h',
                _12h:'12h',
                _1d:'1d', //day
                _3d:'3d',
                _1w:'1w',
                _1M:'1M', //month
            }, candle_interval_milliseconds:{   
                _1m:1000*60*1, //minute
                _3m:1000*60*3,
                _5m:1000*60*5,
                _15m:1000*60*15,
                _30m:1000*60*30,
                _1h:1000*60*60*1,  //hour
                _2h:1000*60*60*2,
                _4h:1000*60*60*4,
                _6h:1000*60*60*6,
                _8h:1000*60*60*8,
                _12h:1000*60*60*12,
                _1d:1000*60*60*24*1, //day
                _3d:1000*60*60*24*3,
                _1w:1000*60*60*24*7, //week
                _1M:1000*60*60*24*30, //month
            }
        },
    },
    id:{
        params:{ 
            count:'count', 
            from:'f',
            to:'t',
            coinName:'coinName',
            type:'type',
            exchange:'e',
            toTime:'tt',
            fromTime:'ft',
            isNew:'n',
            filterType:'filt',
            stopPercentage:'sp',
        },
        binance:{
            id:'_id',
            open:'open',
            high:'high',
            low:'low',
            close:'close',
            volume:'volume',
            close_time:'close_time',
            quote_asset_volume:'quote_asset_volume',
            number_of_trades:'number_of_trades',
            taker_buy_base_asset_volume:'taker_buy_base_asset_volume',
            taker_buy_quote_asset_volume:'taker_buy_quote_asset_volume',
        },
        application:{db:'db'},
        lifeline:{
            ucs:(from,to,interval)=>`ucs_${from}_${to}_${interval}`,
            utl:(from,to,interval)=>`utl_${from}_${to}_${interval}`,
            forecast:(from,to,interval)=>`forecast_${from}_${to}_${interval}`,
            sll:(from,to,interval)=>`sll_${from}_${to}_${interval}`,
            mailer:{
                alert:{
                    trendChange:(key)=>`a_tc_${key}`,
                    bigVolume:(key)=>`a_bv_${key}`,
                },
                summary:(key)=>`summary_${key}`,
            },
        },
        pythonInvoker:{
            isAlert:'is_alert',
            previousTrend:'previous_trend',
            currentTrend:'current_trend',
        },
        database:{
            name:'coins',
            collection:{
                otp:'otp',
                subscribed:'subscribed',
                tweets:'tweets',
                goodBadTweets:'good_bad_tweets',
                sentimentTrend:'sentiment_trend',
                clusterTweets:'cluster_tweets',
                trendLevels:'trend_levels',
                history:'history',
                forecast:'forecast',
                trend:'trend',
                volatility:'volatility',
                pairList:'pair_list',
                prediction:'prediction',
                history_from_to_type:(from,to,type)=>`${from}_${to}_${type}`,
                stopLossLevel:`stop_loss_level`,
                strategyFilterTable:`strategy_filter`,
                
                trend_velocity:(from,to)=>`trend_velocity`,
                dump:{
                    candlestick:'candlestick_dump'
                },
                keyList:{
                    history:['_id','open','high','low','close','volume','close_time','quote_asset_volume','number_of_trades','taker_buy_base_asset_volume','taker_buy_quote_asset_volume'],
                    goodBadTweets:['_id','category','probability','timestamp'],
                    sentimentTrend:['_id','close','high','low','open','time'],
                    // tweets:['_id','created_at','id_str','text','name','screen_name','profile_image_url','timestamp_ms'],
                    tweets:['created_at','id_str','text','name','screen_name','profile_image_url','timestamp_ms'],
                    otp:['_key','otp','created_at','is_deleted'],
                    subscribed:['email','_from','_to','created_at','is_deleted'],
                    pairList:['_from','_to','history_type'],
                    clusterTweets:['_id','cluster','frequency'],
                },
            },
            id:'_id',
            key:'_key',
            open:'open',
            high:'high',
            low:'low',
            close:'close',
            closeTime:'close_time',
            volume:'volume',
            quoteAssetVolume:'quote_asset_volume',
            numberOfTrades:'number_of_trades',
            takerBuyBaseAssetVolume:'taker_buy_base_asset_volume',
            category:'category',
            probability:'probability',
            timestamp:'timestamp',
            time:'time',
            idStr:'id_str',
            createdAt:'created_at',
            isDeleted:'is_deleted',
            text:'text',
            name:'name',
            screenName:'screen_name',
            profileImageUrl:'profile_image_url',
            timestampMs:'timestamp_ms',
            otp:'otp',
            email:'email',
            from:'_from',
            to:'_to',
            historyType:'history_type',
            cluster:'cluster',
            frequency:'frequency',
            cc:{
                id:'_id',
                history:'history',
                time:'time',
                history_from_to_type:(from,to,type)=>`${from}_${to}_${type}`,
                
            },
            
        },
        news:{everything:0,headlines:1,articles:'articles'},
        cryptocompare:{
            history:{0:'1m',1:'1h',2:'1d'},
            from:'from',
            to:'to',
            exchange:'exchange',
            historyType:'historyType',
            fromTime:'fromTime',
            toTime:'toTime',
            raw:'RAW',
            data:'Data',
            baseImageUrl:'BaseImageUrl',
            trades:'TRADES',
            clientEvent:'clientEvent',
            serverEvent:'serverEvent',
            close:'close',
            high:'high',
            low:'low',
            open:'open',
            trendData:'trendData',
            pairHistoryType:'pairHistoryType',
            datasetType:'datasetType',
            params:{
                start:'start',
                end:'end',
            },
            interval:'interval',
            intervalObject:'intervalObject',
        },
        summarydays:{
            trend:'trend',
            velocity:'velocity',
            start_time:'start_time',
            end_time:'end_time',
            confidence:'confidence',
            start_time:'start_time',
            start_time:'start_time',

        },
        twitter:{
            symbol:'symbol',
            statuses:'statuses',
            coinName:'coinName',
            tweet:{
                tweet:'tweet',
                text:'text',
                id:'_id',
                index:'index',
                timestamp:'timestamp',
                createdAt:'created_at',
                category:'category',
            },
        },
        mailer:{
            email:'email',
            from:'from',
            to:'to',
            otp:'otp',
            subscribe:{
                key:'key',
                otp:'otp',
                createdAt:'createdAt',
                validationSuccess:true,
                validationError:false,
            },
        },
        
    },
    string:{
        subscribe:{
            optSent:(email)=>`Otp has been sent to ${email}`,
            otpEmail:(otp,url)=>`Your OTP is ${otp}. You can enter the otp or simply click on the following link to subscribe \n\n\n${url}`,
            subscribedMessage:(from,to)=>`You have just subscribed to email alerts for ${from}:${to} trend changes`,
            subscribed:(from,to)=>`You have been subscribed`,
            requestSubscriptionBody:(otp)=>`Your OTP for subscription is: ${otp}`,
            unsubscribed:`You have been unsubscribed`,
            unsubscribedMessage:(from,to)=>`You have unsubscribed email alerts for ${from}:${to}`,
            requestSubscription:`Verification for subscription`,
            
            
        },
        database:{
            insert:{
                emptyList:`Trying to insert empty list.`,
                values:(count)=>`${count} rows added`,
            },
            create:{
                table:(name)=>`${name} table has been created/initialized`,
            }
        },
        invalidRequest:'Invalid Request',
        someWrong:'Woops, something went wrong!',
        tweets:{
            updated:(count)=>`${count} tweets downloaded`,
        },
        inserted:(count)=>`${count} items added!`,
        functionLocked:`Function Locked! An instance of the function is already running.`,
        log_callback:(status,message)=>{console.log(`status:${status},message:${JSON.stringify(message)}`)},
        
    },
}

