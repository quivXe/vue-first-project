// /server/models/index.js
const sequelize = require('../config/db');
const Collaboration = require('./Collaboration');
const Operation = require('./Operation');

// Define associations
Collaboration.hasMany(Operation, { foreignKey: 'collabName', onDelete: 'CASCADE' });
Operation.belongsTo(Collaboration, { foreignKey: 'collabName' });

module.exports = { sequelize, Collaboration, Operation };
