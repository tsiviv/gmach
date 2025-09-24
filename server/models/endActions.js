const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');
const {sequelize} = require('./index');
const { lockFile, unlockFile } = require('../middleware/FilterLocker'); // אם יש לך

// תיקיית userData של Electron
const userDataPath = app.getPath('userData');
if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });

// נתיבים חיצוניים ל־.asar
const tempPath = path.join(userDataPath, 'gmach_temp.sqlite');
const encryptedPath = path.join(userDataPath, 'gmach.sqlite.enc');

// מקור הקובץ המקורי בתוך resources (אם צריך)
const defaultEncrypted = path.join(process.resourcesPath, 'server', 'models', 'data', 'gmach.sqlite.enc');

// אם אין קובץ מוצפן עדיין, העתק מה־resources
if (!fs.existsSync(encryptedPath)) {
    fs.copyFileSync(defaultEncrypted, encryptedPath);
    console.log('✅ Database encrypted file copied from resources');
}

function encryptFile(inputPath, encryptedPath) {
    const key = crypto.scryptSync(process.env.PASSWORD_DATA, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const data = fs.readFileSync(inputPath);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

    const finalBuffer = Buffer.concat([iv, encrypted]);

    unlockFile(encryptedPath);
    fs.writeFileSync(encryptedPath, finalBuffer);
    lockFile(encryptedPath);
}

function deleteTempFile() {
    if (fs.existsSync(tempPath)) {
        try {
            fs.unlinkSync(tempPath);
            console.log('🔴 קובץ זמני נמחק.');
        } catch (err) {
            console.error('שגיאה במחיקת קובץ זמני:', err.message);
        }
    }
}

const backupDir = 'D:';
const backupPath = path.join(backupDir, 'gmach.sqlite.enc');

async function gracefulShutdown() {
    try {
        await sequelize.close();
        console.log('Sequelize connection closed.');
    } catch (err) {
        console.error('Error closing Sequelize:', err);
    } finally {
        try {
            encryptFile(tempPath, encryptedPath);

            if (fs.existsSync(encryptedPath) && fs.existsSync(backupDir)) {
                fs.copyFileSync(encryptedPath, backupPath);
                console.log(`📁 קובץ גובה אל: ${backupPath}`);
            }

            deleteTempFile();
        } catch (e) {
            console.error('Error during shutdown:', e);
        }
        process.exit();
    }
}

module.exports = gracefulShutdown;
