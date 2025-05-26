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
const axios = require('axios');



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
cron.schedule('0 2 * * *', async () => {
    await axios.get('http://localhost:4000/Loan/missing-monthly-repayments');
});
app.use('/Loan', LoanRoute)
app.use('/Guarantor', GuarantorRoute)
app.use('/Repayment', RepaymentRoute)
app.use('/People', PeopleRoute)
app.use('/FundMovement', fundMovementRoute)
app.use('/Login', LoginRoute)

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
