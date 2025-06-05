const fs = require('fs');

/**
 * נעילת הקובץ - מונע גישה מוחלטת (כולל קריאה, כתיבה, מחיקה)
 */
function lockFile(filePath) {
  try {
    fs.chmodSync(filePath, 0o000);
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
  } catch (err) {
    console.error(`[unlockFile] שגיאה בשחרור: ${err.message}`);
  }
}

module.exports = { lockFile, unlockFile };
