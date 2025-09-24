const { generateToken } = require('../middleware/GenerateToken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

let DATA_PATH = null;  // נקבע ב-setUserDataPath
let uploadPath = null;
let expressAppInstance = null;

// מאפשר קבלת הנתיב + האפליקציה מבחוץ
function setUserDataPath(userDataPath, expressApp) {
  expressAppInstance = expressApp;

  // הגדרת נתיבים דינמית תחת userData
  uploadPath = path.join(userDataPath, 'uploads');
  DATA_PATH = path.join(userDataPath, 'settings.json');

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  // יצירת settings.json ריק אם אין עדיין
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({}, null, 2), 'utf8');
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const readConfig = () => {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('שגיאה בקריאת הקובץ:', e);
    return {};
  }
};

const writeConfig = (config) => {
  if (expressAppInstance) {
    config.userDataPath = uploadPath.replace(/[/\\]uploads$/, '');
  }
  fs.writeFileSync(DATA_PATH, JSON.stringify(config, null, 2), 'utf8');
};

module.exports = {
  setUserDataPath,

  login: async (req, res) => {
    const { email, password } = req.body;
    const validEmail = process.env.ENAIL_ADMIN;
    const validPassword = process.env.PASSWORD_ADMIN;

    if (email !== validEmail || password !== validPassword) {
      return res.status(401).json({ error: 'המייל או הסיסמה שגויים' });
    }

    const token = await generateToken({ id: 123 });
    res.send({ token });
  },

  getSettings: async (req, res) => {
    const config = readConfig();
    res.json({
      name: config.name || '',
      logo: config.logo || '',
      userDataPath: config.userDataPath || ''
    });
  },

  uploadLogo: [upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'לא הועלה קובץ' });

      const logoFilePath = path.join(uploadPath, 'logo.png');
      if (fs.existsSync(logoFilePath)) fs.unlinkSync(logoFilePath);

      await sharp(req.file.path).png().toFile(logoFilePath);
      fs.unlinkSync(req.file.path);

      const config = readConfig();
      config.logo = 'logo.png';
      writeConfig(config);

      res.json({ message: 'הלוגו נשמר בהצלחה בפורמט PNG', config });
    } catch (error) {
      console.error('שגיאה בהעלאת הלוגו:', error);
      res.status(500).json({ message: error.message });
    }
  }],

  updateName: async (req, res) => {
    const gamachName = req.body.name || '';
    const config = readConfig();
    config.name = gamachName;
    writeConfig(config);
    res.json({ message: 'השם נשמר בהצלחה', config });
  }
};
