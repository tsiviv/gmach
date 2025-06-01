const Loan = require('./Loan');
const People = require('./People');
const Guarantor = require('./Guarantor');
const Repayment = require('./Repayment');
const FundMovement = require('./FundMovement');
const Deposit =require('./Deposit')
// הלוואה שייכת ללווה
Loan.belongsTo(People, { foreignKey: 'borrowerId', as: 'borrower' });

// ערב שייך להלוואה ואדם
Guarantor.belongsTo(Loan, { foreignKey: 'loanId' });
Guarantor.belongsTo(People, { foreignKey: 'PeopleId', as: 'guarantor' });

// הלוואה מכילה ערבויות
Loan.hasMany(Guarantor, { foreignKey: 'loanId', as: 'guarantors' });

// החזר שייך להלוואה
Repayment.belongsTo(Loan, { foreignKey: 'loanId', as: 'loan' });


// הלוואה מכילה החזרים
Loan.hasMany(Repayment, { foreignKey: 'loanId', as: 'repayments' });

// תנועת קרן שייכת לאדם
FundMovement.belongsTo(People, { foreignKey: 'personId', as: 'person' });

// אדם יכול להיות לו מספר תנועות
People.hasMany(FundMovement, { foreignKey: 'personId', as: 'fundMovements' });

Deposit.belongsTo(People, { foreignKey: 'PeopleId', as: 'person' });


People.hasMany(Deposit, { foreignKey: 'PeopleId', as: 'Deposit' });

  
