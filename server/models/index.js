const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Sequelize } = require('sequelize');
const { app } = require('electron');
const { unlockFile, lockFile } = require('../middleware/FilterLocker'); // אם יש לך

const password = process.env.PASSWORD_DATA;
const algorithm = 'aes-256-cbc';

const userDataPath = app.getPath('userData');
if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });

const encryptedPath = path.join(userDataPath, 'gmach.sqlite.enc');
const tempPath = path.join(userDataPath, 'gmach_temp.sqlite');
const defaultEncrypted = path.join(process.resourcesPath, 'server', 'models', 'data', 'gmach.sqlite.enc');

let shutdownFlag = false; // למניעת הרצה כפולה

function encryptFile(inputPath, encryptedPath) {
  const key = crypto.scryptSync(password, 'salt', 32);
  const iv = crypto.randomBytes(16);

  const data = fs.readFileSync(inputPath);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const finalBuffer = Buffer.concat([iv, encrypted]);

  unlockFile(encryptedPath);
  fs.writeFileSync(encryptedPath, finalBuffer);
  lockFile(encryptedPath);
}

function decryptFile(encryptedPath, outputPath) {
  const key = crypto.scryptSync(password, 'salt', 32);

  unlockFile(encryptedPath);
  const input = fs.readFileSync(encryptedPath);
  const iv = input.slice(0, 16);
  const encrypted = input.slice(16);

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  fs.writeFileSync(outputPath, decrypted);
  lockFile(encryptedPath);
}

// בדיקה אם יש קובץ זמני ישן
if (fs.existsSync(tempPath)) {
  console.warn('🟡 נמצא קובץ זמני ישן — מצפין אותו מחדש לפני התחלת הריצה');
  encryptFile(tempPath, encryptedPath);
  fs.unlinkSync(tempPath);
}

// אם אין קובץ מוצפן עדיין, העתק מה־resources
if (!fs.existsSync(encryptedPath)) {
  fs.copyFileSync(defaultEncrypted, encryptedPath);
  console.log('✅ Database encrypted file copied from resources');
}

// פענוח הקובץ לשימוש
decryptFile(encryptedPath, tempPath);

// יצירת חיבור Sequelize על הקובץ הפענוח
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: tempPath,
  logging: console.log, // אם רוצים לוג SQL
});

// פונקציית סגירה מסודרת
async function gracefulShutdown(reason = 'electron') {
  if (shutdownFlag) return;
  shutdownFlag = true;

  console.log(`⚠️ Graceful shutdown triggered by: ${reason}`);

  try {
    await sequelize.close();
    console.log('Sequelize connection closed.');
  } catch (err) {
    console.error('Error closing Sequelize:', err);
  }

  try {
    if (fs.existsSync(tempPath)) encryptFile(tempPath, encryptedPath);

    const backupPath = path.join('D:\\', 'gmach.sqlite.enc'); // אפשר לשנות נתיב גיבוי
    if (fs.existsSync(encryptedPath)) {
      fs.copyFileSync(encryptedPath, backupPath);
      console.log(`📁 קובץ גובה אל: ${backupPath}`);
    }

    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.log('Temporary files cleaned.');
  } catch (err) {
    console.error('Error during shutdown file handling:', err);
  }
}

// Event listeners של Electron
app.on('before-quit', async (event) => {
  event.preventDefault();
  await gracefulShutdown('electron');
  app.quit();
});

app.on('window-all-closed', async () => {
  await gracefulShutdown('all-windows-closed');
  if (process.platform !== 'darwin') app.quit();
});

// Event listeners של מערכת
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('exit', () => gracefulShutdown('exit'));
process.on('uncaughtException', async (err) => {
  console.error('Uncaught exception:', err);
  await gracefulShutdown('uncaughtException');
});

module.exports = {
  sequelize,
  gracefulShutdown,
};
