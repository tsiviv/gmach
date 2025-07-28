const Login = require('../controllers/Login');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, 'logo.png');
    }
});

router.post('/', Login.login);

const upload = multer({ storage: storage });

router.post('/upload-logo', upload.single('logo'), Login.uploadLogo);

router.post('/update-name', Login.updateName);

router.get('/settings', Login.getSettings);

module.exports = router;
