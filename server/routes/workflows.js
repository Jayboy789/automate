// routes/workflows.js
const express = require('express');
const Workflow = require('../models/Workflow');
const Client = require('../models/Client');
const workflowEngine = require('../handlers/workflowEngine');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/workflows
 * @desc    Get all workflows
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { clientId, search } = req.query;
    
    // Build query
    const query = {};
    
    if (clientId) {
      query.clientId = clientId;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const workflows = await Workflow.find(query)
      .populate('clientId', 'name code')
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1 });
    
    res.json(workflows);
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/workflows/count
 * @desc    Get workflow count
 * @access  Private
 */
router.get('/count', async (req, res) => {
  try {
    const count = await Workflow.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Get workflow count error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/workflows/:id
 * @desc    Get workflow by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id)
      .populate('clientId', 'name code')
      .populate('createdBy', 'name');
    
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    res.json(workflow);
  } catch (error) {
    console.error('Get workflow error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/workflows
 * @desc    Create a new workflow
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, nodes, edges, clientId } = req.body;
    
    // Validate client if provided
    if (clientId) {
      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(400).json({ message: 'Client not found' });
      }
    }
    
    // Create new workflow
    const workflow = new Workflow({
      name,
      description,
      nodes: nodes || [],
      edges: edges || [],
      clientId: clientId || null,
      createdBy: req.user._id
    });
    
    await workflow.save();
    res.status(201).json(workflow);
  } catch (error) {
    console.error('Create workflow error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/workflows/:id
 * @desc    Update a workflow
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, description, nodes, edges, clientId, isActive } = req.body;
    
    // Find workflow
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    // Check permissions (only creator or admin can update)
    if (workflow.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this workflow' });
    }
    
    // Update client if provided
    if (clientId !== undefined) {
      if (clientId) {
        const client = await Client.findById(clientId);
        if (!client) {
          return res.status(400).json({ message: 'Client not found' });
        }
        workflow.clientId = clientId;
      } else {
        workflow.clientId = null; // Remove client association
      }
    }
    
    // Update other fields
    if (name) workflow.name = name;
    if (description !== undefined) workflow.description = description;
    if (nodes) workflow.nodes = nodes;
    if (edges) workflow.edges = edges;
    if (isActive !== undefined) workflow.isActive = isActive;
    
    workflow.updatedAt = new Date();
    
    await workflow.save();
    res.json(workflow);
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/workflows/:id
 * @desc    Delete a workflow
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    // Find workflow
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    // Check permissions (only creator or admin can delete)
    if (workflow.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this workflow' });
    }
    
    // Delete workflow
    await Workflow.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Workflow deleted' });
  } catch (error) {
    console.error('Delete workflow error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/workflows/:id/execute
 * @desc    Execute a workflow
 * @access  Private
 */
router.post('/:id/execute', async (req, res) => {
  try {
    const { agentId } = req.body;
    
    // Find workflow
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    // Check if workflow is active
    if (!workflow.isActive) {
      return res.status(400).json({ message: 'Workflow is not active' });
    }
    
    // Execute workflow
    const execution = await workflowEngine.startExecution(
      workflow._id,
      req.user._id,
      agentId
    );
    
    res.json({
      message: 'Workflow execution started',
      execution: {
        id: execution._id,
        status: execution.status,
        workflowId: execution.workflowId
      }
    });
  } catch (error) {
    console.error('Execute workflow error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/workflows/:id/clone
 * @desc    Clone a workflow
 * @access  Private
 */
router.post('/:id/clone', async (req, res) => {
  try {
    const sourceWorkflow = await Workflow.findById(req.params.id);
    if (!sourceWorkflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    // Create new workflow based on source
    const newWorkflow = new Workflow({
      name: `${sourceWorkflow.name} (Copy)`,
      description: sourceWorkflow.description,
      nodes: sourceWorkflow.nodes,
      edges: sourceWorkflow.edges,
      clientId: sourceWorkflow.clientId,
      createdBy: req.user._id
    });
    
    await newWorkflow.save();
    res.status(201).json(newWorkflow);
  } catch (error) {
    console.error('Clone workflow error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;