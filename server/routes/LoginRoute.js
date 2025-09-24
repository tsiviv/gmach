const express = require('express');
const Login = require('../controllers/Login');
const { app: electronApp } = require('electron');
const { verifyToken } = require('../middleware/auth');

module.exports = (expressApp, userDataPath) => {
  const router = express.Router();

  const resolvedUserDataPath = userDataPath || electronApp.getPath('userData');

  if (Login.setUserDataPath) {
    Login.setUserDataPath(resolvedUserDataPath, expressApp);
  }

  router.post('/', Login.login);
  router.post('/upload-logo', verifyToken, Login.uploadLogo);
  router.post('/update-name', verifyToken, Login.updateName);
  router.get('/settings', Login.getSettings);

  return router;
};
