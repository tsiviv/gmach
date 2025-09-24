const loadEncryptedEnv = require('./load-encrypted-env');
const path = require('path');
const express = require('express');

module.exports = async function startServer(expressApp, userDataPath) {
    await new Promise((resolve) => loadEncryptedEnv(resolve));

    const app = expressApp;
    const cron = require('node-cron');
    const cors = require('cors');
    const gracefulShutdown = require('./models/endActions'); // ודא שהפונקציה ב־endActions יודעת לקבל פרמטר reason
    const LoanRoute = require('./routes/LoanRoute');
    const GuarantorRoute = require('./routes/GuarantorRoute');
    const PeopleRoute = require('./routes/PeopleRoute');
    const RepaymentRoute = require('./routes/RepaymentRoute');
    const fundMovementRoute = require('./routes/fundMovementRoute');
    const LoginRoute = require('./routes/LoginRoute')(app, userDataPath);
    const turnsRoute = require('./routes/turnsRoutes');
    const DepositRoute = require('./routes/DepositRoute');
    const notificationsRouter = require('./routes/notifications');
    const { updateLoanStatuses } = require('./controllers/LoanController');
    const { sendEmail } = require('./controllers/emailer');
    const { verifyToken } = require('./middleware/auth');
    const { wantsNotifications } = require('./middleware/settings.json');
    require('./models/assocatiion');

    // Middleware
    app.use(express.json());
    app.use(cors({ origin: "*", credentials: true }));
    app.use(express.urlencoded({ extended: true }));
    app.use('/uploads', express.static(path.join(userDataPath, 'uploads')));

    // Shutdown handlers
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('exit', () => gracefulShutdown('exit'));
    process.on('uncaughtException', async (err) => {
        console.error('Uncaught exception:', err);
        await gracefulShutdown('uncaughtException');
    });
    process.on('unhandledRejection', async (reason) => {
        console.error('Unhandled rejection:', reason);
        await gracefulShutdown('unhandledRejection');
    });

    // Cron jobs
    cron.schedule('0 9,21 * * *', async () => {
        console.log('Running loan status update...');
        await updateLoanStatuses();
    });

    cron.schedule('0 22 * * 6', async () => {
        console.log('Running email...');
        if (wantsNotifications) await sendEmail();
    });

    // Routes
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
    const serverInstance = app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });

    return serverInstance;
};
