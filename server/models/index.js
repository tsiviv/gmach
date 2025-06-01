const path = require('path');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'data', 'gmach.sqlite'), // קובץ בתוך server/data
});

module.exports = sequelize;
