const express = require('express');
require('dotenv').config();

const sequelize = require('./models');
const LoanRoute = require('./routes/LoanRoute')
const GuarantorRoute = require('./routes/GuarantorRoute')
const PeopleRoute = require('./routes/PeopleRoute')
const RepaymentRoute = require('./routes/RepaymentRoute')
const fundMovementRoute = require('./routes/fundMovementRoute')
const LoginRoute = require('./routes/LoginRoute')
const cron = require('node-cron');
const { updateLoanStatuses } = require('./controllers/LoanController')
const DepositRoute = require('./routes/DepositRoute')
const notificationsRouter = require('./routes/notifications');

require('./models/assocatiion')
const cors = require('cors')
const app = express();
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
}));
app.use('/uploads', express.static('uploads'));

// יצירת טבלאות אוטומטית בהפעלה
sequelize.sync({ force: false }).then(() => {
    console.log('All tables recreated!');
});
cron.schedule('57 12 * * *', async () => {
    console.log('Running loan status update...');
    await updateLoanStatuses();
});
app.use('/Notification', notificationsRouter);
app.use('/Loan', LoanRoute)
app.use('/Guarantor', GuarantorRoute)
app.use('/Repayment', RepaymentRoute)
app.use('/People', PeopleRoute)
app.use('/FundMovement', fundMovementRoute)
app.use('/Login', LoginRoute)
app.use('/Deposit', DepositRoute)

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
