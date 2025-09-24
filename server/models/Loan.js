const { DataTypes } = require('sequelize');
const {sequelize} = require('./index');
const People = require('./People');

const Loan = sequelize.define('Loan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  numOfLoan: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  borrowerId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: People,
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'partial', 'paid', 'overdue', 'late_paid', 'PaidBy_Gauartantor'),
    allowNull: false,
    defaultValue: 'pending'
  },
  repaymentType: {
    type: DataTypes.ENUM('once', 'monthly'),
    allowNull: false,
    defaultValue: 'once'
  },
  lateCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  repaymentDay: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  amountInMonth: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  singleRepaymentDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  amountOfPament: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  documentPath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  typeOfPayment: {
    type: DataTypes.ENUM('check', 'Standing_order','cash'),
    allowNull: false,
    defaultValue: 'once'
  },
  currency: {
    type: DataTypes.ENUM('dollar', 'shekel'),
    allowNull: false,
    defaultValue: 'shekel'
  },
}, {
  tableName: 'loans',
  timestamps: false,
});

module.exports = Loan;
