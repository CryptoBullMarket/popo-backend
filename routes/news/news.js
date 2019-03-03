var express = require('express');
var router = express.Router();
const presenter = require('./presenter')

/* GET news. */
router.get('/', function(req, res, next) {
    // console.log('getting news')
    presenter.getNews(req.query.i,req.query.c,req.query.p, (status,data)=>
    res.json({
        status:status,
        message: data
      })
    )
  });



module.exports=router