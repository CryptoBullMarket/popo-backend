function LifeObject(_id,_params,_functionCallback){
    this.id=_id /** uniquely identify object */
    this.params=_params
    this.functionCallback=_functionCallback /** the function to run after timer */
    // this.lifelineCallback=_lifelineCallback
    this.timer=null /** pointer to current timer. used to reevaluate timer */
}
module.exports=LifeObject