// routes/scripts.js
const express = require('express');
const Script = require('../models/Script');
const Client = require('../models/Client');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/scripts
 * @desc    Get all scripts
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { clientId, search, language } = req.query;
    
    // Build query
    const query = {};
    
    // Include public scripts or scripts for specified client
    if (clientId) {
      query.$or = [
        { clientId },
        { isPublic: true }
      ];
    }
    
    // Add language filter
    if (language) {
      query.language = language;
    }
    
    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const scripts = await Script.find(query)
      .populate('clientId', 'name code')
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1 });
    
    res.json(scripts);
  } catch (error) {
    console.error('Get scripts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/scripts/count
 * @desc    Get script count
 * @access  Private
 */
router.get('/count', async (req, res) => {
  try {
    const count = await Script.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Get script count error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/scripts/:id
 * @desc    Get script by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const script = await Script.findById(req.params.id)
      .populate('clientId', 'name code')
      .populate('createdBy', 'name');
    
    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }
    
    res.json(script);
  } catch (error) {
    console.error('Get script error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/scripts
 * @desc    Create a new script
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      content, 
      language = 'PowerShell', 
      tags = [], 
      clientId, 
      isPublic = false 
    } = req.body;
    
    // Validate client if provided
    if (clientId) {
      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(400).json({ message: 'Client not found' });
      }
    }
    
    // Create new script
    const script = new Script({
      name,
      description,
      content,
      language,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
      clientId: clientId || null,
      isPublic,
      createdBy: req.user._id
    });
    
    await script.save();
    res.status(201).json(script);
  } catch (error) {
    console.error('Create script error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/scripts/:id
 * @desc    Update a script
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      content, 
      language, 
      tags, 
      clientId, 
      isPublic 
    } = req.body;
    
    // Find script
    const script = await Script.findById(req.params.id);
    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }
    
    // Check permissions (only creator or admin can update)
    if (script.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this script' });
    }
    
    // Update fields
    if (name) script.name = name;
    if (description !== undefined) script.description = description;
    if (content) script.content = content;
    if (language) script.language = language;
    
    if (tags) {
      script.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    }
    
    // Update client if provided
    if (clientId !== undefined) {
      if (clientId) {
        const client = await Client.findById(clientId);
        if (!client) {
          return res.status(400).json({ message: 'Client not found' });
        }
        script.clientId = clientId;
      } else {
        script.clientId = null; // Remove client association
      }
    }
    
    if (isPublic !== undefined) script.isPublic = isPublic;
    
    // Increment version
    script.version += 1;
    script.updatedAt = new Date();
    
    await script.save();
    res.json(script);
  } catch (error) {
    console.error('Update script error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/scripts/:id
 * @desc    Delete a script
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    // Find script
    const script = await Script.findById(req.params.id);
    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }
    
    // Check permissions (only creator or admin can delete)
    if (script.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this script' });
    }
    
    // Delete script
    await Script.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Script deleted' });
  } catch (error) {
    console.error('Delete script error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/scripts/:id/clone
 * @desc    Clone a script
 * @access  Private
 */
router.post('/:id/clone', async (req, res) => {
  try {
    const sourceScript = await Script.findById(req.params.id);
    if (!sourceScript) {
      return res.status(404).json({ message: 'Script not found' });
    }
    
    // Create new script based on source
    const newScript = new Script({
      name: `${sourceScript.name} (Copy)`,
      description: sourceScript.description,
      content: sourceScript.content,
      language: sourceScript.language,
      tags: sourceScript.tags,
      clientId: sourceScript.clientId,
      isPublic: false, // Default to private for cloned scripts
      createdBy: req.user._id
    });
    
    await newScript.save();
    res.status(201).json(newScript);
  } catch (error) {
    console.error('Clone script error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;