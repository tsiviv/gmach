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
  dueDate: {
    type: DataTypes.DATE,
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'loans',
  timestamps: false,
});

Loan.belongsTo(People, { foreignKey: 'borrowerId', as: 'borrower' });

module.exports = Loan;
