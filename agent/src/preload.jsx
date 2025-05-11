const { contextBridge, ipcRenderer } = require('electron');

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Agent information
  getAgentInfo: () => ipcRenderer.invoke('get-agent-info'),
  
  // Settings
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  
  // Connection management
  reconnect: () => ipcRenderer.invoke('reconnect'),
  
  // Logs
  getLogs: () => ipcRenderer.invoke('get-logs'),
  
  // Script testing
  executeTestScript: (script, parameters, language) => 
    ipcRenderer.invoke('execute-test-script', script, parameters, language),
  
  // Events
  onConnectionStatus: (callback) => {
    const listener = (_, status) => callback(status);
    ipcRenderer.on('connection-status', listener);
    return () => ipcRenderer.removeListener('connection-status', listener);
  },
  
  onAgentRegistered: (callback) => {
    const listener = (_, data) => callback(data);
    ipcRenderer.on('agent-registered', listener);
    return () => ipcRenderer.removeListener('agent-registered', listener);
  },
  
  onSystemStats: (callback) => {
    const listener = (_, stats) => callback(stats);
    ipcRenderer.on('system-stats', listener);
    return () => ipcRenderer.removeListener('system-stats', listener);
  },
  
  onJobReceived: (callback) => {
    const listener = (_, job) => callback(job);
    ipcRenderer.on('job-received', listener);
    return () => ipcRenderer.removeListener('job-received', listener);
  },
  
  onJobCompleted: (callback) => {
    const listener = (_, result) => callback(result);
    ipcRenderer.on('job-completed', listener);
    return () => ipcRenderer.removeListener('job-completed', listener);
  }
});