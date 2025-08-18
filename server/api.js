const loadEncryptedEnv = require('./load-encrypted-env');
const path = require('path');

loadEncryptedEnv(() => {
    const express = require('express');
    const cron = require('node-cron');
    const cors = require('cors');
    const gracefulShutdown = require('./models/endActions')
    const LoanRoute = require('./routes/LoanRoute');
    const GuarantorRoute = require('./routes/GuarantorRoute');
    const PeopleRoute = require('./routes/PeopleRoute');
    const RepaymentRoute = require('./routes/RepaymentRoute');
    const fundMovementRoute = require('./routes/fundMovementRoute');
    const LoginRoute = require('./routes/LoginRoute');
    const turnsRoute = require('./routes/turnsRoutes')
    const DepositRoute = require('./routes/DepositRoute');
    const notificationsRouter = require('./routes/notifications');
    const { updateLoanStatuses } = require('./controllers/LoanController');
    const { sendEmail } = require('./controllers/emailer');
    const { verifyToken } = require('./middleware/auth');
    const { wantsNotifications } = require('./middleware/settings.json');
    require('./models/assocatiion');

    const app = express();
    app.use(express.json());
    app.use(cors({
        origin: ['http://localhost:3000'],
        credentials: true
    }));
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    app.use(express.urlencoded({ extended: true }));
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    process.on('exit', gracefulShutdown);
    process.on('uncaughtException', async (err) => {
        console.error('Uncaught exception:', err);
        await gracefulShutdown();
    });

    // עדכון סטטוסים - פעמיים ביום: 09:00 ו־21:00
    cron.schedule('0 9,21 * * *', async () => {
        console.log('Running loan status update...');
        await updateLoanStatuses();
    });

    // שליחת מייל - פעם בשבוע, במוצאי שבת (שבת ב-22:00)
    cron.schedule('0 22 * * 6', async () => {
        console.log('Running email...');
        if (wantsNotifications) {
            await sendEmail();
        }
    });



    app.use('/Notification', verifyToken, notificationsRouter);
    app.use('/Loan', verifyToken, LoanRoute);
    app.use('/Guarantor', verifyToken, GuarantorRoute);
    app.use('/Repayment', verifyToken, RepaymentRoute);
    app.use('/People', verifyToken, PeopleRoute);
    app.use('/FundMovement', verifyToken, fundMovementRoute);
    app.use('/Login', LoginRoute);
    app.use('/Deposit', verifyToken, DepositRoute);
    app.use('/Turn', verifyToken, turnsRoute);

    const PORT = 4000;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});
