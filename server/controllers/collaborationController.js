// /server/controllers/collabController.js
const { compare } = require('bcrypt');
const { Collaboration } = require('../models');
const { hashPassword, comparePasswords } = require("../utils/hashUtils");
require('dotenv').config();

/**
 * Create a new collaboration.
 *
 * This function validates the provided name and password, ensuring they contain 
 * only allowed characters and that the name does not exceed a length of 156. 
 * If validation passes, it checks if a collaboration with the given name already exists. 
 * If not, it hashes the password and creates a new collaboration.
 * 
 * Handled response status codes:
 * 
 * 201 - Request successful, sends {name: {collaboration.name}}.
 * 
 * 409 - Collaboration with specified name already exists
 * 
 * 422 - Name or password contains invalid character or name is too long
 * 
 * 500 - Internal error occured.
 * 
 * @async
 * @param {Object} req - The request object containing the request data.
 * @param {Object} req.body - The request body containing collaboration details.
 * @param {string} req.body.name - The name of the collaboration.
 * @param {string} req.body.password - The password for the collaboration.
 * @param {Object} res - The response object used to send responses to the client.
 * @param {Function} res.status - A function to set the HTTP status code for the response.
 * @returns {Promise<void>} Returns a promise that resolves when the response is sent.
 */
exports.createCollaboration = async (req, res) => {
  const { name, password } = req.body;
  try {
    // Define a regular expression to allow only valid characters
    const allowedCharacters = /^[a-zA-Z0-9_\-=@,.;]+$/;

    // Validate the 'name' and 'password' fields for illegal characters
    if (!allowedCharacters.test(name) || !allowedCharacters.test(password)) {
      res.status(422).json({ error: 'Invalid characters in name or password. Only letters, numbers, and _ - = @ , . ; are allowed' });
      return;
    }

    // Validate length
    if (name.length > 156) {
      res.status(422).json({ error: 'Name length cannot be longer than 156' });
      return;
    }

    // Check if the collaboration with the provided name already exists
    const existingCollab = await Collaboration.findOne({ where: { name } });
    if (existingCollab) {
      res.status(409).json({ error: 'A collaboration with this name already exists' });
      return;
    }

    const hashedPassword = await hashPassword(password);
    // Create new collab
    const newCollab = await Collaboration.create({ name, password: hashedPassword });
    res.status(201).json({ name: newCollab.name });
    return;

  } catch (error) {
    console.log('Error creating collaboration:', error)
    res.status(500).json({ error: 'An error occurred while creating the collaboration' });
    return;
  }
};

/**
 * Join an existing collaboration.
 *
 * This function checks if a collaboration with the specified name exists 
 * and validates the provided password against the stored password. 
 * If validation is successful, it allows the user to join the collaboration.
 * 
 * Handled response status codes:
 * 
 * 200 - Request success, session set.
 * 
 * 400 - Invalid request body.
 * 
 * 401 - Name or password incorrect.
 * 
 * 500 - If an internal error occurs while joining the collaboration.
 *
 * @async
 * @param {Object} req - The request object containing the request data.
 * @param {Object} req.body - The request body containing collaboration details.
 * @param {string} req.body.name - The name of the collaboration.
 * @param {string} req.body.password - The password for the collaboration.
 * @param {Object} res - The response object used to send responses to the client.
 * @param {Function} res.status - A function to set the HTTP status code for the response.
 * @returns {Promise<void>} Returns a promise that resolves when the response is sent.
 */
exports.joinCollaboration = async (req, res) => {
  
  try {

    const { name, password } = req.body;

    if (!name || !password) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const collab = await Collaboration.findOne({ where: { name } });
    let isMatch;

    if (collab) {
      isMatch = await comparePasswords(password, collab.password);
    }
    if (!collab || !isMatch) {
      res.status(401).json({ error: 'Name or password incorrect' });
      return;
    }

    req.session.collabName = name;
    res.status(200).json({ name: name });
    return;

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
