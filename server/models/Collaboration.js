// /server/models/Collaboration.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Collaboration = sequelize.define('Collaboration', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, { timestamps: true });

module.exports = Collaboration;
