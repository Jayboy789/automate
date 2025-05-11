// handlers/agentHandler.js
const { Agent, Job, Workflow, Execution } = require('../models/index');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const workflowEngine = require('./workflowEngine');

const agentHandler = {
  /**
   * Register a new agent or update an existing one
   * @param {string} agentId - Unique identifier for the agent
   * @param {string} agentKey - Security key for the agent
   * @param {string} socketId - Socket.io connection ID
   * @returns {Promise<Agent>} - The registered agent
   */
  async registerAgent(agentId, agentKey, socketId) {
    // Check if agent exists
    let agent = await Agent.findOne({ agentId });
    
    if (agent) {
      // Verify agent key
      if (agent.agentKey !== agentKey) {
        throw new Error('Invalid agent key');
      }
      
      // Update agent info
      agent.status = 'online';
      agent.lastSeen = new Date();
      agent.socketId = socketId;
      await agent.save();
      
      return agent;
    } else {
      // Create new agent
      const newAgent = new Agent({
        agentId,
        agentKey,
        status: 'online',
        lastSeen: new Date(),
        socketId
      });
      
      await newAgent.save();
      return newAgent;
    }
  },
  
  /**
   * Update agent status
   * @param {string} agentId - Agent identifier
   * @param {string} status - New status ('online', 'offline', 'error')
   * @param {object} stats - Optional system stats
   */
  async updateAgentStatus(agentId, status, stats = {}) {
    const agent = await Agent.findOne({ agentId });
    if (!agent) {
      throw new Error('Agent not found');
    }
    
    agent.status = status;
    agent.lastSeen = new Date();
    
    if (stats.cpuUsage !== undefined) {
      agent.cpuUsage = stats.cpuUsage;
    }
    
    if (stats.memoryUsage !== undefined) {
      agent.memoryUsage = stats.memoryUsage;
    }
    
    if (stats.platform) {
      agent.platform = stats.platform;
    }
    
    if (stats.version) {
      agent.version = stats.version;
    }
    
    await agent.save();
    return agent;
  },
  
  /**
   * Find an available agent
   * @param {string} specificAgentId - Optional specific agent to use
   * @returns {Promise<Agent>} - Available agent
   */
  async findAvailableAgent(specificAgentId = null) {
    let query = { status: 'online' };
    
    if (specificAgentId) {
      query.agentId = specificAgentId;
    }
    
    // Find an agent that is online
    const agent = await Agent.findOne(query);
    
    if (!agent) {
      if (specificAgentId) {
        throw new Error(`Specified agent ${specificAgentId} is not available`);
      } else {
        throw new Error('No agents available');
      }
    }
    
    return agent;
  },
  
  /**
   * Create a new job for an agent
   * @param {object} jobData - Job data including script and parameters
   * @param {string} userId - ID of the user creating the job
   * @returns {Promise<Job>} - Created job
   */
  async createJob(jobData, userId) {
    const job = new Job({
      agentId: jobData.agentId,
      script: jobData.script,
      parameters: jobData.parameters || {},
      userId,
      status: 'queued',
      createdAt: new Date()
    });
    
    await job.save();
    return job;
  },
  
  /**
   * Update job status with results
   * @param {string} jobId - Job identifier
   * @param {boolean} success - Whether job succeeded
   * @param {string} output - Job output
   * @param {string} error - Error message if job failed
   * @returns {Promise<Job>} - Updated job
   */
  async updateJobStatus(jobId, success, output, error) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    
    job.status = success ? 'completed' : 'failed';
    job.output = output;
    job.error = error;
    job.completedAt = new Date();
    
    await job.save();
    
    // If this job is part of a workflow execution, update the workflow
    if (job.executionId) {
      const execution = await Execution.findById(job.executionId);
      if (execution) {
        // Add a log entry
        execution.logs.push({
          nodeId: job.nodeId,
          timestamp: new Date(),
          message: success ? 'Node execution completed' : `Node execution failed: ${error}`,
          type: success ? 'info' : 'error'
        });
        
        // Check if this is the final node or if error should stop workflow
        if (!success && !job.continueOnError) {
          execution.status = 'failed';
          execution.completedAt = new Date();
          execution.error = {
            message: error,
            nodeId: job.nodeId
          };
        } else {
          // Check if workflow is complete
          const pendingJobs = await Job.countDocuments({ 
            executionId: job.executionId, 
            status: { $in: ['queued', 'running'] } 
          });
          
          if (pendingJobs === 0) {
            execution.status = 'completed';
            execution.completedAt = new Date();
          }
        }
        
        await execution.save();
        
        // Continue workflow execution if needed
        if (execution.status !== 'completed' && execution.status !== 'failed') {
          await workflowEngine.continueExecution(execution);
        }
      }
    }
    
    return job;
  },
  
  /**
   * Generate a new agent key for registration
   * @returns {string} - New agent key
   */
  generateAgentKey() {
    return crypto.randomBytes(32).toString('hex');
  },
  
  /**
   * Get all registered agents
   * @returns {Promise<Array>} - List of agents
   */
  async getAllAgents() {
    return Agent.find().sort({ lastSeen: -1 });
  },
  
  /**
   * Delete an agent
   * @param {string} agentId - Agent identifier
   * @returns {Promise<boolean>} - Success status
   */
  async deleteAgent(agentId) {
    const result = await Agent.deleteOne({ agentId });
    return result.deletedCount > 0;
  }
};

module.exports = agentHandler;