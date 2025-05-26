const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const People = require('./People');
const Loan = require('./Loan');

const Guarantor = sequelize.define('Guarantor', {
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
    PeopleId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: People,
            key: 'id',
        },
    },
    documentPath: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'guarantors',
    timestamps: false,
});

module.exports = Guarantor;
