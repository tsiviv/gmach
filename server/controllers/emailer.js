const nodemailer = require('nodemailer');
const Loan = require('../models/Loan');
const People = require('../models/People');
const Repayment = require('../models/Repayment');
const Guarantor = require('../models/Guarantor');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SEND_EMAIL,
        pass: process.env.PASSWORD_EMAIL
    }
});


async function sendEmail(to, subject, message) {
    console.log("SSD", process.env.SEND_EMAIL, process.env.PASSWORD_EMAIL)

    const overdueLoans = await Loan.findAll({
        where: { status: 'overdue' },
        include: [
            { model: Repayment, as: 'repayments' },
            { model: People, as: 'borrower' },
            {
                model: Guarantor,
                as: 'guarantors',
                include: [{ model: People, as: 'guarantor' }]
            }
        ]
    });

    const mailOptions = {
        from: process.env.SEND_EMAIL,
        to,
        subject,
        html: message
    };

    return transporter.sendMail(mailOptions)
        .then(info => {
            console.log('✅ מייל נשלח:', info);
            return info;
        })
        .catch(error => {
            console.error('❌ שגיאה בשליחת מייל:', error);
            throw error;
        });
}

module.exports = { sendEmail };
