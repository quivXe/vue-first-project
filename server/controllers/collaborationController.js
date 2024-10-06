// /server/controllers/collabController.js
const { compare } = require('bcrypt');
const { Collaboration } = require('../models');
const { hashPassword, comparePasswords } = require("../utils/hashUtils");

// Create a new collaboration
exports.createCollaboration = async (req, res) => {
  const { name, password } = req.body;
  try {

    // Check if the collaboration with the provided name already exists
    const existingCollab = await Collaboration.findOne({ where: { name } });
    if (existingCollab) {
      return res.status(400).json({ error: 'A collaboration with this name already exists' })
    }

    const hashedPassword = await hashPassword(password);
    // Create new collab
    const newCollab = await Collaboration.create({ name, password: hashedPassword });
    res.status(201).json({ name: newCollab.name });

  } catch (error) {
    console.log('Error creating collaboration:', error)
    return res.status(500).json({ error: 'An error occurred while creating the collaboration' });
}
};

// Join an existing collaboration
exports.joinCollaboration = async (req, res) => {
  const { name, password } = req.body;
  try {

    const collab = await Collaboration.findOne({ where: { name } });
    let isMatch;
    
    if (collab) {
      isMatch = await comparePasswords(password, collab.password);
    }
    if (!collab || !isMatch) {
      return res.status(404).json({ error: 'Collaboration not found or password incorrect.' });
    }

    res.status(201).json({ name: name });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
