const express = require('express');
const sequelize = require('./models');
const LoanRoute=require('./routes/LoanRoute')
const GuarantorRoute=require('./routes/GuarantorRoute')
const PeopleRoute=require('./routes/PeopleRoute')
const RepaymentRoute=require('./routes/RepaymentRoute')
const cors=require('cors')
const app = express();
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
  }));
  
// יצירת טבלאות אוטומטית בהפעלה
sequelize.sync({ alter: true }).then(() => {
    console.log('All tables recreated!');
});

app.use('/Loan',LoanRoute)
app.use('/Guarantor',GuarantorRoute)
app.use('/Repayment',RepaymentRoute)
app.use('/People',PeopleRoute)

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
