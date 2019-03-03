const db = require('../database')
const connection = require('../connection')
const presenter = require('./presenter')
const id = require('../constants').id
const values = require('../constants').values
const string = require('../constants').string
const pythoninvoker=require('../../routes/pythoninvoker')
const mailer=require('../../routes/mailer/mailer')
const LifeObject=require('../lifeline/LifeObject')

module.exports={
    get24HrTicker(from,to,callback){
        connection.get24HrTicker(from,to,(status,data)=>{
            callback(status,data)
        })
    },
    puscs(){
        console.log('puscs function called')
        db.find(`select * from ${id.database.collection.pairList} where ${id.database.historyType}='1h';`,(status,list)=>{
            if(status==values.status.ok){
                console.log(`puscs length:${list.length}`)
                for(var i in list){
                    const params=[list[i][id.database.from],list[i][id.database.to],list[i][id.database.historyType]]
                    LIFELINE_CS.push(new LifeObject(id.lifeline.ucs(list[i][id.database.from],list[i][id.database.to],list[i][id.database.historyType]),params,(params)=>{
                        console.log('function callback')
                        var i=0
                        const from=params[i++]
                        const to=params[i++]
                        const interval=params[i++]
                        require('./service').uscs(from,to,interval)
                    }))
                }
                console.log('puscs invalidate')
                LIFELINE_CS.invalidate(true)
            }else{
                console.log('puscs error getting pairlist data')
            }
        })
    },
    uscs(from,to,interval){
        console.log('uscs service')
        db.find(`select * from ${id.database.collection.history_from_to_type(from,to,interval)} order by cast(${id.binance.id} as bigint) desc limit 1`,(status,data)=>{
            if(status==values.status.ok){
                if(data.length>0 ){
                    if(new Date().getTime()-parseInt(data[data.length-1][id.binance.id])>values.binance.candle_interval_milliseconds[`_${interval}`]){
                        require('./presenter').ucs(from,to,interval,parseInt(data[data.length-1][id.binance.id])+1,new Date().getTime(),(status,message)=>{
                            console.log(`uscs ${from}_${to}_${interval} -> status:${status}, message:${message}`)
                        })
                    }else{
                        console.log(`${from}_${to} upto date`)
                        LIFELINE_CS.invalidate()
                    }
                }else{
                    console.log('data does not exist,, download data')
                    require('./presenter').ucs(from,to,interval,new Date().getTime()-500*values.binance.candle_interval_milliseconds[`_${interval}`],new Date().getTime(),(status,message)=>{
                        console.log(`uscs ${from}_${to}_${interval} -> status:${status}, message:${message}`)
                        LIFELINE_CS.invalidate()
                    })
                }
            }else{
                console.log(`uscs else: ${data}`)
                LIFELINE_CS.invalidate()
            }
        })
    },
    velvo(from,to,interval){
        console.log(`velvo ${from}_${to}`)
        pythoninvoker.velvo(id.database.collection.history_from_to_type(from,to,interval),(status,data)=>{
            string.log_callback(status,data)
            if(status==values.status.ok){
                if(data[id.pythonInvoker.isAlert]>0){
                    /** perform alert mail service for trend change  */
                    db.find(`select * from ${id.database.collection.trend} where _key='${id.database.collection.history_from_to_type(from,to,interval)}' order by cast(${id.database.id} as bigint) asc`,(status,trendData)=>{
                        if(status==values.status.ok){
                            LIFELINE_CS.invalidate()
                            console.log('velvo mailer')
                            string.log_callback(status,data)
                            require('../mailer/mailer').trendChangeAlert(from,to,interval,trendData,data[id.pythonInvoker.previousTrend],(status,message)=>{
                                string.log_callback(status,message)
                            })
                        }else{
                            LIFELINE_CS.invalidate()
                            string.log_callback(`velvo inner trendData value.status!=ok => ${status}`,trendData)
                        }
                    })
                }else{
                    LIFELINE_CS.invalidate()
                    string.log_callback(`velvo data[alert]>0] => ${status}`,data)
                }
            }else{
                LIFELINE_CS.invalidate()
                string.log_callback(`velvo outer value.status!=ok => ${status}`,data)
            }
        })
    },
    utl(from,to,interval){
        pythoninvoker.utl(id.database.collection.history_from_to_type(from,to,interval),(status,data)=>{
            string.log_callback(status,data)
            if(status==values.status.ok){
                string.log_callback(status,data)
                LIFELINE_DAILY.invalidate()
            }else{
                LIFELINE_DAILY.invalidate()
                string.log_callback(`trend levels outer value.status!=ok => ${status}`,data)
            }
        })
    },
    putl(from,to,interval){
        console.log('utl function called')
        db.find(`select * from ${id.database.collection.pairList} where ${id.database.historyType}='1h';`,(status,list)=>{
            if(status==values.status.ok){
                console.log(`utl length:${list.length}`)
                for(var i in list){
                    const params=[list[i][id.database.from],list[i][id.database.to],list[i][id.database.historyType]]
                    LIFELINE_DAILY.push(new LifeObject(id.lifeline.utl(list[i][id.database.from],list[i][id.database.to],list[i][id.database.historyType]),params,(params)=>{
                        console.log('function callback')
                        var i=0
                        const from=params[i++]
                        const to=params[i++]
                        const interval=params[i++]
                        require('./service').utl(from,to,interval)
                    }))
                }
                console.log('utl invalidate')
                LIFELINE_DAILY.invalidate(true)
            }else{
                console.log('utl error getting pairlist data')
            }
        })
    },
    forecast(){
        const params=[]
        LIFELINE_DAILY.push(new LifeObject(id.lifeline.forecast(),params,(params)=>{
            require('../../routes/pythoninvoker').forecast()
        }))
        LIFELINE_DAILY.invalidate(true)
    },
}