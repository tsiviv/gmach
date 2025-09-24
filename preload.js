// preload.js
const { contextBridge, app } = require('electron');
const path = require('path');
const fs = require('fs');

contextBridge.exposeInMainWorld('electronAPI', {
  getUploadedFilePath: (relativePath) => {
    const fullPath = path.join(app.getPath('userData'), 'uploads', relativePath);
    return fs.existsSync(fullPath) ? fullPath : null;
  }
});
