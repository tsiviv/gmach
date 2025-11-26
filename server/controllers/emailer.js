const nodemailer = require('nodemailer');
const Loan = require('../models/Loan');
const People = require('../models/People');
const Repayment = require('../models/Repayment');
const Guarantor = require('../models/Guarantor');
const { Op } = require('sequelize');
const moment = require('moment');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SEND_EMAIL,
        pass: process.env.PASSWORD_EMAIL
    }
});


async function sendEmail() {
    try {
        const loans = await Loan.findAll({
            where: {
                status: { [Op.in]: ['partial', 'overdue'] } // תיקון הטעות כאן
            },
            include: [
                {
                    model: Repayment,
                    as: 'repayments'
                },
                {
                    model: People,
                    as: 'borrower'
                },
                {
                    model: Guarantor,
                    as: 'guarantors',
                    include: [
                        {
                            model: People,
                            as: 'guarantor'
                        }
                    ]
                }
            ]
        });
        const mailOptions = {
            from: process.env.SEND_EMAIL,
            to: process.env.ENAIL_ADMIN,
            subject: "הלוואות שלא שולמו עדיין",
            html: generateEmailHTML(loans)
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
    catch (error) {
        console.log("error", error)
        throw error;
    }
}
function translateLoanStatus(status) {
    const statusMap = {
        pending: 'פעילה',
        partial: 'שולמה חלקית',
        paid: 'שולמה',
        overdue: ' פיגור בתשלום',
        late_paid: 'שולמה באיחור',
        PaidBy_Gauartantor: 'שולמה על ידי ערב',
    };

    return statusMap[status] || 'לא ידוע';
}
function generateEmailHTML(loans) {
    if (!loans.length) {
        return '<p>אין הלוואות שלא שולמו.</p>';
    }

    let html = `
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; direction: rtl;">
            <thead>
                <tr style="background-color: #f0f0f0;">
                    <th>מספר הלוואה</th>
                    <th>ת"ז לווה</th>
                    <th>שם לווה</th>
                    <th>סכום</th>
                    <th>סטטוס</th>
                    <th>סוג החזר</th>
                    <th>סכום החזר חודשי</th>
                    <th>תאריך החזר</th>
                    <th>בכמה תשלומים</th>
                    <th>מספר אחורים</th>
                </tr>
            </thead>
            <tbody>
    `;

    for (const loan of loans) {
        const borrower = loan.borrower || {};
        html += `
            <tr>
                <td>${loan.numOfLoan}</td>
                <td>${loan.borrowerId}</td>
                <td>${borrower.fullName || 'לא ידוע'}</td>
                <td>${loan.amount} ₪</td>
                <td>${translateLoanStatus(loan.status)}</td>
                <td>${loan.repaymentType === 'monthly' ? 'חודשי' : 'חד פעמי'}</td>
                <td>${loan.repaymentType === 'monthly' ? loan.amountInMonth : '-'}</td>
                <td>${loan.repaymentType === 'monthly' ? loan.repaymentDay + " לחודש" : new Date(loan.startDate).toLocaleDateString('he-IL')}</td>
                <td>${loan.amountOfPament}</td>
                <td>${loan.lateCount}</td>
            </tr>
        `;

        // ⬇️ טבלת ערבים
        if (loan.guarantors && loan.guarantors.length) {
            html += `
                <tr><td colspan="8">
                    <b>ערבים:</b>
                    <table border="1" cellpadding="4" cellspacing="0" style="margin-top: 5px; border-collapse: collapse; width: 100%; direction: rtl;">
                        <thead>
                            <tr style="background-color: #e0e0e0;">
                                <th>ת"ז ערב</th>
                                <th>שם ערב</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            for (const g of loan.guarantors) {
                html += `
                    <tr>
                        <td>${g.PeopleId}</td>
                        <td>${g.guarantor?.fullName || 'לא ידוע'}</td>
                    </tr>
                `;
            }
            html += `
                        </tbody>
                    </table>
                </td></tr>
            `;
        }

        // ⬇️ טבלת תשלומים
        if (loan.repayments && loan.repayments.length) {
            html += `
                <tr><td colspan="8">
                    <b>תשלומים:</b>
                    <table border="1" cellpadding="4" cellspacing="0" style="margin-top: 5px; border-collapse: collapse; width: 100%; direction: rtl;">
                        <thead>
                            <tr style="background-color: #e0f7ff;">
                                <th>תאריך</th>
                                <th>סכום</th>
                                <th>הערות</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            for (const r of loan.repayments) {
                html += `
                    <tr>
                        <td>${new Date(r.paidDate).toLocaleDateString('he-IL')}</td>
                        <td>${r.amount} ₪</td>
                        <td>${r.notes || ''}</td>
                    </tr>
                `;
            }
            html += `
                        </tbody>
                    </table>
                </td></tr>
            `;
        }
    }

    html += `
            </tbody>
        </table>
    `;

    return html;
}


module.exports = { sendEmail };
