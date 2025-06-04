const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
function loadEncryptedEnv(callback) {
    const password = process.env.NODE_ENV_PASS;
    if (!password) {
        console.error("❌ לא הוזנה סיסמה (NODE_ENV_PASS)");
        process.exit(1);
    }

    const fileBuffer = fs.readFileSync(path.join(__dirname, 'env.enc'));
    const iv = fileBuffer.slice(0, 16);
    const encrypted = fileBuffer.slice(16);

    const key = crypto.scryptSync(password, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    const config = JSON.parse(decrypted.toString());
    for (let key in config) {
        process.env[key] = config[key];
    }

    console.log('✔️ הסביבה נטענה בהצלחה מהקובץ המוצפן');

    if (callback) callback(); // <<< כאן הפתרון!
}


module.exports = loadEncryptedEnv;
