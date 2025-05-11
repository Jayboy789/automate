const { exec } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const { PythonShell } = require('python-shell');
const { PowerShell } = require('node-powershell');

/**
 * Script execution manager for agent
 */
class ScriptExecutor {
  constructor() {
    // Create temp directory if it doesn't exist
    this.tempDir = path.join(os.tmpdir(), 'automate-agent');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    
    log.info(`ScriptExecutor initialized with temp directory: ${this.tempDir}`);
  }
  
  /**
   * Execute a script
   * @param {string} script - Script content
   * @param {Object} parameters - Script parameters
   * @param {string} language - Script language
   * @returns {Promise<string>} - Script output
   */
  async execute(script, parameters = {}, language = 'PowerShell') {
    log.info(`Executing ${language} script with parameters:`, parameters);
    
    // Create a temp file for the script
    const scriptId = Date.now().toString();
    
    // Select execution method based on language
    switch (language.toLowerCase()) {
      case 'powershell':
        return this.executePowerShell(script, parameters, scriptId);
      case 'python':
        return this.executePython(script, parameters, scriptId);
      case 'javascript':
      case 'node':
        return this.executeNode(script, parameters, scriptId);
      case 'bash':
      case 'shell':
        return this.executeBash(script, parameters, scriptId);
      default:
        throw new Error(`Unsupported script language: ${language}`);
    }
  }
  
  /**
   * Execute PowerShell script
   * @private
   * @param {string} script - Script content
   * @param {Object} parameters - Script parameters
   * @param {string} scriptId - Unique script ID
   * @returns {Promise<string>} - Script output
   */
  async executePowerShell(script, parameters, scriptId) {
    // Only available on Windows
    if (os.platform() !== 'win32') {
      throw new Error('PowerShell is only available on Windows');
    }
    
    // Create script file
    const scriptFile = path.join(this.tempDir, `script_${scriptId}.ps1`);
    
    try {
      // Process parameters
      const paramScript = this.buildPowerShellParams(parameters);
      
      // Write script to file
      fs.writeFileSync(scriptFile, `${paramScript}\n\n${script}`);
      
      // Create PowerShell instance
      const ps = new PowerShell({
        executionPolicy: 'Bypass',
        noProfile: true
      });
      
      // Execute script
      return await new Promise((resolve, reject) => {
        ps.addCommand(`& "${scriptFile}"`)
          .then(() => ps.invoke())
          .then(output => {
            ps.dispose();
            resolve(output);
          })
          .catch(err => {
            ps.dispose();
            reject(err);
          });
      });
    } catch (error) {
      log.error('PowerShell execution error:', error);
      throw error;
    } finally {
      // Clean up script file
      this.cleanupFile(scriptFile);
    }
  }
  
  /**
   * Execute Python script
   * @private
   * @param {string} script - Script content
   * @param {Object} parameters - Script parameters
   * @param {string} scriptId - Unique script ID
   * @returns {Promise<string>} - Script output
   */
  async executePython(script, parameters, scriptId) {
    // Create script file
    const scriptFile = path.join(this.tempDir, `script_${scriptId}.py`);
    
    try {
      // Process parameters
      const paramScript = this.buildPythonParams(parameters);
      
      // Write script to file
      fs.writeFileSync(scriptFile, `${paramScript}\n\n${script}`);
      
      // Execute script
      return await new Promise((resolve, reject) => {
        PythonShell.run(scriptFile, { mode: 'text' }, (err, results) => {
          if (err) return reject(err);
          resolve(results.join('\n'));
        });
      });
    } catch (error) {
      log.error('Python execution error:', error);
      throw error;
    } finally {
      // Clean up script file
      this.cleanupFile(scriptFile);
    }
  }
  
  /**
   * Execute Node.js script
   * @private
   * @param {string} script - Script content
   * @param {Object} parameters - Script parameters
   * @param {string} scriptId - Unique script ID
   * @returns {Promise<string>} - Script output
   */
  async executeNode(script, parameters, scriptId) {
    // Create script file
    const scriptFile = path.join(this.tempDir, `script_${scriptId}.js`);
    
    try {
      // Process parameters
      const paramScript = this.buildNodeParams(parameters);
      
      // Write script to file
      fs.writeFileSync(scriptFile, `${paramScript}\n\n${script}`);
      
      // Execute script
      return await new Promise((resolve, reject) => {
        exec(`node "${scriptFile}"`, (error, stdout, stderr) => {
          if (error) return reject(error);
          if (stderr) log.warn('Node script stderr:', stderr);
          resolve(stdout);
        });
      });
    } catch (error) {
      log.error('Node execution error:', error);
      throw error;
    } finally {
      // Clean up script file
      this.cleanupFile(scriptFile);
    }
  }
  
  /**
   * Execute Bash script
   * @private
   * @param {string} script - Script content
   * @param {Object} parameters - Script parameters
   * @param {string} scriptId - Unique script ID
   * @returns {Promise<string>} - Script output
   */
  async executeBash(script, parameters, scriptId) {
    // Only available on Linux and macOS
    if (os.platform() === 'win32') {
      throw new Error('Bash is not available on Windows');
    }
    
    // Create script file
    const scriptFile = path.join(this.tempDir, `script_${scriptId}.sh`);
    
    try {
      // Process parameters
      const paramScript = this.buildBashParams(parameters);
      
      // Write script to file
      fs.writeFileSync(scriptFile, `#!/bin/bash\n${paramScript}\n\n${script}`);
      fs.chmodSync(scriptFile, '755'); // Make executable
      
      // Execute script
      return await new Promise((resolve, reject) => {
        exec(`"${scriptFile}"`, (error, stdout, stderr) => {
          if (error) return reject(error);
          if (stderr) log.warn('Bash script stderr:', stderr);
          resolve(stdout);
        });
      });
    } catch (error) {
      log.error('Bash execution error:', error);
      throw error;
    } finally {
      // Clean up script file
      this.cleanupFile(scriptFile);
    }
  }
  
  /**
   * Build PowerShell parameter script
   * @private
   * @param {Object} parameters - Script parameters
   * @returns {string} - Parameter script
   */
  buildPowerShellParams(parameters) {
    if (!parameters || Object.keys(parameters).length === 0) {
      return '';
    }
    
    return Object.entries(parameters)
      .map(([key, value]) => {
        // Format value based on type
        let formattedValue;
        if (typeof value === 'string') {
          formattedValue = `"${value.replace(/"/g, '`"')}"`;
        } else if (typeof value === 'boolean') {
          formattedValue = value ? '$true' : '$false';
        } else if (Array.isArray(value)) {
          formattedValue = `@(${value.map(item => {
            if (typeof item === 'string') return `"${item.replace(/"/g, '`"')}"`;
            return JSON.stringify(item);
          }).join(', ')})`;
        } else if (value === null || value === undefined) {
          formattedValue = '$null';
        } else if (typeof value === 'object') {
          formattedValue = `@{${Object.entries(value).map(([k, v]) => {
            let val;
            if (typeof v === 'string') val = `"${v.replace(/"/g, '`"')}"`;
            else if (typeof v === 'boolean') val = v ? '$true' : '$false';
            else if (v === null || v === undefined) val = '$null';
            else val = JSON.stringify(v);
            return `${k}=${val}`;
          }).join('; ')}}`;
        } else {
          formattedValue = value;
        }
        
        return `$${key} = ${formattedValue}`;
      })
      .join('\n');
  }
  
  /**
   * Build Python parameter script
   * @private
   * @param {Object} parameters - Script parameters
   * @returns {string} - Parameter script
   */
  buildPythonParams(parameters) {
    if (!parameters || Object.keys(parameters).length === 0) {
      return '';
    }
    
    return Object.entries(parameters)
      .map(([key, value]) => {
        // Format value based on type
        let formattedValue;
        if (typeof value === 'string') {
          formattedValue = `"""${value.replace(/"""/g, '\\"\\"\\"')}"""`;
        } else if (value === null) {
          formattedValue = 'None';
        } else if (typeof value === 'boolean') {
          formattedValue = value ? 'True' : 'False';
        } else {
          formattedValue = JSON.stringify(value);
        }
        
        return `${key} = ${formattedValue}`;
      })
      .join('\n');
  }
  
  /**
   * Build Node.js parameter script
   * @private
   * @param {Object} parameters - Script parameters
   * @returns {string} - Parameter script
   */
  buildNodeParams(parameters) {
    if (!parameters || Object.keys(parameters).length === 0) {
      return '';
    }
    
    return `// Script parameters
const params = ${JSON.stringify(parameters, null, 2)};
${Object.keys(parameters).map(key => `const ${key} = params.${key};`).join('\n')}`;
  }
  
  /**
   * Build Bash parameter script
   * @private
   * @param {Object} parameters - Script parameters
   * @returns {string} - Parameter script
   */
  buildBashParams(parameters) {
    if (!parameters || Object.keys(parameters).length === 0) {
      return '';
    }
    
    return Object.entries(parameters)
      .map(([key, value]) => {
        // Format value based on type
        let formattedValue;
        if (typeof value === 'string') {
          formattedValue = `"${value.replace(/"/g, '\\"')}"`;
        } else if (Array.isArray(value)) {
          formattedValue = `(${value.map(item => {
            if (typeof item === 'string') return `"${item.replace(/"/g, '\\"')}"`;
            return JSON.stringify(item);
          }).join(' ')})`;
        } else {
          formattedValue = JSON.stringify(value);
        }
        
        return `${key}=${formattedValue}`;
      })
      .join('\n');
  }
  
  /**
   * Clean up temporary file
   * @private
   * @param {string} filePath - File path
   */
  cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      log.warn(`Failed to clean up file ${filePath}:`, error);
    }
  }
}

module.exports = { ScriptExecutor };