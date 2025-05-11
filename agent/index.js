// agent/index.js
const io = require('socket.io-client');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const readline = require('readline');

// Configuration
const CONFIG_FILE = path.join(__dirname, 'config.json');
let config = {
  agentId: null,
  agentKey: null,
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  heartbeatInterval: 30000, // 30 seconds
  autoRegister: true
};

// Job queue and state
let jobQueue = [];
let isProcessingJob = false;
let socket = null;
let isConnected = false;
let reconnectAttempts = 0;
let reconnectTimeout = null;

/**
 * Initialize the agent
 */
async function initialize() {
  // Load config if exists
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
      config = { ...config, ...JSON.parse(configData) };
      console.log('Configuration loaded from file');
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  }
  
  // Check required config
  if (!config.agentId || !config.agentKey) {
    if (config.autoRegister) {
      console.log('Agent not registered. Starting registration process...');
      await registerAgent();
    } else {
      console.log('Agent not registered. Please register first.');
      await promptRegistration();
    }
  } else {
    console.log(`Agent ID: ${config.agentId}`);
    connectToServer();
  }
}

/**
 * Connect to the server
 */
function connectToServer() {
  console.log(`Connecting to server: ${config.serverUrl}`);
  
  socket = io(config.serverUrl, {
    auth: {
      token: `agent:${config.agentId}:${config.agentKey}`
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000
  });
  
  // Connection events
  socket.on('connect', () => {
    console.log('Connected to server');
    isConnected = true;
    reconnectAttempts = 0;
    
    // Register agent with server
    socket.emit('agent:register', {
      agentId: config.agentId,
      agentKey: config.agentKey,
      platform: getPlatform(),
      version: '1.0.0'
    });
    
    // Start heartbeat
    startHeartbeat();
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    isConnected = false;
    
    // Clear heartbeat
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    reconnectAttempts++;
    
    if (reconnectAttempts > 10) {
      console.log('Maximum reconnection attempts reached. Will try again in 1 minute...');
      
      if (socket) {
        socket.disconnect();
      }
      
      clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => {
        reconnectAttempts = 0;
        connectToServer();
      }, 60000);
    }
  });
  
  // Agent events
  socket.on('agent:registered', (data) => {
    console.log(`Agent registered: ${data.agentId} (Status: ${data.status})`);
  });
  
  socket.on('agent:heartbeat:ack', (data) => {
    // console.log(`Heartbeat acknowledged: ${new Date(data.timestamp).toLocaleString()}`);
  });
  
  // Job events
  socket.on('job:new', (data) => {
    console.log(`New job received: ${data.jobId}`);
    addToJobQueue(data);
  });
  
  socket.on('job:result:ack', (data) => {
    console.log(`Job result acknowledged: ${data.jobId} (Status: ${data.status})`);
  });
  
  socket.on('job:cancel', (data) => {
    console.log(`Cancel job request: ${data.jobId}`);
    cancelJob(data.jobId);
  });
}

// Heartbeat interval
let heartbeatInterval = null;

/**
 * Start heartbeat to notify server that agent is online
 */
function startHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  // Send initial heartbeat
  sendHeartbeat();
  
  // Set up regular heartbeats
  heartbeatInterval = setInterval(() => {
    sendHeartbeat();
  }, config.heartbeatInterval);
}

/**
 * Send a heartbeat to the server
 */
function sendHeartbeat() {
  if (!isConnected || !socket) return;
  
  const systemStats = getSystemStats();
  
  socket.emit('agent:heartbeat', {
    agentId: config.agentId,
    status: 'online',
    stats: systemStats
  });
}

/**
 * Get system statistics
 * @returns {object} System stats
 */
function getSystemStats() {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  
  // Calculate CPU usage (simplified)
  const cpuUsage = process.cpuUsage();
  const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000) * 100;
  
  // Calculate memory usage
  const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
  
  return {
    hostname: os.hostname(),
    platform: getPlatform(),
    arch: os.arch(),
    cpuModel: cpus[0].model,
    cpuCount: cpus.length,
    cpuUsage: cpuPercent.toFixed(2),
    memoryTotal: Math.round(totalMem / (1024 * 1024 * 1024)),
    memoryUsage: memoryUsage.toFixed(2),
    uptime: os.uptime(),
    nodeVersion: process.version
  };
}

/**
 * Get platform name
 * @returns {string} Platform name
 */
function getPlatform() {
  const platform = os.platform();
  
  switch (platform) {
    case 'win32':
      return 'Windows';
    case 'darwin':
      return 'macOS';
    case 'linux':
      return 'Linux';
    default:
      return 'Other';
  }
}

/**
 * Add a job to the queue and process if not already processing
 * @param {object} job - Job data
 */
function addToJobQueue(job) {
  jobQueue.push(job);
  console.log(`Added job ${job.jobId} to queue. Queue length: ${jobQueue.length}`);
  
  if (!isProcessingJob) {
    processNextJob();
  }
}

/**
 * Process the next job in the queue
 */
async function processNextJob() {
  if (jobQueue.length === 0) {
    isProcessingJob = false;
    return;
  }
  
  isProcessingJob = true;
  const job = jobQueue.shift();
  console.log(`Processing job ${job.jobId}. Remaining jobs: ${jobQueue.length}`);
  
  try {
    // Execute the job
    const result = await executeScript(job.script, job.parameters);
    
    // Send result to server
    if (isConnected && socket) {
      socket.emit('job:result', {
        jobId: job.jobId,
        success: true,
        output: result.stdout,
        error: null
      });
    } else {
      console.error('Not connected to server. Cannot send job result.');
      jobQueue.unshift(job); // Put the job back at the front of the queue
      
      // Try to reconnect
      if (!isConnected && reconnectAttempts <= 10) {
        connectToServer();
      }
      
      isProcessingJob = false;
      return;
    }
  } catch (error) {
    console.error(`Error executing job ${job.jobId}:`, error);
    
    // Send error to server
    if (isConnected && socket) {
      socket.emit('job:result', {
        jobId: job.jobId,
        success: false,
        output: null,
        error: error.message || 'Script execution failed'
      });
    } else {
      console.error('Not connected to server. Cannot send job error.');
      jobQueue.unshift(job); // Put the job back at the front of the queue
      
      // Try to reconnect
      if (!isConnected && reconnectAttempts <= 10) {
        connectToServer();
      }
      
      isProcessingJob = false;
      return;
    }
  }
  
  // Process next job
  process.nextTick(processNextJob);
}

/**
 * Execute a script
 * @param {string} script - Script content
 * @param {object} parameters - Script parameters
 * @returns {Promise<object>} - Execution result
 */
async function executeScript(script, parameters) {
  // Determine script type
  let scriptToExecute = script;
  let command = '';
  
  // Check if we need to create a temporary script file
  if (script.length > 1000 || script.includes('\n')) {
    // Create a temp file based on script content
    const extension = getScriptExtension(script);
    const tempFile = path.join(os.tmpdir(), `agent-script-${Date.now()}${extension}`);
    
    fs.writeFileSync(tempFile, script);
    
    // Set execute permission on Unix systems
    if (os.platform() !== 'win32') {
      fs.chmodSync(tempFile, '755');
    }
    
    // Build command based on script type
    switch (extension) {
      case '.ps1':
        command = `powershell -ExecutionPolicy Bypass -File "${tempFile}"`;
        break;
      case '.py':
        command = `python "${tempFile}"`;
        break;
      case '.js':
        command = `node "${tempFile}"`;
        break;
      case '.sh':
        command = os.platform() === 'win32' ? `bash "${tempFile}"` : `"${tempFile}"`;
        break;
      default:
        command = `"${tempFile}"`;
    }
    
    // Add parameters if any
    if (parameters && Object.keys(parameters).length > 0) {
      // Format parameters based on script type
      const formattedParams = formatParameters(parameters, extension);
      command += ` ${formattedParams}`;
    }
    
    // Execute the command
    try {
      const result = await execAsync(command, { timeout: 300000 }); // 5-minute timeout
      
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
      return result;
    } catch (error) {
      // Clean up temp file even on error
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      
      throw error;
    }
  } else {
    // For short, simple commands, execute directly
    try {
      return await execAsync(script, { timeout: 300000 }); // 5-minute timeout
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Format script parameters based on script type
 * @param {object} parameters - Script parameters
 * @param {string} extension - Script file extension
 * @returns {string} - Formatted parameters
 */
function formatParameters(parameters, extension) {
  let formatted = '';
  
  switch (extension) {
    case '.ps1':
      // PowerShell parameters: -ParamName Value
      Object.entries(parameters).forEach(([key, value]) => {
        formatted += ` -${key} "${value}"`;
      });
      break;
    
    case '.py':
      // Python parameters: --param-name value
      Object.entries(parameters).forEach(([key, value]) => {
        formatted += ` --${key.replace(/([A-Z])/g, '-$1').toLowerCase()} "${value}"`;
      });
      break;
    
    case '.js':
      // Node parameters: --param-name=value
      Object.entries(parameters).forEach(([key, value]) => {
        formatted += ` --${key.replace(/([A-Z])/g, '-$1').toLowerCase()}="${value}"`;
      });
      break;
    
    default:
      // Default: --param-name value
      Object.entries(parameters).forEach(([key, value]) => {
        formatted += ` --${key.replace(/([A-Z])/g, '-$1').toLowerCase()} "${value}"`;
      });
  }
  
  return formatted;
}

/**
 * Determine script extension based on content
 * @param {string} script - Script content
 * @returns {string} - File extension
 */
function getScriptExtension(script) {
  // Check for PowerShell
  if (script.includes('param(') || script.includes('Write-Host') || script.includes('$PSVersionTable')) {
    return '.ps1';
  }
  
  // Check for Python
  if (script.includes('import ') || script.includes('def ') || script.includes('print(')) {
    return '.py';
  }
  
  // Check for JavaScript/Node
  if (script.includes('const ') || script.includes('function ') || script.includes('console.log(')) {
    return '.js';
  }
  
  // Check for Bash/Shell
  if (script.includes('#!/bin/bash') || script.includes('#!/bin/sh') || script.includes('echo ')) {
    return '.sh';
  }
  
  // Default to shell script
  return os.platform() === 'win32' ? '.bat' : '.sh';
}

/**
 * Cancel a job by ID
 * @param {string} jobId - Job ID to cancel
 */
function cancelJob(jobId) {
  // Remove from queue if not started
  const index = jobQueue.findIndex(job => job.jobId === jobId);
  if (index !== -1) {
    jobQueue.splice(index, 1);
    console.log(`Job ${jobId} removed from queue`);
    return;
  }
  
  // If job is currently running, we can't stop it easily
  // In a more advanced implementation, we would track child processes
  // and terminate them if needed
  console.log(`Job ${jobId} not found in queue. If running, it cannot be stopped.`);
}

/**
 * Register a new agent with the server
 */
async function registerAgent() {
  // Generate agent ID if not exists
  if (!config.agentId) {
    config.agentId = `agent-${uuidv4().split('-')[0]}`;
  }
  
  // Create a temporary socket connection for registration
  const tempSocket = io(config.serverUrl);
  
  return new Promise((resolve, reject) => {
    tempSocket.on('connect', async () => {
      console.log('Connected to server for registration');
      
      try {
        // Use HTTP endpoint for registration
        const response = await fetch(`${config.serverUrl}/api/agents/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            agentId: config.agentId,
            platform: getPlatform()
          })
        });
        
        if (!response.ok) {
          throw new Error(`Registration failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Save registration info
        config.agentId = data.agent.agentId;
        config.agentKey = data.agent.agentKey;
        
        // Save config to file
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        
        console.log(`Agent registered successfully: ${config.agentId}`);
        
        // Close temporary connection
        tempSocket.disconnect();
        
        // Connect with registered credentials
        connectToServer();
        
        resolve();
      } catch (error) {
        console.error('Registration error:', error);
        
        // Prompt for manual registration
        await promptRegistration();
        
        // Close temporary connection
        tempSocket.disconnect();
        
        resolve();
      }
    });
    
    tempSocket.on('connect_error', async (error) => {
      console.error('Connection error during registration:', error);
      
      // Prompt for manual registration
      await promptRegistration();
      
      // Close temporary connection
      tempSocket.disconnect();
      
      resolve();
    });
  });
}

/**
 * Prompt user for manual agent registration
 */
async function promptRegistration() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    console.log('\n== Manual Agent Registration ==');
    console.log('Please enter the agent credentials:');
    
    rl.question('Agent ID: ', (agentId) => {
      rl.question('Agent Key: ', (agentKey) => {
        if (agentId && agentKey) {
          config.agentId = agentId;
          config.agentKey = agentKey;
          
          // Save config to file
          fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
          
          console.log('Agent credentials saved');
          
          // Connect with provided credentials
          connectToServer();
        } else {
          console.log('Invalid credentials. Please restart the agent.');
        }
        
        rl.close();
        resolve();
      });
    });
  });
}

// Handle exit
process.on('SIGINT', () => {
  console.log('Agent shutting down...');
  
  if (socket) {
    socket.disconnect();
  }
  
  process.exit(0);
});

// Start the agent
initialize();