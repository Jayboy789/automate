const { app, BrowserWindow, Tray, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const { v4: uuidv4 } = require('uuid');
const Store = require('electron-store');
const log = require('electron-log');
const si = require('systeminformation');

// Local modules
const { SocketManager } = require('./services/socket');
const { ScriptExecutor } = require('./services/scriptExecutor');

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
log.info('Application starting...');

// Configure storage
const store = new Store({
  name: 'agent-config',
  defaults: {
    agentId: `agent-${uuidv4()}`,
    serverUrl: 'http://localhost:5000',
    name: `Agent-${uuidv4().substring(0, 8)}`,
    platform: process.platform
  }
});

// Global references
let mainWindow = null;
let tray = null;
let socketManager = null;
let scriptExecutor = null;
let isQuitting = false;

// System stats variables
let cpuUsage = 0;
let memoryUsage = 0;
let statsInterval = null;

// Create the main window
const createWindow = () => {
  log.info('Creating main window');
  
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../resources/icon.png')
  });
  
  // Load the main HTML file
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
  
  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
  
  // Handle window close
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });
  
  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// Create system tray
const createTray = () => {
  log.info('Creating system tray');
  
  // Use platform-specific icon
  const iconPath = path.join(__dirname, '../resources/tray-icon.png');
  
  tray = new Tray(iconPath);
  tray.setToolTip('AutoMate Agent');
  
  updateTrayMenu();
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    } else {
      createWindow();
    }
  });
};

// Update tray menu with connection status
const updateTrayMenu = (status = 'disconnected') => {
  if (!tray) return;
  
  const agentId = store.get('agentId');
  const serverUrl = store.get('serverUrl');
  
  const contextMenu = Menu.buildFromTemplate([
    { label: `AutoMate Agent (${agentId.substring(0, 8)})`, enabled: false },
    { type: 'separator' },
    {
      label: `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      icon: path.join(__dirname, `../resources/${status}-icon.png`),
      enabled: false
    },
    { label: `Server: ${serverUrl}`, enabled: false },
    { type: 'separator' },
    {
      label: 'Show Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Reconnect',
      click: () => {
        if (socketManager) {
          socketManager.reconnect();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
};

// Initialize services
const initializeServices = () => {
  log.info('Initializing services');
  
  // Create script executor
  scriptExecutor = new ScriptExecutor();
  
  // Create socket manager
  socketManager = new SocketManager({
    serverUrl: store.get('serverUrl'),
    agentId: store.get('agentId'),
    agentKey: store.get('agentKey')
  });
  
  // Socket event handlers
  socketManager.on('connect', () => {
    log.info('Connected to server');
    updateTrayMenu('connected');
    
    if (mainWindow) {
      mainWindow.webContents.send('connection-status', {
        status: 'connected',
        serverUrl: store.get('serverUrl')
      });
    }
  });
  
  socketManager.on('disconnect', () => {
    log.info('Disconnected from server');
    updateTrayMenu('disconnected');
    
    if (mainWindow) {
      mainWindow.webContents.send('connection-status', {
        status: 'disconnected',
        serverUrl: store.get('serverUrl')
      });
    }
  });
  
  socketManager.on('registered', (data) => {
    log.info('Agent registered:', data);
    
    // Save agent key if provided
    if (data.agentKey) {
      store.set('agentKey', data.agentKey);
      log.info('Agent key saved');
    }
    
    if (mainWindow) {
      mainWindow.webContents.send('agent-registered', {
        agentId: store.get('agentId'),
        status: data.status
      });
    }
  });
  
  socketManager.on('job', async (job) => {
    log.info('Received job:', job.jobId);
    
    if (mainWindow) {
      mainWindow.webContents.send('job-received', job);
    }
    
    try {
      // Extract script language from job data or use default
      const language = job.language || 'PowerShell';
      
      // Execute the script
      const result = await scriptExecutor.execute(job.script, job.parameters, language);
      
      log.info('Job completed successfully:', job.jobId);
      
      // Send success result back to server
      socketManager.sendJobResult(job.jobId, true, result);
      
      if (mainWindow) {
        mainWindow.webContents.send('job-completed', {
          jobId: job.jobId,
          success: true,
          output: result
        });
      }
    } catch (error) {
      log.error('Job execution failed:', error);
      
      // Send error result back to server
      socketManager.sendJobResult(job.jobId, false, null, error.message || 'Job execution failed');
      
      if (mainWindow) {
        mainWindow.webContents.send('job-completed', {
          jobId: job.jobId,
          success: false,
          error: error.message || 'Job execution failed'
        });
      }
    }
  });
  
  // Connect to server
  socketManager.connect();
};

// Collect and report system stats
const startSystemStats = () => {
  log.info('Starting system stats collection');
  
  const updateStats = async () => {
    try {
      // Get CPU usage
      const cpuLoad = await si.currentLoad();
      cpuUsage = Math.round(cpuLoad.currentLoad);
      
      // Get memory usage
      const memInfo = await si.mem();
      memoryUsage = Math.round((memInfo.used / memInfo.total) * 100);
      
      // Send stats to server
      if (socketManager && socketManager.isConnected()) {
        socketManager.sendHeartbeat({
          status: 'online',
          stats: {
            cpuUsage,
            memoryUsage,
            platform: process.platform,
            version: app.getVersion()
          }
        });
      }
      
      // Update UI if window exists
      if (mainWindow) {
        mainWindow.webContents.send('system-stats', {
          cpuUsage,
          memoryUsage
        });
      }
    } catch (error) {
      log.error('Error collecting system stats:', error);
    }
  };
  
  // Run immediately and then set interval
  updateStats();
  statsInterval = setInterval(updateStats, 30000); // Every 30 seconds
};

// App ready event
app.whenReady().then(() => {
  log.info('App is ready');
  
  createWindow();
  createTray();
  initializeServices();
  startSystemStats();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Prevent multiple instances
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  log.info('Another instance is already running, quitting');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// App will quit (cleanup)
app.on('before-quit', () => {
  log.info('Application is quitting');
  isQuitting = true;
  
  if (statsInterval) {
    clearInterval(statsInterval);
  }
  
  if (socketManager) {
    socketManager.disconnect();
  }
});

// IPC Handlers
ipcMain.handle('get-agent-info', () => {
  return {
    agentId: store.get('agentId'),
    serverUrl: store.get('serverUrl'),
    name: store.get('name'),
    platform: process.platform,
    version: app.getVersion()
  };
});

ipcMain.handle('update-settings', async (_, settings) => {
  log.info('Updating settings:', settings);
  
  let reconnect = false;
  
  if (settings.serverUrl && settings.serverUrl !== store.get('serverUrl')) {
    store.set('serverUrl', settings.serverUrl);
    reconnect = true;
  }
  
  if (settings.name && settings.name !== store.get('name')) {
    store.set('name', settings.name);
  }
  
  if (reconnect && socketManager) {
    socketManager.updateConfig({
      serverUrl: store.get('serverUrl'),
      agentId: store.get('agentId'),
      agentKey: store.get('agentKey')
    });
    
    socketManager.reconnect();
  }
  
  return true;
});

ipcMain.handle('get-logs', async () => {
  const logFilePath = log.transports.file.getFile().path;
  try {
    const fs = require('fs');
    const logContent = fs.readFileSync(logFilePath, 'utf8');
    return logContent.split('\n').slice(-100).join('\n'); // Return last 100 lines
  } catch (error) {
    log.error('Error reading log file:', error);
    return 'Error reading log file';
  }
});

ipcMain.handle('execute-test-script', async (_, script, parameters, language) => {
  try {
    const result = await scriptExecutor.execute(script, parameters, language);
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reconnect', () => {
  if (socketManager) {
    socketManager.reconnect();
    return true;
  }
  return false;
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
  
  if (mainWindow) {
    dialog.showErrorBox(
      'Error',
      `An unexpected error occurred: ${error.message}`
    );
  }
});