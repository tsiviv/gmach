const express = require('express');
const router = express.Router();
const settings = require('../middleware/globalSettings');

// POST: עדכון מצב ההתראות
router.post('/set-notifications', (req, res) => {
  const { enabled } = req.body;
  settings.set(enabled);
  res.json({ success: true });
});

// GET: קבלת מצב ההתראות הנוכחי
router.get('/get-notifications', (req, res) => {
  res.json({ enabled: settings.get() });
});

module.exports = router;
