const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Sequelize } = require('sequelize');
const { unlockFile, lockFile } = require('../middleware/FilterLocker'); // חדש

const password = process.env.PASSWORD_DATA;
const algorithm = 'aes-256-cbc';

const encryptedPath = path.join(__dirname, 'data', 'gmach.sqlite.enc');
const tempPath = path.join(__dirname, 'data', 'gmach_temp.sqlite');
let flag = false
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

if (fs.existsSync(tempPath)) {
  flag = true
  console.warn('🟡 נמצא קובץ זמני ישן — מצפין אותו מחדש לפני התחלת הריצה');
  encryptFile(tempPath, encryptedPath);
  fs.unlinkSync(tempPath);
}

decryptFile(encryptedPath, tempPath);

const backupDir = 'E:\\backup';
const backupPath = path.join(backupDir, 'gmach.sqlite.enc');

if (fs.existsSync(encryptedPath) && flag) {
  if (fs.existsSync(backupDir)) {
    fs.copyFileSync(encryptedPath, backupPath);
    console.log(`📁 קובץ גובה אל: ${backupPath}`);
  }

}
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: tempPath,
});

module.exports = sequelize;
