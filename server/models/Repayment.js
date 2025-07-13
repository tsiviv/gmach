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
  typeOfPayment: {
        type: DataTypes.ENUM('check', 'Standing_order'),
        allowNull: false,
        defaultValue: 'once'
    },
  currency: {
        type: DataTypes.ENUM('dollar', 'shekel'),
        allowNull: false,
        defaultValue: 'shekel'
  },
}, {
  tableName: 'repayments',
  timestamps: false,
});


module.exports = Repayment;
