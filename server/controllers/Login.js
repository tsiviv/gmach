const { generateToken } = require('../middleware/GenerateToken')
const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(__dirname, '../middleware/settings.json');

const readConfig = () => {
  if (fs.existsSync(DATA_PATH)) {
    try {
      const raw = fs.readFileSync(DATA_PATH, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('שגיאה בקריאת הקובץ:', e);
    }
  }
  return {};
};

const writeConfig = (config) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(config, null, 2), 'utf8');
};

module.exports = {
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
    res.json({ name: config.name || '', logo: config.logo || '' });
  },

  uploadLogo: async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'לא הועלה קובץ' });
    }

    const config = readConfig();
    config.logo = req.file.filename;
    writeConfig(config);

    res.json({ message: 'הלוגו נשמר בהצלחה', config });
  },

  updateName: async (req, res) => {
    const gamachName = req.body.name || '';

    const config = readConfig();
    config.name = gamachName;
    writeConfig(config);

    res.json({ message: 'השם נשמר בהצלחה', config });
  }

}
