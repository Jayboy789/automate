// AutoMate Agent - Node.js implementation
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const io = require('socket.io-client');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const CONFIG = {
  agentId: process.env.AGENT_ID || `agent-${uuidv4().slice(0, 8)}`,
  agentKey: process.env.AGENT_KEY || '',
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '30000'),
  scriptDir: process.env.SCRIPT_DIR || path.join(__dirname, 'scripts'),
  logDir: process.env.LOG_DIR || path.join(__dirname, 'logs'),
  platform: process.env.AGENT_PLATFORM || os.platform(),
  version: process.env.AGENT_VERSION || '1.0.0'
};

// Ensure script and log directories exist
if (!fs.existsSync(CONFIG.scriptDir)) {
  fs.mkdirSync(CONFIG.scriptDir, { recursive: true });
}

if (!fs.existsSync(CONFIG.logDir)) {
  fs.mkdirSync(CONFIG.logDir, { recursive: true });
}

// Logger
const logger = {
  info: (message) => {
    const logMessage = `[INFO] ${new Date().toISOString()} - ${message}`;
    console.log(logMessage);
    appendToLog(logMessage);
  },
  error: (message, error) => {
    const logMessage = `[ERROR] ${new Date().toISOString()} - ${message} ${error ? '- ' + error.toString() : ''}`;
    console.error(logMessage);
    appendToLog(logMessage);
  },
  warn: (message) => {
    const logMessage = `[WARN] ${new Date().toISOString()} - ${message}`;
    console.warn(logMessage);
    appendToLog(logMessage);
  }
};

// Append to log file
function appendToLog(message) {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const logFile = path.join(CONFIG.logDir, `agent-${date}.log`);
  
  fs.appendFile(logFile, message + '\n', (err) => {
    if (err) console.error('Error writing to log file:', err);
  });
}

// Connect to server
let socket;
let heartbeatInterval;
let connected = false;

async function connectToServer() {
  try {
    // Register agent with server
    logger.info(`Registering agent ${CONFIG.agentId} with server...`);
    
    const response = await axios.post(`${CONFIG.serverUrl}/api/agents/register`, {
      agentId: CONFIG.agentId,
      agentKey: CONFIG.agentKey,
      platform: CONFIG.platform,
      version: CONFIG.version
    });
    
    if (response.status !== 200) {
      throw new Error('Registration failed: ' + response.data.message);
    }
    
    logger.info('Agent registered successfully');
    
    // Connect socket
    socket = io(CONFIG.serverUrl, {
      auth: {
        agentId: CONFIG.agentId,
        agentKey: CONFIG.agentKey
      }
    });
    
    // Socket event handlers
    socket.on('connect', () => {
      connected = true;
      logger.info('Socket connected, ID: ' + socket.id);
      
      // Send agent:connect event with agent ID
      socket.emit('agent:connect', CONFIG.agentId);
      
      // Start heartbeat
      startHeartbeat();
    });
    
    socket.on('disconnect', () => {
      connected = false;
      logger.warn('Socket disconnected');
      
      // Stop heartbeat
      clearInterval(heartbeatInterval);
      
      // Try to reconnect after a delay
      setTimeout(connectToServer, 5000);
    });
    
    socket.on('error', (error) => {
      logger.error('Socket error', error);
    });
    
    // Handle job requests
    socket.on('job:new', async (job) => {
      logger.info(`Received new job: ${job.jobId}`);
      executeJob(job);
    });
    
    // Handle job cancellation
    socket.on('job:cancel', (job) => {
      logger.info(`Received job cancellation: ${job.jobId}`);
      // Implement job cancellation logic here
    });
    
  } catch (error) {
    logger.error('Error connecting to server', error);
    
    // Try to reconnect after a delay
    setTimeout(connectToServer, 5000);
  }
}

// Execute job
async function executeJob(job) {
  const { jobId, script, parameters } = job;
  
  logger.info(`Executing job ${jobId}`);
  
  try {
    // Create script file
    const scriptFile = path.join(CONFIG.scriptDir, `job-${jobId}.ps1`);
    fs.writeFileSync(scriptFile, script);
    
    // Determine script type and executor based on content or parameters
    let executor, args;
    
    if (script.trim().startsWith('#!')) {
      // Extract shebang
      const shebang = script.trim().split('\n')[0].substring(2).trim();
      if (shebang.includes('python')) {
        executor = 'python';
        args = [scriptFile];
      } else if (shebang.includes('node')) {
        executor = 'node';
        args = [scriptFile];
      } else if (shebang.includes('bash') || shebang.includes('sh')) {
        executor = 'bash';
        args = [scriptFile];
      } else {
        // Default to PowerShell
        executor = os.platform() === 'win32' ? 'powershell.exe' : 'pwsh';
        args = ['-File', scriptFile];
      }
    } else {
      // Default to PowerShell
      executor = os.platform() === 'win32' ? 'powershell.exe' : 'pwsh';
      args = ['-File', scriptFile];
    }
    
    logger.info(`Using executor: ${executor} ${args.join(' ')}`);
    
    // Execute script
    const process = spawn(executor, args);
    
    let output = '';
    let error = '';
    
    process.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      logger.info(`[Job ${jobId}] Output: ${text.trim()}`);
    });
    
    process.stderr.on('data', (data) => {
      const text = data.toString();
      error += text;
      logger.error(`[Job ${jobId}] Error: ${text.trim()}`);
    });
    
    process.on('error', (err) => {
      logger.error(`Error executing job ${jobId}`, err);
      reportJobResult(jobId, false, output, err.toString());
    });
    
    process.on('close', (code) => {
      logger.info(`Job ${jobId} completed with exit code ${code}`);
      
      // Clean up script file
      fs.unlink(scriptFile, (err) => {
        if (err) logger.error(`Error removing script file for job ${jobId}`, err);
      });
      
      // Report job result
      reportJobResult(jobId, code === 0, output, error);
    });
    
  } catch (error) {
    logger.error(`Error preparing job ${jobId}`, error);
    reportJobResult(jobId, false, '', error.toString());
  }
}

// Report job result to server
async function reportJobResult(jobId, success, output, error) {
  try {
    await axios.put(`${CONFIG.serverUrl}/api/job/${jobId}/results`, {
      agentId: CONFIG.agentId,
      success,
      output,
      error
    });
    
    logger.info(`Reported results for job ${jobId}`);
  } catch (error) {
    logger.error(`Error reporting results for job ${jobId}`, error);
    
    // Store result locally for retry
    const resultFile = path.join(CONFIG.logDir, `job-${jobId}-result.json`);
    
    try {
      fs.writeFileSync(resultFile, JSON.stringify({
        jobId,
        agentId: CONFIG.agentId,
        success,
        output,
        error,
        timestamp: new Date().toISOString()
      }));
      
      logger.info(`Stored job ${jobId} result locally for retry`);
    } catch (err) {
      logger.error(`Error storing job ${jobId} result locally`, err);
    }
  }
}

// Start heartbeat interval
function startHeartbeat() {
  // Clear existing interval if any
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  // Start new interval
  heartbeatInterval = setInterval(async () => {
    try {
      // Get system stats
      const stats = {
        cpuUsage: process.cpuUsage(),
        memoryUsage: process.memoryUsage(),
        platform: CONFIG.platform,
        version: CONFIG.version
      };
      
      // Send heartbeat
      const response = await axios.post(`${CONFIG.serverUrl}/api/agents/heartbeat`, {
        agentId: CONFIG.agentId,
        status: 'online',
        stats
      });
      
      logger.info('Heartbeat sent successfully');
    } catch (error) {
      logger.error('Error sending heartbeat', error);
      
      // If we can't reach the server for a while, try to reconnect
      if (!connected) {
        clearInterval(heartbeatInterval);
        connectToServer();
      }
    }
  }, CONFIG.heartbeatInterval);
  
  logger.info(`Heartbeat started (interval: ${CONFIG.heartbeatInterval}ms)`);
}

// Check for unfinished jobs
function checkUnfinishedJobs() {
  logger.info('Checking for unfinished jobs...');
  
  try {
    // Find result files in the log directory
    const resultFiles = fs.readdirSync(CONFIG.logDir).filter(file => 
      file.startsWith('job-') && file.endsWith('-result.json')
    );
    
    logger.info(`Found ${resultFiles.length} unfinished job(s)`);
    
    // Try to send results for each unfinished job
    resultFiles.forEach(async (file) => {
      try {
        const resultPath = path.join(CONFIG.logDir, file);
        const resultData = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
        
        // Try to report result
        await axios.put(`${CONFIG.serverUrl}/api/job/${resultData.jobId}/results`, {
          agentId: resultData.agentId,
          success: resultData.success,
          output: resultData.output,
          error: resultData.error
        });
        
        logger.info(`Reported results for unfinished job ${resultData.jobId}`);
        
        // Remove result file
        fs.unlinkSync(resultPath);
      } catch (error) {
        logger.error(`Error retrying result for job in file ${file}`, error);
      }
    });
  } catch (error) {
    logger.error('Error checking unfinished jobs', error);
  }
}

// Initialize agent
async function initAgent() {
  logger.info(`AutoMate Agent starting...`);
  logger.info(`Agent ID: ${CONFIG.agentId}`);
  logger.info(`Platform: ${CONFIG.platform}`);
  logger.info(`Version: ${CONFIG.version}`);
  
  // Check for unfinished jobs
  checkUnfinishedJobs();
  
  // Connect to server
  await connectToServer();
}

// Catch unhandled errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', reason);
});

// Start agent
initAgent();

// Graceful shutdown
function gracefulShutdown() {
  logger.info('Agent shutting down...');
  
  // Stop heartbeat
  clearInterval(heartbeatInterval);
  
  // Disconnect socket
  if (socket) {
    socket.disconnect();
  }
  
  // Exit process
  process.exit(0);
}

// Listen for shutdown signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);