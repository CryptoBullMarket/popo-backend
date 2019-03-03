module.exports={
    base64(value){
        return new Buffer(value+"").toString('base64')
    },
    base64Decode(value){
        return new Buffer.from(value, 'base64').toString('ascii')
    },
    numberSalutation:(d)=>{
        if(d>3 && d<21) return 'th';
        switch (d % 10) {
              case 1:  return "st";
              case 2:  return "nd";
              case 3:  return "rd";
              default: return "th";
          }
    },
    DateUtils:{
        monthName:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        mmhh:(date)=>{
            return `${date.getHours()>12?date.getHours()-12:date.getHours()==0?12:date.getHours()}:${date.getMinutes()==0?'00':date.getMinutes()} ${date.getHours()-12>=0?'pm':'am'}`
        },
        ddMMM:(date)=>{
            return `${date.getDate()}${require('./utils').numberSalutation(date.getDate())} ${require('./utils').DateUtils.monthName[date.getMonth()]}`
        },
        mmhh_ddMMM:(date)=>{
            date=new Date(date)
            return `${require('./utils').DateUtils.mmhh(date)}, ${require('./utils').DateUtils.ddMMM(date)}`
        },
        mmhh_ddMMM_range:(start,end)=>{
            s=new Date(parseInt(start))
            e=new Date(parseInt(end))
            if(s.getDate()==e.getDate()){
                return `${require('./utils').DateUtils.mmhh(s)} - ${require('./utils').DateUtils.mmhh(e)}, ${require('./utils').DateUtils.ddMMM(s)}`
            }else{
                return `${require('./utils').DateUtils.mmhh_ddMMM(s)} - ${require('./utils').DateUtils.mmhh_ddMMM(e)}`
            }
        }
    },
}