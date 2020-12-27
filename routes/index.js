const express = require('express');
const router = express.Router();
const verify = require('../Middleware/verifyToken')

/* GET home page. */
router.get('/', verify, (req, res, next) => {
  res.render('index', { title: 'Express' });
});

module.exports = router;
