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
        // 🔥 חשוב: ב-production הקובץ נמצא מחוץ ל-ASAR
        const envPath =
            process.env.NODE_ENV === "development"
                ? path.join(__dirname, "env.enc")  // בפיתוח
                : path.join(process.resourcesPath, "env.enc"); // לאחר אריזה

        if (!fs.existsSync(envPath)) {
            throw new Error("קובץ env.enc לא נמצא בנתיב: " + envPath);
        }

        const fileBuffer = fs.readFileSync(envPath);
        if (fileBuffer.length < 17) {
            throw new Error("קובץ env.enc פגום או ריק");
        }

        const iv = fileBuffer.slice(0, 16);
        const encrypted = fileBuffer.slice(16);

        const key = crypto.scryptSync(password, 'salt', 32);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

        const config = JSON.parse(decrypted.toString());
        for (let keyName in config) {
            process.env[keyName] = config[keyName];
        }

        console.log('✔️ הסביבה נטענה בהצלחה מהקובץ המוצפן:', envPath);

        if (callback) callback();

    } catch (err) {
        console.error('❌ שגיאה בטעינת קובץ הסביבה:', err);
        process.exit(1);
    }
}

module.exports = loadEncryptedEnv;
