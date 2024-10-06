// /server/models/Operation.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Operation = sequelize.define('Operation', {
  collabId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  operationIndex: { 
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  operationType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  operation_part: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  operation_max_part: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, { timestamps: true });

module.exports = Operation;
