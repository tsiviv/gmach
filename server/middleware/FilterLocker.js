const fs = require('fs');

/**
 * נעילת הקובץ - מונע גישה מוחלטת (כולל קריאה, כתיבה, מחיקה)
 */
function lockFile(filePath) {
  try {
    fs.chmodSync(filePath, 0o000);
    console.log(`[lockFile] 🔒 קובץ נעול: ${filePath}`);
  } catch (err) {
    console.error(`[lockFile] שגיאה בנעילה: ${err.message}`);
  }
}

/**
 * שחרור נעילה - הרשאות קריאה/כתיבה לבעלים בלבד
 */
function unlockFile(filePath) {
  try {
    fs.chmodSync(filePath, 0o600);
    console.log(`[unlockFile] 🔓 שוחרר לנגישות קוד: ${filePath}`);
  } catch (err) {
    console.error(`[unlockFile] שגיאה בשחרור: ${err.message}`);
  }
}

module.exports = { lockFile, unlockFile };
