const express = require('express');
const router = express.Router();
const Login = require('../controllers/Login');

// POST: עדכון מצב ההתראות
router.post('/set-notifications', Login.toggleNotifications);

// GET: קבלת מצב ההתראות הנוכחי

router.get('/get-notifications', Login.getSettings);

module.exports = router;
