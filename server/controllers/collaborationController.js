// /server/controllers/collabController.js
const { Collaboration } = require('../models');

// Create a new collaboration
exports.createCollaboration = async (req, res) => {
  const { name, password } = req.body;
  try {

    // Check if the collaboration with the provided name already exists
    const existingCollab = await Collaboration.findOne({ where: { name } });
    if (existingCollab) {
      return res.status(400).json({ error: 'A collaboration with this name already exists' })
    }

    // Create new collab
    const newCollab = await Collaboration.create({ name, password }); // TODO: REMOVE PASSWORD FROM RESPONSE
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
    const collab = await Collaboration.findOne({ where: { name, password } });
    if (!collab) {
      return res.status(404).json({ message: 'Collaboration not found or password incorrect.' });
    }
    res.status(201).json({ name: collabName });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
