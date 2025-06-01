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
    deposit_amount: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
    , pull_amount: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'Deposit',
    timestamps: false,
});

module.exports = Deposit;
