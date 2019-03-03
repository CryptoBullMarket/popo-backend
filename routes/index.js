var express = require('express');
var router = express.Router();
const id=require('./constants').id

/* GET home page. */
router.get('/', function(req, res, next) {
  // console.log('getting from homepage')
  res.json({
    hello:req.app.get(id.application.db)===undefined,
  })
});

module.exports = router;
