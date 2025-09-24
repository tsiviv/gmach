const path = require('path');
const fs = require('fs');
const express = require('express');
const loadEncryptedEnv = require('./server/load-encrypted-env');
const startServer = require('./server/api');
const { app, BrowserWindow, ipcMain } = require('electron');

let logFile; // נגדיר מאוחר יותר אחרי שה-app מוכן
let gracefulShutdown;
let splashWindow; 

function log(message) {
  if (!logFile) return; // אם עדיין אין נתיב לוג, לא נרשום
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logFile, line);
}
function logError(err) {
  if (!logFile) return;
  const line = `[${new Date().toISOString()}] ERROR: ${err.stack || err}\n`;
  fs.appendFileSync(logFile, line);
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 300,
    height: 200,
    frame: false,
    transparent: false, // שקוף גורם להרבה בעיות רינדור, נסה לבטל
    alwaysOnTop: true,
    resizable: false,
    show: false, // נטען קודם ואז נציג
    backgroundColor: '#ffffff',
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  const splashHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        html, body {
          margin: 0;
          height: 100%;
          background: #ffffff;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .loader {
          border: 8px solid #f3f3f3;
          border-top: 8px solid #3498db;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="loader"></div>
    </body>
    </html>
  `;

  splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(splashHTML));

  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
  });
}

// ----------- חלון טעויות ----------
function showErrorWindow(message) {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    resizable: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });

  win.loadURL(`data:text/html,
    <h2 style="color:red;">App Error</h2>
    <pre>${message}</pre>
  `);
}


// ----------- הפעלת השרת ----------
let serverInstance;
async function startServerInstance() {
  const expressApp = express();
  const userDataPath = app.getPath('userData'); // כאן זה בטוח
  serverInstance = await startServer(expressApp, userDataPath);
  log('✅ Server started successfully');
}


function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const indexPath = path.join(__dirname, 'client', 'build', 'index.html');
  if (!fs.existsSync(indexPath)) {
    const errMsg = `❌ Build of React not found at ${indexPath}`;
    log(errMsg);
    showErrorWindow(errMsg);
    return;
  }

  win.loadFile(indexPath);
  log('✅ Main window loaded');

  // סגירת הספלאש כשהחלון נטען והשרת מוכן
    win.webContents.once('did-finish-load', async () => {

    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
  });
}




app.whenReady().then(async () => {
  logFile = path.join(app.getPath('userData'), 'electron.log');
  createSplashWindow(); 

  try {
    loadEncryptedEnv(); 
    gracefulShutdown = require('./server/models/endActions');
    log('✔️ Environment loaded successfully');
  } catch (err) {
    logError(err);
    showErrorWindow(err.stack || err);
    app.exit(1);
  }

  try {
    await startServerInstance();
    createMainWindow();
  } catch (err) {
    logError(err);
    showErrorWindow(err.stack || err);
  }
});

// ----------- סגירה מסודרת ----------
app.on('before-quit', async (event) => {
  event.preventDefault();
  try {
    if (serverInstance) serverInstance.close();
    await gracefulShutdown();
    log('⚠️ App shutting down gracefully');
  } catch (err) {
    logError(err);
  } finally {
    app.exit(0);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ----------- טיפול בשגיאות מערכתיות ----------
process.on('SIGINT', async () => await gracefulShutdown());
process.on('SIGTERM', async () => await gracefulShutdown());
process.on('uncaughtException', async (err) => {
  logError(err);
  showErrorWindow(err.stack || err);
  await gracefulShutdown();
});

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});
