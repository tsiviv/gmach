const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

function loadEncryptedEnv(callback) {
    const password = "852ty582";

    if (!password) {
        console.error("❌ לא הוזנה סיסמה");
        process.exit(1);
    }

    try {
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

        if (callback) callback();

    } catch (err) {
        console.error('❌ שגיאה בטעינת קובץ הסביבה:', err);
        process.exit(1);
    }
}

module.exports = loadEncryptedEnv;
