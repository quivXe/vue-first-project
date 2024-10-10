// /server/controllers/operationController.js
const pusher = require('../config/pusher');
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
 * @param {number} req.body.collabName - The name of the collaboration.
 * @param {string} req.body.operationType - The type of the operation ('add'|'update'|'delete').
 * @param {JSON} req.body.details - Additional details about the operation.
 * @param {number} req.body.operationIndex - The index of the operation in the sequence.
 * @param {number} req.body.operation_part - The part number of the operation.
 * @param {number} req.body.operation_max_part - The maximum part number of the operation.
 * @param {number} req.body.socket_id - Socket that will be excluded from pusher trigger.
 * @param {Object} res - The response object used to send responses to the client.
 * 
 * @example
 * // Example of logging a new operation
 * POST /operations/log
 * {
 *   "collabName": 1,
 *   "operationType": "add",
 *   "details": {taskId: 5, parentId: 1},
 *   "operation_part": 1,
 *   "operation_max_part": 3
 * }
 */
exports.logOperation = async (req, res) => {
  const { collabName, operationType, details, operation_part, operation_max_part, socket_id } = req.body;
  try {
    const newOperation = await Operation.create({ 
      collabName, 
      operationType, 
      details,
      operation_part, 
      operation_max_part 
    });

    const eventData = {type: operationType, details};
    pusher.trigger(`private-${collabName}`, "new-operation", eventData, socket_id).catch(err => {
      res.status(500).json({error: {pusherError: err}});
      console.log(err);
      return;
    })

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
 * @param {number} req.body.collabName - The name of the collaboration.
 * @param {number} [req.body.timestamp] - Optional timestamp to filter results (greater than this value).
 * @param {Object} res - The response object used to send responses to the client.
 */
exports.getOperationsForCollab = async (req, res) => {
  const { collabName, timestamp } = req.body;

  try {
    // If timestamp is provided, filter operations based on it
    const conditions = { collabName };
    if (timestamp) {
      conditions.timestamp = { [Op.gt]: timestamp }; // Greater than timestamp
    }
    
    const operations = await Operation.findAll({ where: conditions });
    res.status(200).json(operations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
