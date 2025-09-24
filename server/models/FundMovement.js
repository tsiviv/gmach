const { DataTypes } = require('sequelize');
const {sequelize} = require('./index');

const FundMovement = sequelize.define('FundMovement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  personId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'people', // זה השם של הטבלה של האנשים
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('loan_given', 'repayment_received', 'donation', 'manual_adjustment','deposit','pull_deposit'),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
  },
  date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  typeOfPayment: {
        type: DataTypes.ENUM('check', 'Standing_order'),
        allowNull: false,
        defaultValue: 'check'
    },
  currency: {
        type: DataTypes.ENUM('dollar', 'shekel'),
        allowNull: false,
        defaultValue: 'shekel'
    },
}, {
  tableName: 'fund_movements',
  timestamps: false, // מוסיף createdAt ו-updatedAt אוטומטית
});

module.exports = FundMovement;
