const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const People = require('./People');

const Loan = sequelize.define('Loan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
    type: DataTypes.ENUM('pending', 'partial', 'paid', 'overdue', 'late_paid'),
    allowNull: false,
    defaultValue: 'pending'
  },
  repaymentType: {
    type: DataTypes.ENUM('once', 'monthly'),
    allowNull: false,
    defaultValue: 'once'
  },
  repaymentDay: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  singleRepaymentDate: {
    type: DataTypes.DATE,
    allowNull: true, 
  },
  documentPath: {
  type: DataTypes.STRING,
  allowNull: true
}

}, {
  tableName: 'loans',
  timestamps: false,
});

module.exports = Loan;
