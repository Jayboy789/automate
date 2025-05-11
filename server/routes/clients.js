// routes/clients.js
const express = require('express');
const Client = require('../models/Client');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/clients
 * @desc    Get all clients
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find()
      .populate('createdBy', 'name')
      .sort({ name: 1 });
    
    res.json(clients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/clients/:id
 * @desc    Get client by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('createdBy', 'name');
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/clients
 * @desc    Create a new client
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { name, code, description } = req.body;
    
    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' });
    }
    
    // Check if client code already exists
    const existingClient = await Client.findOne({ code: code.toUpperCase() });
    if (existingClient) {
      return res.status(400).json({ message: 'Client code already exists' });
    }
    
    // Create new client
    const client = new Client({
      name,
      code: code.toUpperCase(),
      description,
      createdBy: req.user._id
    });
    
    await client.save();
    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/clients/:id
 * @desc    Update a client
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, code, description, active } = req.body;
    
    // Find client
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Update fields
    if (name) client.name = name;
    if (description !== undefined) client.description = description;
    
    // Only admins can update code or active status
    if (req.user.role === 'admin') {
      if (code) {
        // Check if code is being used by another client
        const existingClient = await Client.findOne({ 
          code: code.toUpperCase(), 
          _id: { $ne: req.params.id } 
        });
        
        if (existingClient) {
          return res.status(400).json({ message: 'Client code already exists' });
        }
        
        client.code = code.toUpperCase();
      }
      
      if (active !== undefined) {
        client.active = active;
      }
    }
    
    await client.save();
    res.json(client);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/clients/:id
 * @desc    Delete a client
 * @access  Private (Admin only)
 */
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    await Client.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Client deleted' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;