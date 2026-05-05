const sequelize = require('../config/db.config');
const Lead = require('./Lead.model');
const Note = require('./Note.model');
const User = require('./User.model');

const initDB = async () => {
  await sequelize.sync({ alter: true }); // auto-create tables
};

module.exports = { sequelize, Lead, Note, User, initDB };
