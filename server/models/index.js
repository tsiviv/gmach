const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './gmach.sqlite', // שמור בקובץ מקומי
});

module.exports = sequelize;
