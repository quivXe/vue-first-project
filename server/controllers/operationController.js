// /server/controllers/operationController.js
const { Operation } = require('../models');
const { Op } = require('sequelize');

/**
 * Log a new operation.
 *
 * This function creates a new operation entry in the database for a specified collaboration.
 * It requires collaboration ID, operation type, details, and other operation-related data.
 * 
 * Handled response status codes:
 * 
 * 201 - Request successful, sends created operation.
 * 
 * 500 - Internal error occured.
 * 
 * @async
 * @param {Object} req - The request object containing the operation data.
 * @param {Object} req.body - The request body containing operation details.
 * @param {number} req.body.collabId - The ID of the collaboration.
 * @param {string} req.body.operationType - The type of the operation ('create'|'update'|'delete').
 * @param {string} req.body.details - Additional details about the operation.
 * @param {number} req.body.operationIndex - The index of the operation in the sequence.
 * @param {number} req.body.operation_part - The part number of the operation.
 * @param {number} req.body.operation_max_part - The maximum part number of the operation.
 * @param {Object} res - The response object used to send responses to the client.
 * 
 * @example
 * // Example of logging a new operation
 * POST /operations/log
 * {
 *   "collabId": 1,
 *   "operationType": "create",
 *   "details": "Created a new task",
 *   "operationIndex": 1,
 *   "operation_part": 1,
 *   "operation_max_part": 3
 * }
 */
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

    // PUSHER

    res.status(201).json(newOperation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get operations for a collaboration with operationIndex filter.
 *
 * This function retrieves all operations associated with a specified collaboration ID.
 * Optionally, it can filter operations based on the provided operation index.
 * 
 * Handled response status codes:
 * 
 * 200 - Sends Array of operations for specified collaboration.
 * 
 * 500 - Internal error occured.
 * 
 * @async
 * @param {Object} req - The request object containing the filter criteria.
 * @param {Object} req.body - The request body containing filter criteria.
 * @param {number} req.body.collabId - The ID of the collaboration.
 * @param {number} [req.body.operationIndex] - Optional operation index to filter results (greater than this value).
 * @param {Object} res - The response object used to send responses to the client.
 */
exports.getOperationsForCollab = async (req, res) => {
  const { collabId, operationIndex } = req.body;

  try {
    // If operationIndex is provided, filter operations based on it
    const conditions = { collabId };
    if (operationIndex) {
      conditions.operationIndex = { [Op.gt]: operationIndex }; // Greater than operationIndex
    }
    
    const operations = await Operation.findAll({ where: conditions });
    res.status(200).json(operations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
