var express = require('express');
var router = express.Router();
const route_v1 = require('./V1/user.routes')

router.use('/v1', route_v1)

module.exports = router;
