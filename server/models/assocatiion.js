const Loan = require('./Loan');
const People = require('./People');
const Guarantor = require('./Guarantor');
const Repayment = require('./Repayment');
const FundMovement = require('./FundMovement');
const Deposit =require('./Deposit')
const Turns =require('./Turns')

Loan.belongsTo(People, { foreignKey: 'borrowerId', as: 'borrower' });

Guarantor.belongsTo(Loan, { foreignKey: 'loanId' });
Guarantor.belongsTo(People, { foreignKey: 'PeopleId', as: 'guarantor' });

Loan.hasMany(Guarantor, { foreignKey: 'loanId', as: 'guarantors' });

Repayment.belongsTo(Loan, { foreignKey: 'loanId', as: 'loan' });


Loan.hasMany(Repayment, { foreignKey: 'loanId', as: 'repayments' });

FundMovement.belongsTo(People, { foreignKey: 'personId', as: 'person' });

People.hasMany(FundMovement, { foreignKey: 'personId', as: 'fundMovements' });

Deposit.belongsTo(People, { foreignKey: 'PeopleId', as: 'person' });


People.hasMany(Deposit, { foreignKey: 'PeopleId', as: 'Deposit' });

  
Turns.belongsTo(People, { foreignKey: 'personId', as: 'person' });

People.hasMany(Turns, { foreignKey: 'personId', as: 'Turns' });
