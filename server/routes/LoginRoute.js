const express = require('express');
const router = express.Router();
const Login = require('../controllers/Login');

router.post('/', Login.Login);

module.exports = router;
// // 