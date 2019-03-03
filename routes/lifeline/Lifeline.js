const id = require('../constants').id
const values = require('../constants').values
const string = require('../constants').string

/**
 * 
 * @param {*} interval specify the max duration till which the items must perform action
 * @param {*} fastLane specify if the items perform action as soon as the other has finished performing
 */
function Lineline(interval,fastLane=false){
    this.fastLane=fastLane
    this.interval=values.binance.candle_interval_milliseconds[interval==undefined?'_1h':interval]
    this.position=0
    this.line=[]
    this.MINIMUM_DELAY=values.binance.candle_interval_milliseconds['_5m']


    /** add item to end of queue */
    this.push=(object)=>{
        this.line.push(object)
    }
    /** add list to end of queue */
    this.pushAll=(list)=>{
        this.line=this.line.concat(list)
    }
    /** add item to start of queue and remove same item from queue if present */
    this.pushf=(object)=>{
        for(var i=this.position;i<this.line.length;i++){
            if(this.line[i].id==object.id){
                this.line.splice(i, 1)
                break
            }
        }
        /** add item to position */
        this.line.splice( this.position+1, 0, object );
        this.invalidate()
    }
    this.invalidate=(isInitial)=>{
        if(this.line.length==0){
            return
        } 
        const _d=this.interval/Math.max(1,(this.line.length-this.position))
        const delay=Math.max(this.MINIMUM_DELAY,_d) /** minimum of 1 minute and max of 1 hr */

        /** _d(delay) < MIN Delay :: if there are more actions to be performed then perfor most of them asap*/
        
        if(isInitial || this.fastLane || _d<this.MINIMUM_DELAY){
            var offset=0
            console.log(`invalidate delay: ${delay/1000/60} mins`)
            for(var i=this.position;i<this.line.length;i++){
                clearTimeout(this.line[i].timer) 
                this.line[i].timer=setTimeout(()=>{
                    console.log(`invalidate : ${this.line[this.position].id} -> #${this.position} of ${this.line.length-1}`)
                    this.line[this.position].functionCallback(this.line[this.position].params)
                    delete this.line[this.position] /** delete item without changing array position */
                    this.position++
                }, offset)
                offset+=delay
            }
        }
    }
}

module.exports=Lineline