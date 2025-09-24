const { DataTypes } = require('sequelize');
const {sequelize} = require('./index');

const Turns = sequelize.define('Turns', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  personId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'people', 
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  repaymentType: {
    type: DataTypes.ENUM('once', 'monthly'),
    allowNull: false,
    defaultValue: 'once'
  },
  description: {
    type: DataTypes.STRING,
  },
  date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'turns',
  timestamps: false, // מוסיף createdAt ו-updatedAt אוטומטית
});

module.exports = Turns;
