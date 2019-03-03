const id = require('../constants').id
const string = require('../constants').string
const values = require('../constants').values
const connection = require('../connection')
const db = require('../database')
const service = require('./service')

module.exports={
    getFilterTrend(filterType,startTime,callback){
        db.find(`select * from ${id.database.collection.trend} where _id in (select max(_id) from ${id.database.collection.trend} group by _key having _key like '%_1h') and trend=${filterType} and cast(end_time as bigint)>=${startTime} order by start_time;`,(status,data)=>{
            if(status==values.status.ok){
                return callback(status,data)
            }
            return callback(values.status.error,string.someWrong)
        })
    },
    getSpecificTrend(key,startTime,callback){
        db.find(`select * from ${id.database.collection.trend} where _key='${key}' and cast(end_time as bigint)>=${startTime} order by start_time;`,(status,data)=>{
            if(status==values.status.ok){
                return callback(status,data)
            }
            return callback(values.status.error,string.someWrong)
        })
    },
    getSpecificVolatility(key,startTime,callback){
        db.find(`select * from ${id.database.collection.volatility} where _key='${key}' and cast(end_time as bigint)>=${startTime} order by start_time;`,(status,data)=>{
            if(status==values.status.ok){
                return callback(status,data)
            }
            // console.log(data)
            return callback(values.status.error,string.someWrong)
        })
    },
    getSummary(key,startTime,callback){
        db.find(`select * from ${id.database.collection.trend} where _key='${key}' and cast(end_time as bigint)>=${startTime} order by start_time;`,(status,trend)=>{
            if(status==values.status.ok){
                db.find(`select * from ${id.database.collection.volatility} where _key='${key}' and cast(end_time as bigint)>=${startTime} order by start_time;`,(status,vola)=>{
                    if(status==values.status.ok){
                        return callback(status,{trend:trend,volatility:vola})
                    }else{
                        return callback(values.status.error,string.someWrong)
                    }
                })
            }else{
                return callback(values.status.error,string.someWrong)
            }
        })
    },
    ucs(from,to,interval,fromTime,toTime,callback){
        console.log('ucs')
        connection.getCandleStick(from,to,interval,fromTime,toTime,(status,data)=>{
            var list=[]
            data.map(row=>{
                var ob={}
                var i=0
                for(var i in id.database.collection.keyList.history){
                    ob[id.database.collection.keyList.history[i]]=parseFloat(row[i])
                }
                list.push(ob)
            })
            if(list.length>0){
                console.log('inserting into the database')
                db.insert(id.database.collection.history_from_to_type(from,to,interval),id.database.collection.keyList.history,list,(status,message)=>{
                    if(status==values.status.ok){
                        /** run velvo for the pair */
                        require('./service').velvo(from,to,interval)
                        return callback(status,message)
                    }else{
                        LIFELINE_CS.invalidate()
                        return callback(values.status.error,message)
                    }
                })
            }else{
                console.log(`ucs list.length>0 : false`)
                LIFELINE_CS.invalidate()
                return callback(values.status.error,[])
            }
        })
    },
    gcs(from,to,interval,startTime,endTime,isNew,callback){
        db.createCandleStickTable(id.database.cc.history_from_to_type(from,to,interval),(status,message)=>{
            if(status==values.status.ok){
                db.find(`select * from ${id.database.collection.history_from_to_type(from,to,interval)} where cast(${id.database.id} as bigint)>=${startTime} and cast(${id.database.id} as bigint)<=${endTime} order by cast(${id.database.id} as bigint) asc`,(status,data)=>{
                    if(status==values.status.ok && data.length>0){
                        require('./presenter').ppl(from,to,interval)
                        if(isNew){
                            console.log('is new')
                            if(new Date().getTime()-parseInt(data[data.length-1][id.binance.id])>values.binance.candle_interval_milliseconds[`_${interval}`]){
                                require('./presenter').ucs(from,to,interval,parseInt(data[data.length-1][id.binance.id]),new Date().getTime(),(status,message)=>{
                                    if(status==values.status.ok){
                                        console.log('ucs data')
                                        db.find(`select * from ${id.database.collection.history_from_to_type(from,to,interval)} where cast(${id.database.id} as bigint)>=${startTime} and cast(${id.database.id} as bigint)<=${endTime} order by cast(${id.database.id} as bigint) asc`,(status,data)=>{
                                            if(status==values.status.ok){
                                                /** check if should alert */
                                                require('./presenter').processAlert(from,to,interval,data)
                                            }
                                            return callback(status,data)
                                        })
                                    }else{
                                        return callback(status,data)
                                    }
                                }) 
                            }else{
                                console.log(`${from}_${to}_${interval} already upto date`)
                                return callback(status,data)
                            }
                        }else{
                            return callback(status,data)
                        }
                    }else{
                        if(status==values.status.ok){
                        /** has no data and need to download */
                            require('./presenter').ppl(from,to,interval)
                            require('./presenter').ucs(from,to,interval,startTime,endTime,callback)
                        }else{
                            return callback(values.status.error,[])
                        }
                    }
                })
            }
        })
    },
    /** populate pairlist */
    ppl(from,to,interval){
        db.find(`select * from ${id.database.collection.pairList} where ${id.database.from}='${from}' and ${id.database.to}='${to}' and ${id.database.historyType}='${interval}' limit 1`,(status,data)=>{
            if(status==values.status.ok && data.length==0){
                const list=[]
                list.push({
                    [id.database.collection.keyList.pairList[0]]:from,
                    [id.database.collection.keyList.pairList[1]]:to,
                    [id.database.collection.keyList.pairList[2]]:interval,
                })
                db.insert(id.database.collection.pairList,id.database.collection.keyList.pairList,list,(status,message)=>{
                    console.log(`ppl -> status:${status}, message:${message}, data:${JSON.stringify(list)}`)
                })
            }
        })
    },
    processAlert(from,to,interval,data){
        /** if current volume has increased by more than 30% from the previous volume */
        const prevVol=data[data.length-2][id.binance.volume]
        const currVol=data[data.length-1][id.binance.volume]
        if(Math.abs(currVol-prevVol)/prevVol>0.3){
            require('../mailer/mailer').bigVolumeAlert(from,to,interval,data[data.length-1],data[data.length-2],(status,message)=>{
                string.log_callback(status,message)
            })
        }
        /** if % change between current high and previous low is greater than 5% */
        const prevLow=data[data.length-1][id.binance.low]
        const currHigh=data[data.length-1][id.binance.high]
        if((Math.abs(prevLow-currHigh)/prevLow)>0.05){
            require('../mailer/mailer').bigPriceMove(from,to,interval,data[data.length-1],data[data.length-2],(status,message)=>{
                string.log_callback(status,message)
            })
        }
        return false
    },
    getFeedList(interval,callback){
        db.find(`select _from as from , _to as to, history_type as historyType from ${id.database.collection.pairList} where ${id.database.historyType}='${interval}' order by _from;`,(status,data)=>{
            if(status==values.status.ok){
                callback(status,data)
            }else{
                string.log_callback(status,data)
                callback(status,[])
            }
        })
    },

    // create populate pair list
    cppl(from,to,interval){
        db.createCandleStickTable(id.database.cc.history_from_to_type(from,to,interval),(status,message)=>{
            if(status==values.status.ok){
                this.ppl(from,to,interval)
            }
        })
    },
    getTrendLevels(key,callback){
        db.find(`select * from ${id.database.collection.trendLevels} where _key='${key}';`,(status,data)=>{
            if(status==values.status.ok){
                callback(status,data)
            }else{
                console.log('getTrendLevel')
                string.log_callback(status,data)
                callback(status,[])
            }
        })
    },
    getStopPercentageLevel(callback){
        db.find(`select * from ${id.database.collection.stopLossLevel} inner join (select * from ${id.database.collection.trend} where _id in (select max(_id) from ${id.database.collection.trend} group by _key having _key like '%_1h')) as t on t._key=${id.database.collection.stopLossLevel}._key ;`,(status,data)=>{
            if(status==values.status.ok){
                callback(status,data)
            }else{
                console.log('getStopPercentageLevel')
                string.log_callback(status,data)
                callback(status,[])
            }
        })
    },
}