// /server/controllers/operationController.js
const { Operation } = require('../models');
const { Op } = require('sequelize');

// Log a new operation
exports.logOperation = async (req, res) => {
  const { collabId, operationType, details, operationIndex, operation_part, operation_max_part } = req.body;
  try {
    const newOperation = await Operation.create({ 
      collabId, 
      operationType, 
      details, 
      operationIndex, 
      operation_part, 
      operation_max_part 
    });
    res.status(201).json(newOperation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get operations for a collaboration with operationIndex filter
exports.getOperationsForCollab = async (req, res) => {
  const { collabId, operationIndex } = req.body;

  try {
    // If operationIndex is provided, filter operations based on it
    const conditions = { collabId };
    if (operationIndex) {
      conditions.operationIndex = { [Op.gt]: operationIndex }; // Greater than operationIndex
    }
    
    const operations = await Operation.findAll({ where: conditions });
    res.json(operations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
