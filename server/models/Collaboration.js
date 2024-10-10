// /server/models/Collaboration.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Collaboration = sequelize.define('Collaboration', {
  name: {
    type: DataTypes.STRING(156),
    allowNull: false,
    unique: true,
    primaryKey: true
  },
  password: {
    type: DataTypes.CHAR(60),
    allowNull: false,
  }
}, { timestamps: true });

module.exports = Collaboration;
