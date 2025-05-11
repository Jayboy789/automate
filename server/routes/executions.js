// routes/executions.js
const express = require('express');
const Execution = require('../models/Execution');
const Workflow = require('../models/Workflow');
const Job = require('../models/Job');
const workflowEngine = require('../handlers/workflowEngine');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/executions
 * @desc    Get all workflow executions
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 50, status, workflowId } = req.query;
    
    // Build query
    const query = { initiatedBy: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (workflowId) {
      query.workflowId = workflowId;
    }
    
    // Get executions with workflow details
    const executions = await Execution.find(query)
      .populate({
        path: 'workflowId',
        select: 'name clientId',
        populate: {
          path: 'clientId',
          select: 'name code'
        }
      })
      .sort({ startedAt: -1 })
      .limit(parseInt(limit));
    
    // Transform to include workflow name
    const formattedExecutions = executions.map(execution => {
      const executionObj = execution.toObject();
      
      // Add workflow name if available
      if (executionObj.workflowId) {
        executionObj.workflowName = executionObj.workflowId.name;
        executionObj.clientName = 
          executionObj.workflowId.clientId ? executionObj.workflowId.clientId.name : null;
      }
      
      return executionObj;
    });
    
    res.json(formattedExecutions);
  } catch (error) {
    console.error('Get executions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/executions/recent
 * @desc    Get recent workflow executions
 * @access  Private
 */
router.get('/recent', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Get recent executions (limited)
    const executions = await Execution.find({ initiatedBy: req.user._id })
      .populate({
        path: 'workflowId',
        select: 'name clientId',
        populate: {
          path: 'clientId',
          select: 'name code'
        }
      })
      .sort({ startedAt: -1 })
      .limit(parseInt(limit));
    
    // Transform to include workflow name
    const formattedExecutions = executions.map(execution => {
      const executionObj = execution.toObject();
      
      // Add workflow name if available
      if (executionObj.workflowId) {
        executionObj.workflowName = executionObj.workflowId.name;
        executionObj.clientName = 
          executionObj.workflowId.clientId ? executionObj.workflowId.clientId.name : null;
      }
      
      return executionObj;
    });
    
    res.json(formattedExecutions);
  } catch (error) {
    console.error('Get recent executions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/executions/:id
 * @desc    Get execution by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id)
      .populate({
        path: 'workflowId',
        select: 'name nodes edges clientId',
        populate: {
          path: 'clientId',
          select: 'name code'
        }
      });
    
    if (!execution) {
      return res.status(404).json({ message: 'Execution not found' });
    }
    
    // Check permissions (only initiator or admin can view)
    if (execution.initiatedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this execution' });
    }
    
    // Format response
    const executionObj = execution.toObject();
    
    // Add workflow name if available
    if (executionObj.workflowId) {
      executionObj.workflowName = executionObj.workflowId.name;
      executionObj.clientName = 
        executionObj.workflowId.clientId ? executionObj.workflowId.clientId.name : null;
    }
    
    res.json(executionObj);
  } catch (error) {
    console.error('Get execution error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/executions/:id/cancel
 * @desc    Cancel a running execution
 * @access  Private
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id);
    
    if (!execution) {
      return res.status(404).json({ message: 'Execution not found' });
    }
    
    // Check permissions (only initiator or admin can cancel)
    if (execution.initiatedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this execution' });
    }
    
    // Can only cancel executions that are pending or running
    if (!['pending', 'running'].includes(execution.status)) {
      return res.status(400).json({ 
        message: `Cannot cancel execution with status: ${execution.status}` 
      });
    }
    
    // Update execution status
    execution.status = 'cancelled';
    execution.completedAt = new Date();
    await execution.save();
    
    // Cancel any pending jobs for this execution
    await Job.updateMany(
      { 
        executionId: execution._id,
        status: { $in: ['queued', 'running'] }
      },
      { 
        status: 'cancelled',
        completedAt: new Date()
      }
    );
    
    // Notify about cancellation via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('execution:status', {
        id: execution._id,
        status: 'cancelled'
      });
    }
    
    res.json({ message: 'Execution cancelled successfully' });
  } catch (error) {
    console.error('Cancel execution error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/executions/:id/jobs
 * @desc    Get all jobs for an execution
 * @access  Private
 */
router.get('/:id/jobs', async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id);
    
    if (!execution) {
      return res.status(404).json({ message: 'Execution not found' });
    }
    
    // Check permissions (only initiator or admin can view)
    if (execution.initiatedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this execution' });
    }
    
    // Get jobs for this execution
    const jobs = await Job.find({ executionId: execution._id })
      .sort({ createdAt: 1 });
    
    res.json(jobs);
  } catch (error) {
    console.error('Get execution jobs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/executions/:id/rerun
 * @desc    Rerun a workflow execution
 * @access  Private
 */
router.post('/:id/rerun', async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id);
    
    if (!execution) {
      return res.status(404).json({ message: 'Execution not found' });
    }
    
    // Check permissions (only initiator or admin can rerun)
    if (execution.initiatedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to rerun this execution' });
    }
    
    // Start a new execution of the same workflow
    const newExecution = await workflowEngine.startExecution(
      execution.workflowId,
      req.user._id,
      req.body.agentId || execution.agentId
    );
    
    res.json({
      message: 'Workflow execution started',
      execution: {
        id: newExecution._id,
        status: newExecution.status,
        workflowId: newExecution.workflowId
      }
    });
  } catch (error) {
    console.error('Rerun execution error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/executions/:id
 * @desc    Delete an execution record
 * @access  Private (Admin only)
 */
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id);
    
    if (!execution) {
      return res.status(404).json({ message: 'Execution not found' });
    }
    
    // Delete execution and related jobs
    await Job.deleteMany({ executionId: execution._id });
    await Execution.findByIdAndDelete(execution._id);
    
    res.json({ message: 'Execution deleted successfully' });
  } catch (error) {
    console.error('Delete execution error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;