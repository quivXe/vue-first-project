// /server/models/Operation.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Operation = sequelize.define('Operation', {
  collabName: {
    type: DataTypes.STRING(156),
    allowNull: false,
  },
  operationType: {
    type: DataTypes.ENUM('add', 'update', 'delete', 'init'),
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
