const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const Loan = require('./Loan');

const Repayment = sequelize.define('Repayment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  loanId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Loan,
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  paidDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'repayments',
  timestamps: false,
});

Repayment.belongsTo(Loan, { foreignKey: 'loanId' });

module.exports = Repayment;
