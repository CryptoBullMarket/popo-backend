const db = require('../database')
const connection = require('../connection')
const presenter = require('./presenter')
const id = require('../constants').id
const values = require('../constants').values
const string = require('../constants').string
const pythoninvoker=require('../../routes/pythoninvoker')
const utils = require('../utils')
const network = require('../constants').network
const nodemailer = require('nodemailer')
const files = require('../constants').files
const LifeObject = require('../lifeline/LifeObject')
const fs = require('fs')


module.exports={
    sendOtp(user,from,to,callback){
        if(this.validateEmail(user)){
            const otp= this.generateOtp()
            const otpUrl= network.subscribeOtp(user,from,to,otp)
            const message=string.subscribe.otpEmail(otp,otpUrl)
            // console.log(message)
            this.sendMailOtp(user,from,to,otp,string.subscribe.requestSubscription,message,callback)
        }else{
            callback(values.status.error,string.someWrong)
        }
    },
    sendMailOtp(user,from,to,otp,subject,message,callback){
        var transporter = nodemailer.createTransport({
            service: values.mailer.server.name,
            auth: {
                user:  values.mailer.server.email,
                pass: values.mailer.server.password
            }
        });
        transporter.sendMail({
        from: values.mailer.server.email,
          to: user,
          subject: subject,
          text: message,
        }).then(()=>{
            db.insert(id.database.collection.otp,id.database.collection.keyList.otp,[{
                [id.database.collection.keyList.otp[0]]:this.generateKey(user,from,to),
                [id.database.collection.keyList.otp[1]]:otp,
                [id.database.collection.keyList.otp[2]]:new Date().getTime(),
                [id.database.collection.keyList.otp[3]]:false
            }],(status,message)=>{
                // console.log(`status:${status}, message:${message}`)
                return callback(values.status.ok,string.subscribe.optSent(user))   
            })
        }).catch((error)=>{
            console.log(error);
            return callback(values.status.error,string.someWrong)
        })
    },
    sendMail(user,subject,message,callback){
        var transporter = nodemailer.createTransport({
            service: values.mailer.server.name,
            auth: {
                user:  values.mailer.server.email,
                pass: values.mailer.server.password
            }
        });
        transporter.sendMail({
        from: values.mailer.server.email,
          to: user,
          subject: subject,
        //   text: message,
          html: message,
        }).then(()=>{
            if(callback!=undefined){
                callback(values.status.ok,message)    
            }
        }).catch((error)=>{
            console.log(error);
            if(callback!=undefined){
                callback(values.status.error,string.someWrong)
            }
        })
    },
    sendImageMail(user,subject,message,imageName,callback){
        if(!fs.existsSync(files.buildPathImage(imageName))){
            this.sendMail(user,subject,message,callback)
        }else{
            var transporter = nodemailer.createTransport({
                service: values.mailer.server.name,
                auth: {
                    user:  values.mailer.server.email,
                    pass: values.mailer.server.password
                }
            });
            
            transporter.sendMail({
            from: values.mailer.server.email,
              to: user,
              subject: subject,
              html: message,
              attachments: [{
                filename: imageName,
                path: files.buildPathImage(imageName),
                cid: imageName
            }]
            }).then(()=>{
                console.log('mail sent')
                if(callback!=undefined){
                    // callback(values.status.ok,message)    
                }
            }).catch((error)=>{
                console.log(error);
                if(callback!=undefined){
                    callback(values.status.error,string.someWrong)
                }
            })
        }
    },

    validateOtp(user,from,to,otp,mailerCallback){
        db.validateOtp(this.generateKey(user,from,to),otp,mailerCallback)
    },
    validateEmail(email) {
        return re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    },
    saveSubscription(email,from,to){
        db.find(`select * from ${id.database.collection.subscribed} where ${id.database.email}='${utils.base64(email)}' and ${id.database.from}='${from}' and ${id.database.to}='${to}' and ${id.database.isDeleted}='false';`,(status,data)=>{
            if(data.length==0){
                db.insert(id.database.collection.subscribed,id.database.collection.keyList.subscribed,[{
                    [id.database.collection.keyList.subscribed[0]]:utils.base64(email),
                    [id.database.collection.keyList.subscribed[1]]:from,
                    [id.database.collection.keyList.subscribed[2]]:to,
                    [id.database.collection.keyList.subscribed[3]]:new Date().getTime(),
                    [id.database.collection.keyList.subscribed[4]]:false
                }],
                (status,message)=>{
                    // console.log(`save subscription: ${status}, ${JSON.stringify(message)}`)
                })
            }
        })
    },

    generateKey(user,from,to){
        user=utils.base64(user)
        return `${user}_${from}_${to}`
    },
    generateOtp(){
        // 10+26 i.e 0-9 + a-z = 36 . random number is in float so remove starting `0.`
        return Math.random().toString(36).slice(2,8)
    },
    isSubscribed(email,from,to,callback){
        db.isSubscribed(utils.base64(email),from,to,callback)
    },
    unSubscribe(email,from,to,callback){
        db.deleteWhere(id.database.collection.subscribed,`${id.database.email}=${utils.base64(email)} and ${id.database.to} = ${to} and ${id.database.isDeleted} = false`,callback)
    },
    // get 4day summary
    mailSummary(interval,callback) {
        db.find(`select ${id.database.email}, ${id.database.from}, ${id.database.to} from ${id.database.collection.subscribed} where ${id.database.isDeleted}='false';`,(status,data)=>{
            callback(values.status.ok,`summary mail service started! subscriber: ${JSON.stringify(data)}`)
            for(var i in data){
                const email=data[i][id.database.email]
                const from=data[i][id.database.from]
                const to=data[i][id.database.to]
                const type='1h'

                const params=[email,from,to,type]    
                LIFELINE_MAILER.push(new LifeObject(id.lifeline.mailer.alert.trendChange(from,to,type),params,(params)=>{
                    var i=0
                    const email = params[i++]
                    const from = params[i++]
                    const to = params[i++]
                    const interval = params[i++]
                    db.find(`select * from ${id.database.collection.trend} where _key='${id.database.collection.history_from_to_type(from,to,interval)}' order by ${id.summarydays.start_time} asc;`,(status,data)=>{
                        this.sendImageMail(utils.base64Decode(email),`${from}:${to} Summary`,presenter.getSummaryMessage(from,to,data),`${id.database.collection.history_from_to_type(from,to,interval)}.png`,(status,message)=>{
                            string.log_callback(status,message)
                        })
                    })
                }))
            }
            LIFELINE_MAILER.invalidate(true)            
        })
    },
    // get trend change alert
    mailTrendChangeSpecific(from,to,interval,trendData,prevTrend,callback) {
        db.find(`select ${id.database.email}, ${id.database.from}, ${id.database.to} from ${id.database.collection.subscribed} where ${id.database.from}='${from}' and ${id.database.to}='${to}' and ${id.database.isDeleted}='false';`,(status,data)=>{
            callback(values.status.ok,`trend change mail service started! subscriber: ${JSON.stringify(data)}`)
            for(var i in data){
                const email=data[i][id.database.email]
                const from=data[i][id.database.from]
                const to=data[i][id.database.to]
                const type='1h'
                
                const params=[email,from,to,type,trendData,prevTrend]
                console.log(`mail trend change: ${JSON.stringify(params)}`)
                LIFELINE_MAILER.push(new LifeObject(id.lifeline.mailer.alert.trendChange(from,to,type),params,(params)=>{
                    var i=0
                    const email = params[i++]
                    const from = params[i++]
                    const to = params[i++]
                    const interval = params[i++]
                    const trendData = params[i++]
                    const prevTrend = params[i++]
                    this.sendImageMail(utils.base64Decode(email),`${from}:${to} Trend Change Alert`,presenter.getTrendChangeMessage(from,to,interval,trendData,prevTrend),`${id.database.collection.history_from_to_type(from,to,interval)}.png`,(status,message)=>{
                        console.log(`status: ${status}, message: ${message}`)
                    })
                }))
            }
            LIFELINE_MAILER.invalidate(true)
        })
    },
    // get big volume alert
    mailBigVolumeSpecific(from,to,interval,currentPrice,prevPrice,callback) {
        db.find(`select ${id.database.email}, ${id.database.from}, ${id.database.to} from ${id.database.collection.subscribed} where ${id.database.from}='${from}' and ${id.database.to}='${to}' and ${id.database.isDeleted}='false';`,(status,data)=>{
            callback(values.status.ok,`big volume mail service started! subscriber: ${JSON.stringify(data)}`)
            for(var i in data){
                const email=data[i][id.database.email]
                const from=data[i][id.database.from]
                const to=data[i][id.database.to]
                const type='1h'
                
                const params=[email,from,to,type,currentPrice,prevPrice]
                console.log(`mail big volume: ${JSON.stringify(params)}`)
                LIFELINE_MAILER.push(new LifeObject(id.lifeline.mailer.alert.trendChange(from,to,type),params,(params)=>{
                    var i=0
                    const email = params[i++]
                    const from = params[i++]
                    const to = params[i++]
                    const interval = params[i++]
                    const currentPrice = params[i++]
                    const prevPrice = params[i++]
                    this.sendImageMail(utils.base64Decode(email),`${from}:${to} Big Volume Alert`,presenter.getBigVolumeMessage(from,to,interval,currentPrice,prevPrice),`${id.database.collection.history_from_to_type(from,to,interval)}.png`,(status,message)=>{
                        console.log(`status: ${status}, message: ${message}`)
                    })
                }))
            }
            LIFELINE_MAILER.invalidate(true)
        })
    },
    mailBigPriceMove(from,to,interval,currentPrice,prevPrice,callback){
        db.find(`select ${id.database.email}, ${id.database.from}, ${id.database.to} from ${id.database.collection.subscribed} where ${id.database.from}='${from}' and ${id.database.to}='${to}' and ${id.database.isDeleted}='false';`,(status,data)=>{
            callback(values.status.ok,`big price move mail service started! subscriber: ${JSON.stringify(data)}`)
            for(var i in data){
                const email=data[i][id.database.email]
                const from=data[i][id.database.from]
                const to=data[i][id.database.to]
                const type='1h'
                
                const params=[email,from,to,type,currentPrice,prevPrice]
                console.log(`mail big price move: ${JSON.stringify(params)}`)
                LIFELINE_MAILER.push(new LifeObject(id.lifeline.mailer.alert.trendChange(from,to,type),params,(params)=>{
                    var i=0
                    const email = params[i++]
                    const from = params[i++]
                    const to = params[i++]
                    const interval = params[i++]
                    const currentPrice = params[i++]
                    const prevPrice = params[i++]
                    this.sendImageMail(utils.base64Decode(email),`${from}:${to} Big Price Move Alert`,presenter.getBigPriceMoveMessage(from,to,interval,currentPrice,prevPrice),`${id.database.collection.history_from_to_type(from,to,interval)}.png`,(status,message)=>{
                        console.log(`status: ${status}, message: ${message}`)
                    })
                }))
            }
            LIFELINE_MAILER.invalidate(true)
        })
    },
}