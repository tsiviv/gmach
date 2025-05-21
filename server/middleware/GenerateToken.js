const fs=require('fs')
const path=require('path')
const jwt = require('jsonwebtoken');

const generateToken = (email,role) => {
    // קח את הטוקן מכותרת ה-Authorization
    try {
        const privateKey = fs.readFileSync(path.join(__dirname, '../private.key'), 'utf8');
        const token = jwt.sign({ role: role, email: email }, privateKey, {
            algorithm: 'RS256',
            expiresIn: '24h',
        });
        return token
    } catch (error) {
        console.error('JWT error:', error);
    }
};
module.exports = { generateToken };