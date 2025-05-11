// routes/jobs.js
const express = require('express');
const Job = require('../models/Job');
const Agent = require('../models/Agent');
const { authenticateToken } = require('../middleware/auth');
const agentHandler = require('../handlers/agentHandler');

const router = express.Router();

/**
 * @route   POST /api/job/submit
 * @desc    Submit a new job for execution
 * @access  Private
 */
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { agentId, script, parameters } = req.body;
    
    if (!agentId || !script) {
      return res.status(400).json({ message: 'Agent ID and script are required' });
    }
    
    // Check if agent exists and is online
    const agent = await Agent.findOne({ agentId });
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    if (agent.status !== 'online') {
      return res.status(400).json({ message: 'Agent is not online' });
    }
    
    // Create job
    const job = await agentHandler.createJob({
      agentId,
      script,
      parameters: parameters || {}
    }, req.user._id);
    
    // Send job to agent via socket
    const io = req.app.get('io');
    if (io && agent.socketId) {
      io.to(agent.socketId).emit('job:new', {
        jobId: job._id,
        script: job.script,
        parameters: job.parameters
      });
    } else {
      // Update job status if we can't send it
      job.status = 'failed';
      job.error = 'Agent is not connected via socket';
      await job.save();
      
      return res.status(400).json({ 
        message: 'Agent is not connected',
        jobId: job._id,
        status: job.status
      });
    }
    
    res.json({
      message: 'Job submitted successfully',
      jobId: job._id,
      status: job.status
    });
  } catch (error) {
    console.error('Submit job error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/job/results
 * @desc    Get job results
 * @access  Private
 */
router.get('/results', authenticateToken, async (req, res) => {
  try {
    const { jobId, limit = 20 } = req.query;
    
    // Build query
    const query = { userId: req.user._id };
    
    if (jobId) {
      query._id = jobId;
    }
    
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(jobs);
  } catch (error) {
    console.error('Get job results error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/job/:id
 * @desc    Get job by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check permissions (only creator can view)
    if (job.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this job' });
    }
    
    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/job/:id/cancel
 * @desc    Cancel a job
 * @access  Private
 */
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check permissions (only creator can cancel)
    if (job.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this job' });
    }
    
    // Can only cancel queued or running jobs
    if (!['queued', 'running'].includes(job.status)) {
      return res.status(400).json({ 
        message: `Cannot cancel job with status: ${job.status}` 
      });
    }
    
    // Update job status
    job.status = 'cancelled';
    job.completedAt = new Date();
    await job.save();
    
    // Notify agent to cancel job
    const agent = await Agent.findOne({ agentId: job.agentId });
    const io = req.app.get('io');
    
    if (io && agent && agent.socketId) {
      io.to(agent.socketId).emit('job:cancel', {
        jobId: job._id
      });
    }
    
    res.json({ message: 'Job cancelled successfully', job });
  } catch (error) {
    console.error('Cancel job error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/job/:id/results
 * @desc    Update job results (used by agent)
 * @access  Public (but requires job ID)
 */
router.put('/:id/results', async (req, res) => {
  try {
    const { agentId, success, output, error } = req.body;
    
    if (!agentId) {
      return res.status(400).json({ message: 'Agent ID is required' });
    }
    
    // Find job
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Verify agent
    if (job.agentId !== agentId) {
      return res.status(403).json({ message: 'Invalid agent for this job' });
    }
    
    // Update job status
    const updatedJob = await agentHandler.updateJobStatus(
      job._id, 
      success, 
      output, 
      error
    );
    
    // Notify via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${job.userId}`).emit('job:completed', {
        jobId: job._id,
        status: updatedJob.status,
        success
      });
    }
    
    res.json({ message: 'Job results updated successfully' });
  } catch (error) {
    console.error('Update job results error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;