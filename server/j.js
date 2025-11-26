const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Path לקובץ הסיסמאות
const jsonPath = path.join(__dirname, 'env.json');

// קרא את ה-JSON
const jsonData = fs.readFileSync(jsonPath, 'utf8');

// סיסמת ההצפנה
const password = process.env.NODE_ENV_PASS;
if (!password) {
    console.error("❌ לא הוזנה סיסמה (NODE_ENV_PASS)");
    process.exit(1);
}

// יצירת IV ומפתח
const iv = crypto.randomBytes(16);
const key = crypto.scryptSync(password, 'salt', 32);

// הצפנה
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
const encrypted = Buffer.concat([cipher.update(jsonData), cipher.final()]);

// כתיבה לקובץ env.enc
fs.writeFileSync(path.join(__dirname, 'env.enc'), Buffer.concat([iv, encrypted]));

console.log('✔️ env.json הוצפן בהצלחה → env.enc');
