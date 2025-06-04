const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sequelize = require('./index');
const { lockFile, unlockFile } = require('../middleware/FilterLocker'); // חדש

const tempPath = path.join(__dirname, 'data', 'gmach_temp.sqlite');
const encryptedPath = path.join(__dirname, 'data', 'gmach.sqlite.enc');

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
const backupDir = 'E:\\backup';
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
            
            // ⬇️ גיבוי לתיקייה החיצונית
            if (fs.existsSync(encryptedPath)) {
                // ודא שהתיקייה קיימת
                if (!fs.existsSync(backupDir)) {
                    fs.mkdirSync(backupDir, { recursive: true });
                }
                fs.copyFileSync(encryptedPath, backupPath);
                console.log(`📁 קובץ גובה אל: ${backupPath}`);
            }

            deleteTempFile();
        } catch (e) {
            console.log('Error during shutdown:', e);
        }
        process.exit();
    }
}


module.exports = gracefulShutdown;
