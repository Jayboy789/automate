// socket/socketHandlers.js
const { Agent, Job, Execution } = require('../models/index');
const agentHandler = require('../handlers/agentHandler');

/**
 * Set up all socket event handlers
 * @param {SocketIO.Server} io - Socket.io server instance
 */
const setupSocketHandlers = (io) => {
  // Store io instance for use in routes
  io.app = io.app || {};
  io.app.get = io.app.get || ((key) => io.app[key]);
  io.app.set = io.app.set || ((key, value) => { io.app[key] = value; });
  io.app.set('io', io);
  
  // Connection event
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Store user info from auth middleware
    const user = socket.user;
    if (user) {
      console.log(`Authenticated user connected: ${user.name} (${user._id})`);
      socket.join(`user:${user._id}`); // Add to user-specific room
    }
    
    // Handle agent registration
    socket.on('agent:register', async (data) => {
      try {
        const { agentId, agentKey, platform, version } = data;
        
        if (!agentId || !agentKey) {
          return socket.emit('error', { message: 'Agent ID and key are required' });
        }
        
        // Register agent
        const agent = await agentHandler.registerAgent(
          agentId, 
          agentKey, 
          socket.id,
          { platform, version }
        );
        
        // Associate socket with agent
        socket.agentId = agentId;
        socket.join(`agent:${agentId}`);
        
        // Send confirmation
        socket.emit('agent:registered', {
          agentId: agent.agentId,
          status: agent.status
        });
        
        // Broadcast agent status change
        io.emit('agent:status', {
          agentId: agent.agentId,
          status: agent.status,
          lastSeen: agent.lastSeen
        });
        
        console.log(`Agent registered: ${agentId}`);
        
        // Check for pending jobs for this agent
        const pendingJobs = await Job.find({
          agentId: agentId,
          status: 'queued'
        });
        
        // Send pending jobs to agent
        if (pendingJobs.length > 0) {
          console.log(`Sending ${pendingJobs.length} pending jobs to agent ${agentId}`);
          
          pendingJobs.forEach(job => {
            socket.emit('job:new', {
              jobId: job._id,
              script: job.script,
              parameters: job.parameters
            });
          });
        }
      } catch (error) {
        console.error('Agent registration error:', error);
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle agent heartbeat
    socket.on('agent:heartbeat', async (data) => {
      try {
        const { agentId, status, stats } = data;
        
        if (!agentId) {
          return socket.emit('error', { message: 'Agent ID is required' });
        }
        
        // Update agent status
        const agent = await agentHandler.updateAgentStatus(
          agentId, 
          status || 'online', 
          stats || {}
        );
        
        // Confirm heartbeat
        socket.emit('agent:heartbeat:ack', {
          agentId: agent.agentId,
          status: agent.status,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Agent heartbeat error:', error);
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle job result
    socket.on('job:result', async (data) => {
      try {
        const { jobId, success, output, error } = data;
        
        if (!jobId) {
          return socket.emit('error', { message: 'Job ID is required' });
        }
        
        // Update job status
        const job = await agentHandler.updateJobStatus(jobId, success, output, error);
        
        // Confirm result received
        socket.emit('job:result:ack', {
          jobId: job._id,
          status: job.status
        });
        
        // Broadcast job completion
        io.emit('job:completed', {
          jobId: job._id,
          agentId: job.agentId,
          success,
          status: job.status,
          completedAt: job.completedAt
        });
        
        // If part of a workflow execution, broadcast execution status
        if (job.executionId) {
          const execution = await Execution.findById(job.executionId);
          if (execution) {
            io.emit('execution:status', {
              id: execution._id,
              status: execution.status,
              completedAt: execution.completedAt
            });
          }
        }
      } catch (error) {
        console.error('Job result error:', error);
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle workflow execution status update
    socket.on('execution:update', async (data) => {
      try {
        const { executionId, status, nodeId, message, type } = data;
        
        if (!executionId) {
          return socket.emit('error', { message: 'Execution ID is required' });
        }
        
        // Find the execution
        const execution = await Execution.findById(executionId);
        if (!execution) {
          return socket.emit('error', { message: 'Execution not found' });
        }
        
        // Update status if provided
        if (status) {
          execution.status = status;
          
          // Set completion time if terminal status
          if (['completed', 'failed', 'cancelled'].includes(status)) {
            execution.completedAt = new Date();
          }
        }
        
        // Add log entry if provided
        if (nodeId && message) {
          execution.logs.push({
            nodeId,
            timestamp: new Date(),
            message,
            type: type || 'info'
          });
        }
        
        await execution.save();
        
        // Broadcast execution status update
        io.emit('execution:status', {
          id: execution._id,
          status: execution.status,
          completedAt: execution.completedAt
        });
      } catch (error) {
        console.error('Execution update error:', error);
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // If this was an agent, update its status
      if (socket.agentId) {
        try {
          const agent = await Agent.findOne({ agentId: socket.agentId });
          if (agent) {
            agent.status = 'offline';
            agent.socketId = null;
            await agent.save();
            
            // Broadcast agent status change
            io.emit('agent:status', {
              agentId: agent.agentId,
              status: agent.status,
              lastSeen: agent.lastSeen
            });
            
            console.log(`Agent ${socket.agentId} marked as offline`);
          }
        } catch (error) {
          console.error('Error handling agent disconnect:', error);
        }
      }
    });
  });
};

module.exports = { setupSocketHandlers };</parameter>
<parameter name="language">javascript</parameter>
</invoke>