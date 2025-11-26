const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Sequelize } = require('sequelize');
const { app } = require('electron');
const { unlockFile, lockFile } = require('../middleware/FilterLocker');
const os = require('os');

const password = process.env.PASSWORD_DATA;
const algorithm = 'aes-256-cbc';

// מקובץ מוצפן מקור בתיקיית resources
const encryptedSource = path.join(process.resourcesPath, 'server', 'models', 'data', 'gmach.sqlite.enc');

// קבצים ב-userData שניתן לכתוב בהם
const userDataPath = app.getPath('userData');
if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });

const encryptedPath = path.join(userDataPath, 'gmach.sqlite.enc');
const tempPath = path.join(userDataPath, 'gmach_temp.sqlite');

let shutdownFlag = false;

function encryptFile(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) return;

  const key = crypto.scryptSync(password, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const data = fs.readFileSync(inputPath);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const finalBuffer = Buffer.concat([iv, encrypted]);

  unlockFile(outputPath);
  fs.writeFileSync(outputPath, finalBuffer);
  lockFile(outputPath);
}

function decryptFile(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) throw new Error(`Encrypted file not found: ${inputPath}`);

  const key = crypto.scryptSync(password, 'salt', 32);
  unlockFile(inputPath);
  const input = fs.readFileSync(inputPath);
  const iv = input.slice(0, 16);
  const encrypted = input.slice(16);

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  fs.writeFileSync(outputPath, decrypted);
  lockFile(inputPath);
}

// --- התחלת הריצה ---

// אם אין קובץ מוצפן עדיין ב-userData, העתק מה־resources
if (!fs.existsSync(encryptedPath)) {
  fs.copyFileSync(encryptedSource, encryptedPath);
  console.log('✅ Database encrypted file copied from resources');
}

// מחיקה של temp ישן
if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

// פענוח הקובץ לשימוש
decryptFile(encryptedPath, tempPath);

// חיבור Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: tempPath,
  logging: console.log,
});

// --- פונקציית סגירה מסודרת ---
async function gracefulShutdown(reason = 'electron') {
  if (shutdownFlag) return;
  shutdownFlag = true;

  console.log(`⚠️ Graceful shutdown triggered by: ${reason}`);

  try {
    await sequelize.close();
    console.log('✅ Sequelize connection closed.');
  } catch (err) {
    console.error('❌ Error closing Sequelize:', err);
  }

  try {
    // הצפנה מחדש של temp ל-encryptedPath
    if (fs.existsSync(tempPath)) encryptFile(tempPath, encryptedPath);

    const homeDir = os.homedir(); 
    const backupPath = path.join(homeDir, process.env.BACKUP_DIR, 'gmach.sqlite.enc');
    if (fs.existsSync(encryptedPath)) {
      fs.copyFileSync(encryptedPath, backupPath);
      console.log(`📁 Backup saved to: ${backupPath}`);
    }

    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.log('Temporary files cleaned.');
  } catch (err) {
    console.error('❌ Error during shutdown file handling:', err);
  }
}

module.exports = {
  sequelize,
  gracefulShutdown,
};
