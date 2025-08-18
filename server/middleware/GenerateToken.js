const fs=require('fs')
const path=require('path')
const jwt = require('jsonwebtoken');

const generateToken = (email,role) => {
    const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n'); // תקן את המפתח
    try {
        const token = jwt.sign({ role: role, email: email }, privateKey, {
            algorithm: 'RS256',
            expiresIn: '1h',
        });
        return token
    } catch (error) {
        console.error('JWT error:', error);
    }
};
module.exports = { generateToken };