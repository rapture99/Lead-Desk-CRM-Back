const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Lead = sequelize.define('Lead', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: DataTypes.STRING,
  budget: DataTypes.INTEGER,
  location: DataTypes.STRING,
  propertyType: DataTypes.STRING,
  source: DataTypes.STRING,
  status: {
    type: DataTypes.ENUM('New', 'Contacted', 'Site Visit', 'Closed'),
    defaultValue: 'New',
  },
}, {
  timestamps: true,
});

module.exports = Lead;