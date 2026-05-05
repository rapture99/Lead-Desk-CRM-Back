const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const Lead = require('./Lead.model');

const Note = sequelize.define('Note', {
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

Lead.hasMany(Note, { onDelete: 'CASCADE' });
Note.belongsTo(Lead);

module.exports = Note;