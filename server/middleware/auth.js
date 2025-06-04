const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const verifyToken = (req, res, next) => {
    // שלוף טוקן מה-Authorization header או מ-query string
    let token = null;
    const publicKey = process.env.PUBLIC_KEY.replace(/\\n/g, '\n'); // תקן את המפתח

    // נסה קודם מה-Authorization Header
    if (req.headers['authorization']) {
        const parts = req.headers['authorization'].split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            token = parts[1];
        }
    }

    // אם אין header, נסה מה-query string
    if (!token && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, publicKey, (err, decoded) => {
        if (err) {
            console.log(err)
            return res.status(403).json({ message: 'Invalid token' });
        }

        // אפשר להוסיף את decoded למשתמש אם תרצה
        req.user = decoded;

        next();
    });
};
const DAILY_LIMIT = 200;

// משתנים גלובליים במודול


const filePath = path.join(__dirname, 'settings.json');

function readSettings() {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
  
      // ודא ש-requestCount ו-resetTime קיימים
      if (typeof parsed.requestCount !== 'number') parsed.requestCount = 0;
      if (typeof parsed.resetTime !== 'number') {
        parsed.resetTime = Date.now() + 24 * 60 * 60 * 1000;
      }
  
      return parsed;
    } catch (err) {
      // אם יש שגיאה, צור קובץ עם ערכים התחלתיים (ושמירת wantsNotifications כ-true כברירת מחדל)
      const defaultSettings = {
        wantsNotifications: true,
        requestCount: 0,
        resetTime: Date.now() + 24 * 60 * 60 * 1000
      };
      writeSettings(defaultSettings);
      return defaultSettings;
    }
  }
  
  function writeRateLimitSettings({ requestCount, resetTime }) {
    const current = readSettings();
    const updated = {
      ...current,
      requestCount,
      resetTime
    };
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
  }

const limitMiddleware = (req, res, next) => {
  const settings = readSettings();
  const now = Date.now();

  if (now > settings.resetTime) {
    settings.requestCount = 0;
    settings.resetTime = now + 24 * 60 * 60 * 1000;
  }

  if (settings.requestCount >= DAILY_LIMIT) {
    return res.status(429).json({ message: 'חרגת ממספר הבקשות ליום. נסה שוב מחר.' });
  }

  settings.requestCount++;
  writeRateLimitSettings({
    requestCount: settings.requestCount,
    resetTime: settings.resetTime
  });

  next();
};

module.exports = {
    get: () => readSettings().wantsNotifications,
    set: (value) => {
      const current = readSettings();
      current.wantsNotifications = value;
      writeSettings(current);
    },
    limitMiddleware,
    verifyToken // ← זה מה שהיה חסר
  };
  