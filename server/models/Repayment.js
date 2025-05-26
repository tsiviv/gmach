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
    allowNull: true,
    references: {
      model: Loan,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
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


module.exports = Repayment;
