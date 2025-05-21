const jwt = require('jsonwebtoken');
const fs = require('fs')
const path = require('path')
const verifyTokenSuplier = (req, res, next) => {
    // קח את הטוקן מכותרת ה-Authorization
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1]; // חתוך את המילה "Bearer" מהכותרת
console.log(token)
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const publicKey = fs.readFileSync(path.join(__dirname, '../public.key'), 'utf8');

    // אימות הטוקן
    jwt.verify(token, publicKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }

        req.user = decoded; // אתה יכול להוסיף את המידע המפוענח של המשתמש ב-req.user
        console.log(req.user)
        if (req.user.role == 'suplier'){
           
            next(); }// המשך למידול הבא
        else return res.status(403).json({ message: 'Not allwo' });
    });
};
const verifyTokenAdmin = (req, res, next) => {
    // קח את הטוקן מכותרת ה-Authorization
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1]; // חתוך את המילה "Bearer" מהכותרת

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const publicKey = fs.readFileSync(path.join(__dirname, '../public.key'), 'utf8');

    // אימות הטוקן
    jwt.verify(token, publicKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = decoded
        console.log(req.user)
        if (req.user.role == 'admin'){
            next(); }
        else return res.status(403).json({ message: 'Not allwo' });
    });
};
module.exports = { verifyTokenSuplier, verifyTokenAdmin };
