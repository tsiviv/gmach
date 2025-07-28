const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const People = require('./People');

const Deposit = sequelize.define('Deposit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  PeopleId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: People,
      key: 'id',
    },
  },
  isDeposit: {
    type: DataTypes.BOOLEAN, // true = הפקדה, false = משיכה
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  balanceAfter: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  method: {
    type: DataTypes.ENUM('deposit', 'deposit_pull'),
    allowNull: false,
  },
  typeOfPayment: {
    type: DataTypes.ENUM('check', 'Standing_order','cash'),
    allowNull: false,
    defaultValue: 'check',
  },
  currency: {
    type: DataTypes.ENUM('dollar', 'shekel'),
    allowNull: false,
    defaultValue: 'shekel',
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'Deposits',
  timestamps: false,
});

module.exports = Deposit;
