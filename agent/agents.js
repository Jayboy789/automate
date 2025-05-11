// routes/agents.js
const express = require('express');
const { Agent } = require('../models/index');
const { isAdmin } = require('../middleware/auth');
const agentHandler = require('../handlers/agentHandler');
const fs = require('fs');
const path = require('path');

const router = express.Router();

/**
 * @route   GET /api/agents
 * @desc    Get all agents
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const agents = await agentHandler.getAllAgents();
    res.json(agents);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/agents/register
 * @desc    Register a new agent (used by agent software)
 * @access  Public (but requires agent key)
 */
router.post('/register', async (req, res) => {
  try {
    const { agentId, agentKey, platform, version } = req.body;
    
    if (!agentId || !agentKey) {
      return res.status(400).json({ message: 'Agent ID and key are required' });
    }
    
    // Register agent (or update if exists)
    const agent = await agentHandler.registerAgent(
      agentId, 
      agentKey, 
      req.socket.id || null, // Socket ID if available
      { platform, version }
    );
    
    res.json({
      message: 'Agent registered successfully',
      agent: {
        agentId: agent.agentId,
        status: agent.status,
        platform: agent.platform,
        version: agent.version
      }
    });
  } catch (error) {
    console.error('Register agent error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/agents/heartbeat
 * @desc    Update agent heartbeat status
 * @access  Public (but requires agent ID)
 */
router.post('/heartbeat', async (req, res) => {
  try {
    const { agentId, status, stats } = req.body;
    
    if (!agentId) {
      return res.status(400).json({ message: 'Agent ID is required' });
    }
    
    // Update agent status
    const agent = await agentHandler.updateAgentStatus(agentId, status || 'online', stats || {});
    
    res.json({
      message: 'Heartbeat received',
      agent: {
        agentId: agent.agentId,
        status: agent.status
      }
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/agents/create
 * @desc    Create a new agent (server-side)
 * @access  Private (Admin only)
 */
router.post('/create', async (req, res) => {
  try {
    const { name, platform } = req.body;
    
    // Generate unique agent ID and key
    const agentId = `agent-${Date.now().toString(36)}`;
    const agentKey = agentHandler.generateAgentKey();
    
    // Create agent
    const agent = new Agent({
      agentId,
      agentKey,
      name: name || `Agent-${agentId.substr(6, 6)}`,
      platform: platform || 'Other',
      status: 'offline'
    });
    
    await agent.save();
    
    res.status(201).json({
      message: 'Agent created successfully',
      agent: {
        agentId: agent.agentId,
        agentKey: agent.agentKey, // Only return key on creation
        name: agent.name,
        platform: agent.platform,
        status: agent.status
      }
    });
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/agents/:id
 * @desc    Get agent by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const agent = await Agent.findOne({ agentId: req.params.id });
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    // Don't return sensitive info
    const safeAgent = {
      agentId: agent.agentId,
      name: agent.name,
      platform: agent.platform,
      version: agent.version,
      status: agent.status,
      lastSeen: agent.lastSeen,
      cpuUsage: agent.cpuUsage,
      memoryUsage: agent.memoryUsage,
      createdAt: agent.createdAt
    };
    
    res.json(safeAgent);
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/agents/:id
 * @desc    Delete an agent
 * @access  Private (Admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await agentHandler.deleteAgent(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/agents/:id/regenerate-key
 * @desc    Regenerate agent key
 * @access  Private (Admin only)
 */
router.post('/:id/regenerate-key', async (req, res) => {
  try {
    const agent = await Agent.findOne({ agentId: req.params.id });
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    // Generate new key
    agent.agentKey = agentHandler.generateAgentKey();
    await agent.save();
    
    res.json({
      message: 'Agent key regenerated',
      agent: {
        agentId: agent.agentId,
        agentKey: agent.agentKey
      }
    });
  } catch (error) {
    console.error('Regenerate agent key error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/agents/download/:platform
 * @desc    Download agent installer for specified platform
 * @access  Private
 */
router.get('/download/:platform', async (req, res) => {
  try {
    const platform = req.params.platform.toLowerCase();
    let filePath;
    
    // Create downloads directory if it doesn't exist
    const downloadsDir = path.join(__dirname, '../downloads/agent');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
    
    // Determine file path based on platform
    switch (platform) {
      case 'windows':
        filePath = path.join(downloadsDir, 'automate-agent-win.zip');
        // Generate Windows agent package if it doesn't exist
        if (!fs.existsSync(filePath)) {
          // In a production environment, you would have pre-built binaries
          // For now, create a placeholder
          const placeholderContent = `
            # AutoMate Agent for Windows
            # Created: ${new Date().toISOString()}
            
            This is a placeholder for the Windows agent installer.
            In a production environment, this would be a properly packaged Windows executable.
          `;
          fs.writeFileSync(filePath, placeholderContent);
        }
        break;
      case 'linux':
        filePath = path.join(downloadsDir, 'automate-agent-linux.tar.gz');
        // Generate Linux agent package if it doesn't exist
        if (!fs.existsSync(filePath)) {
          // In a production environment, you would have pre-built binaries
          // For now, create a placeholder
          const placeholderContent = `
            # AutoMate Agent for Linux
            # Created: ${new Date().toISOString()}
            
            This is a placeholder for the Linux agent installer.
            In a production environment, this would be a properly packaged Linux binary.
          `;
          fs.writeFileSync(filePath, placeholderContent);
        }
        break;
      case 'macos':
        filePath = path.join(downloadsDir, 'automate-agent-macos.zip');
        // Generate macOS agent package if it doesn't exist
        if (!fs.existsSync(filePath)) {
          // In a production environment, you would have pre-built binaries
          // For now, create a placeholder
          const placeholderContent = `
            # AutoMate Agent for macOS
            # Created: ${new Date().toISOString()}
            
            This is a placeholder for the macOS agent installer.
            In a production environment, this would be a properly packaged macOS application.
          `;
          fs.writeFileSync(filePath, placeholderContent);
        }
        break;
      case 'docker':
        // Return Docker instructions
        return res.json({
          message: 'Docker agent',
          instructions: `
# Run the AutoMate agent in Docker
docker run -d \\
  --name automate-agent \\
  -e AGENT_ID=your-agent-id \\
  -e AGENT_KEY=your-agent-key \\
  -e SERVER_URL=${process.env.SERVER_URL || 'http://localhost:5000'} \\
  automate/agent:latest
          `
        });
      default:
        return res.status(400).json({ message: 'Unsupported platform' });
    }
    
    // Send file
    res.download(filePath);
  } catch (error) {
    console.error('Download agent error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;