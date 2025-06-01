const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'settings.json');

function readSettings() {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { wantsNotifications: true }; // ברירת מחדל
  }
}

function writeSettings(settings) {
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
}

module.exports = {
  get: () => readSettings().wantsNotifications,
  set: (value) => {
    const current = readSettings();
    current.wantsNotifications = value;
    writeSettings(current);
  }
};

