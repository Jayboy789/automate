// server/handlers/workflowEngine.js
const { Workflow, Execution, Job, Script } = require('../models/index');
const { v4: uuidv4 } = require('uuid');

/**
 * Workflow Execution Engine
 * Handles the execution of workflows using agents
 */
const workflowEngine = {
  /**
   * Start a workflow execution
   * @param {string} workflowId - ID of the workflow to execute
   * @param {string} userId - ID of the user starting the execution
   * @param {string} agentId - Optional specific agent to use
   * @param {object} initialVariables - Optional initial variables
   * @returns {Promise<Execution>} - Created execution
   */
  async startExecution(workflowId, userId, agentId = null, initialVariables = {}) {
    // Load the workflow
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }
    
    // Create a new execution
    const execution = new Execution({
      workflowId: workflow._id,
      agentId: agentId,
      status: 'pending',
      initiatedBy: userId,
      startedAt: new Date(),
      results: {
        variables: {
          system: {
            startTime: new Date().toISOString(),
            workflowId: workflow._id.toString(),
            executionId: null, // Will be updated after save
            userId: userId.toString(),
            environment: process.env.NODE_ENV || 'development'
          },
          workflow: workflow.variables || {}, // Workflow default variables
          user: initialVariables || {} // User-provided variables
        }
      }
    });
    
    await execution.save();
    
    // Update executionId in variables now that we have it
    execution.results.variables.system.executionId = execution._id.toString();
    await execution.save();
    
    // Update workflow last executed timestamp
    workflow.lastExecuted = new Date();
    await workflow.save();
    
    // Start the execution
    await this.executeWorkflow(execution, workflow);
    
    return execution;
  },
  
  /**
   * Execute a workflow
   * @param {Execution} execution - Execution object
   * @param {Workflow} workflow - Workflow to execute
   */
  async executeWorkflow(execution, workflow) {
    // Find start nodes (nodes with no incoming edges)
    const startNodes = this.findStartNodes(workflow.nodes, workflow.edges);
    
    if (startNodes.length === 0) {
      execution.status = 'failed';
      execution.error = {
        message: 'No start nodes found in workflow',
        nodeId: null
      };
      await execution.save();
      return;
    }
    
    // Set execution to running
    execution.status = 'running';
    await execution.save();
    
    // Create jobs for start nodes
    for (const node of startNodes) {
      await this.executeNode(node, workflow, execution);
    }
  },
  
  /**
   * Continue workflow execution after a node completes
   * @param {Execution} execution - Current execution
   */
  async continueExecution(execution) {
    const workflow = await Workflow.findById(execution.workflowId);
    
    // Find completed nodes
    const completedJobs = await Job.find({ 
      executionId: execution._id, 
      status: 'completed' 
    });
    
    const completedNodeIds = completedJobs.map(job => job.nodeId);
    
    // Find nodes that can be executed next
    const nextNodes = [];
    
    for (const completedNodeId of completedNodeIds) {
      // Find outgoing edges
      const outgoingEdges = workflow.edges.filter(edge => edge.source === completedNodeId);
      
      for (const edge of outgoingEdges) {
        const targetNode = workflow.nodes.find(node => node.id === edge.target);
        
        if (targetNode) {
          // Check if all incoming edges have their source nodes completed
          const incomingEdges = workflow.edges.filter(e => e.target === targetNode.id);
          const allSourcesCompleted = incomingEdges.every(e => 
            completedNodeIds.includes(e.source)
          );
          
          if (allSourcesCompleted) {
            // Check if the node is already being processed
            const existingJob = await Job.findOne({ 
              executionId: execution._id, 
              nodeId: targetNode.id 
            });
            
            if (!existingJob) {
              nextNodes.push(targetNode);
            }
          }
        }
      }
    }
    
    // Execute next nodes
    for (const node of nextNodes) {
      await this.executeNode(node, workflow, execution);
    }
    
    // If no next nodes, check if workflow is complete
    if (nextNodes.length === 0) {
      const pendingJobs = await Job.countDocuments({ 
        executionId: execution._id, 
        status: { $in: ['queued', 'running'] } 
      });
      
      if (pendingJobs === 0) {
        execution.status = 'completed';
        execution.completedAt = new Date();
        await execution.save();
      }
    }
  },
  
  /**
   * Execute a single workflow node
   * @param {object} node - Workflow node to execute
   * @param {Workflow} workflow - Parent workflow
   * @param {Execution} execution - Current execution
   */
  async executeNode(node, workflow, execution) {
    try {
      // Add a log entry
      execution.logs.push({
        nodeId: node.id,
        timestamp: new Date(),
        message: `Executing node ${node.id} (${node.type})`,
        type: 'info'
      });
      await execution.save();
      
      // Process node based on type
      switch (node.type) {
        case 'scriptNode':
          await this.executeScriptNode(node, workflow, execution);
          break;
        
        case 'conditionNode':
          await this.executeConditionNode(node, workflow, execution);
          break;
        
        case 'waitNode':
          await this.executeWaitNode(node, workflow, execution);
          break;
        
        case 'variableNode':
          await this.executeVariableNode(node, workflow, execution);
          break;
        
        case 'stringNode':
          await this.executeStringNode(node, workflow, execution);
          break;
        
        case 'foreachNode':
          await this.executeForeachNode(node, workflow, execution);
          break;
        
        default:
          // Log unhandled node type
          execution.logs.push({
            nodeId: node.id,
            timestamp: new Date(),
            message: `Unhandled node type: ${node.type}`,
            type: 'warn'
          });
          
          // For unhandled types, just mark as completed and continue
          await this.markNodeComplete(node, execution);
      }
    } catch (error) {
      // Log the error
      execution.logs.push({
        nodeId: node.id,
        timestamp: new Date(),
        message: `Error executing node: ${error.message}`,
        type: 'error'
      });
      
      // Create a failed job for this node
      const job = new Job({
        agentId: execution.agentId,
        nodeId: node.id,
        script: '',
        userId: execution.initiatedBy,
        executionId: execution._id,
        status: 'failed',
        error: error.message,
        createdAt: new Date(),
        completedAt: new Date()
      });
      
      await job.save();
      
      // Check if we should stop execution
      if (!node.data?.continueOnError) {
        execution.status = 'failed';
        execution.completedAt = new Date();
        execution.error = {
          message: error.message,
          nodeId: node.id
        };
      }
      
      await execution.save();
      
      // Continue execution if needed
      if (execution.status !== 'failed') {
        await this.continueExecution(execution);
      }
    }
  },
  
  /**
   * Execute a script node
   * @param {object} node - Script node
   * @param {Workflow} workflow - Parent workflow
   * @param {Execution} execution - Current execution
   */
  async executeScriptNode(node, workflow, execution) {
    let script = '';
    
    // Check if we're using a script from library or inline script
    if (node.data.scriptId) {
      const scriptDoc = await Script.findById(node.data.scriptId);
      if (!scriptDoc) {
        throw new Error(`Script not found: ${node.data.scriptId}`);
      }
      script = scriptDoc.content;
    } else {
      script = node.data.script || '';
    }
    
    // Replace variables in script
    script = await this.replaceVariables(script, execution);
    
    // Create a job for this node
    const job = new Job({
      agentId: node.data.assignedAgent || execution.agentId,
      nodeId: node.id,
      script,
      parameters: node.data.parameters || {},
      userId: execution.initiatedBy,
      executionId: execution._id,
      status: 'queued'
    });
    
    await job.save();
    
    // In a real implementation, we would send this to the agent queue
    // For now, we'll simulate successful execution
    if (process.env.NODE_ENV === 'development') {
      setTimeout(async () => {
        job.status = 'completed';
        job.output = 'Simulated script execution completed successfully';
        job.completedAt = new Date();
        await job.save();
        
        // Continue workflow execution
        await this.continueExecution(execution);
      }, 2000);
    }
  },
  
  /**
   * Execute a condition node
   * @param {object} node - Condition node
   * @param {Workflow} workflow - Parent workflow
   * @param {Execution} execution - Current execution
   */
  async executeConditionNode(node, workflow, execution) {
    // Evaluate condition
    const condition = node.data.condition || '';
    const result = await this.evaluateCondition(condition, execution);
    
    // Store the result in execution context
    execution.results[node.id] = { condition, result };
    
    // Add a log entry
    execution.logs.push({
      nodeId: node.id,
      timestamp: new Date(),
      message: `Condition evaluated to: ${result}`,
      type: 'info'
    });
    
    // Find outgoing edges
    const trueEdge = workflow.edges.find(e => 
      e.source === node.id && e.sourceHandle === 'true'
    );
    
    const falseEdge = workflow.edges.find(e => 
      e.source === node.id && e.sourceHandle === 'false'
    );
    
    // Mark this node as completed
    await this.markNodeComplete(node, execution);
    
    // Execute next nodes based on condition result
    if (result && trueEdge) {
      const nextNode = workflow.nodes.find(n => n.id === trueEdge.target);
      if (nextNode) {
        await this.executeNode(nextNode, workflow, execution);
      }
    } else if (!result && falseEdge) {
      const nextNode = workflow.nodes.find(n => n.id === falseEdge.target);
      if (nextNode) {
        await this.executeNode(nextNode, workflow, execution);
      }
    }
  },
  
  /**
   * Execute a string operation node
   * @param {object} node - String node
   * @param {Workflow} workflow - Parent workflow
   * @param {Execution} execution - Current execution
   */
  async executeStringNode(node, workflow, execution) {
    const { operation, input1, input2, outputVariable } = node.data;
    
    if (!operation || !input1 || !outputVariable) {
      throw new Error('String node missing required configuration');
    }
    
    // Get input values (could be variable references or literal strings)
    const input1Value = await this.getVariableOrLiteral(input1, execution);
    const input2Value = input2 ? await this.getVariableOrLiteral(input2, execution) : null;
    
    let result;
    
    // Perform the selected string operation
    switch (operation) {
      case 'concat':
        if (input2Value === null) {
          throw new Error('Second string required for concatenation');
        }
        result = String(input1Value) + String(input2Value);
        break;
        
      case 'substring':
        const startIndex = node.data.startIndex || 0;
        const endIndex = node.data.endIndex !== undefined ? node.data.endIndex : undefined;
        
        if (typeof input1Value !== 'string') {
          throw new Error('Input must be a string for substring operation');
        }
        
        result = endIndex !== undefined 
          ? input1Value.substring(startIndex, endIndex) 
          : input1Value.substring(startIndex);
        break;
        
      case 'replace':
        if (input2Value === null) {
          throw new Error('Replace pattern required for replace operation');
        }
        
        const replacementText = node.data.replacementText 
          ? await this.getVariableOrLiteral(node.data.replacementText, execution) 
          : '';
          
        if (typeof input1Value !== 'string') {
          throw new Error('Input must be a string for replace operation');
        }
        
        result = input1Value.replace(new RegExp(input2Value, 'g'), replacementText);
        break;
        
      case 'toLower':
        if (typeof input1Value !== 'string') {
          throw new Error('Input must be a string for toLower operation');
        }
        result = input1Value.toLowerCase();
        break;
        
      case 'toUpper':
        if (typeof input1Value !== 'string') {
          throw new Error('Input must be a string for toUpper operation');
        }
        result = input1Value.toUpperCase();
        break;
        
      case 'trim':
        if (typeof input1Value !== 'string') {
          throw new Error('Input must be a string for trim operation');
        }
        result = input1Value.trim();
        break;
        
      case 'split':
        if (typeof input1Value !== 'string') {
          throw new Error('Input must be a string for split operation');
        }
        
        const delimiter = input2Value !== null ? input2Value : '';
        result = input1Value.split(delimiter);
        break;
        
      case 'length':
        if (typeof input1Value !== 'string') {
          throw new Error('Input must be a string for length operation');
        }
        result = input1Value.length;
        break;
        
      default:
        throw new Error(`Unsupported string operation: ${operation}`);
    }
    
    // Store the result in a variable
    this.setVariable(outputVariable, result, execution);
    
    // Log the operation
    execution.logs.push({
      nodeId: node.id,
      timestamp: new Date(),
      message: `String operation '${operation}' completed: result stored in ${outputVariable}`,
      type: 'info'
    });
    
    // Mark this node as completed
    await this.markNodeComplete(node, execution);
    
    // Continue workflow execution
    await this.continueExecution(execution);
  },
  
  /**
   * Execute a foreach node
   * @param {object} node - Foreach node
   * @param {Workflow} workflow - Parent workflow
   * @param {Execution} execution - Current execution
   */
  async executeForeachNode(node, workflow, execution) {
    const { collectionVariable, itemVariable, indexVariable } = node.data;
    
    if (!collectionVariable || !itemVariable) {
      throw new Error('ForEach node missing required configuration');
    }
    
    // Get the collection to iterate over
    const collection = await this.getVariableValue(collectionVariable, execution);
    
    if (!collection || (typeof collection !== 'object' && !Array.isArray(collection))) {
      throw new Error(`Collection variable ${collectionVariable} is not iterable`);
    }
    
    // Convert the collection to an array
    const items = Array.isArray(collection) ? collection : Object.entries(collection);
    
    // Create a job for this node
    const job = new Job({
      agentId: execution.agentId,
      nodeId: node.id,
      script: `ForEach loop over ${collectionVariable} (${items.length} items)`,
      userId: execution.initiatedBy,
      executionId: execution._id,
      status: 'running',
      startedAt: new Date()
    });
    
    await job.save();
    
    // Find the forEach body node
    const bodyEdge = workflow.edges.find(e => 
      e.source === node.id && e.sourceHandle === 'forEach'
    );
    
    if (!bodyEdge) {
      throw new Error('ForEach node has no body connection');
    }
    
    const bodyNode = workflow.nodes.find(n => n.id === bodyEdge.target);
    if (!bodyNode) {
      throw new Error('ForEach body node not found');
    }
    
    // Process items
    let currentIndex = 0;
    let hasError = false;
    
    // Determine if we should use parallel execution
    const parallelExecution = node.data.parallelExecution === true;
    
    if (parallelExecution) {
      // For parallel execution, we create an array of promises
      const promises = items.map(async (item, index) => {
        try {
          // Set the current item and index variables
          this.setVariable(itemVariable, Array.isArray(collection) ? item : item[1], execution);
          
          if (indexVariable) {
            this.setVariable(indexVariable, index, execution);
          }
          
          // Update execution with current iteration
          execution.logs.push({
            nodeId: node.id,
            timestamp: new Date(),
            message: `ForEach iteration ${index + 1}/${items.length}`,
            type: 'info'
          });
          
          // Execute the body node
          await this.executeNode(bodyNode, workflow, execution);
          
          return { index, success: true };
        } catch (error) {
          hasError = true;
          
          // Log the error
          execution.logs.push({
            nodeId: node.id,
            timestamp: new Date(),
            message: `Error in ForEach iteration ${index + 1}: ${error.message}`,
            type: 'error'
          });
          
          return { index, success: false, error };
        }
      });
      
      // Wait for all iterations to complete
      await Promise.all(promises);
    } else {
      // For sequential execution, process one at a time
      for (let i = 0; i < items.length; i++) {
        currentIndex = i;
        
        try {
          // Set the current item and index variables
          this.setVariable(itemVariable, Array.isArray(collection) ? items[i] : items[i][1], execution);
          
          if (indexVariable) {
            this.setVariable(indexVariable, i, execution);
          }
          
          // Update execution with current iteration
          execution.logs.push({
            nodeId: node.id,
            timestamp: new Date(),
            message: `ForEach iteration ${i + 1}/${items.length}`,
            type: 'info'
          });
          
          // Execute the body node
          await this.executeNode(bodyNode, workflow, execution);
        } catch (error) {
          hasError = true;
          
          // Log the error
          execution.logs.push({
            nodeId: node.id,
            timestamp: new Date(),
            message: `Error in ForEach iteration ${i + 1}: ${error.message}`,
            type: 'error'
          });
          
          // If we shouldn't continue on error, break the loop
          if (!node.data.continueOnError) {
            break;
          }
        }
      }
    }
    
    // Update the job status
    job.status = 'completed';
    job.completedAt = new Date();
    await job.save();
    
    // Determine which outgoing path to take
    if (hasError && !node.data.continueOnError) {
      // Find error edge
      const errorEdge = workflow.edges.find(e => 
        e.source === node.id && e.sourceHandle === 'error'
      );
      
      if (errorEdge) {
        const errorNode = workflow.nodes.find(n => n.id === errorEdge.target);
        if (errorNode) {
          await this.executeNode(errorNode, workflow, execution);
        }
      }
    } else {
      // Find complete edge
      const completeEdge = workflow.edges.find(e => 
        e.source === node.id && e.sourceHandle === 'complete'
      );
      
      if (completeEdge) {
        const completeNode = workflow.nodes.find(n => n.id === completeEdge.target);
        if (completeNode) {
          await this.executeNode(completeNode, workflow, execution);
        }
      }
    }
    
    // Continue workflow execution
    await this.continueExecution(execution);
  },
  
  /**
   * Execute a wait node
   * @param {object} node - Wait node
   * @param {Workflow} workflow - Parent workflow
   * @param {Execution} execution - Current execution
   */
  async executeWaitNode(node, workflow, execution) {
    const waitTime = parseInt(node.data.waitTime) || 5;
    
    // Add a log entry
    execution.logs.push({
      nodeId: node.id,
      timestamp: new Date(),
      message: `Waiting for ${waitTime} seconds`,
      type: 'info'
    });
    await execution.save();
    
    // Create a job for this wait
    const job = new Job({
      agentId: execution.agentId,
      nodeId: node.id,
      script: `Wait ${waitTime} seconds`,
      userId: execution.initiatedBy,
      executionId: execution._id,
      status: 'running',
      startedAt: new Date()
    });
    
    await job.save();
    
    // Wait for the specified time
    setTimeout(async () => {
      // Mark the job as completed
      job.status = 'completed';
      job.completedAt = new Date();
      job.output = `Waited for ${waitTime} seconds`;
      await job.save();
      
      // Continue workflow execution
      await this.continueExecution(execution);
    }, waitTime * 1000);
  },
  
  /**
   * Execute a variable node
   * @param {object} node - Variable node
   * @param {Workflow} workflow - Parent workflow
   * @param {Execution} execution - Current execution
   */
  async executeVariableNode(node, workflow, execution) {
    const variableName = node.data.name;
    let variableValue = node.data.value;
    
    // Replace variables in the value if it's a string
    if (typeof variableValue === 'string') {
      variableValue = await this.replaceVariables(variableValue, execution);
      
      // Try to parse the value as JSON if it looks like a JSON object or array
      if ((variableValue.startsWith('{') && variableValue.endsWith('}')) || 
          (variableValue.startsWith('[') && variableValue.endsWith(']'))) {
        try {
          variableValue = JSON.parse(variableValue);
        } catch (e) {
          // If parsing fails, keep as string
        }
      }
      // Try to parse as number
      else if (!isNaN(variableValue)) {
        variableValue = Number(variableValue);
      }
      // Convert to boolean if it's "true" or "false"
      else if (variableValue === 'true') {
        variableValue = true;
      } 
      else if (variableValue === 'false') {
        variableValue = false;
      }
    }
    
    // Store the variable in execution context
    this.setVariable(variableName, variableValue, execution);
    
    // Add a log entry
    execution.logs.push({
      nodeId: node.id,
      timestamp: new Date(),
      message: `Variable '${variableName}' set to: ${JSON.stringify(variableValue)}`,
      type: 'info'
    });
    await execution.save();
    
    // Mark this node as completed
    await this.markNodeComplete(node, execution);
    
    // Continue workflow execution
    await this.continueExecution(execution);
  },
  
  /**
   * Mark a node as completed
   * @param {object} node - Node to mark as completed
   * @param {Execution} execution - Current execution
   */
  async markNodeComplete(node, execution) {
    // Create a completed job for this node
    const job = await Job.findOne({ 
      nodeId: node.id, 
      executionId: execution._id 
    });
    
    if (job) {
      job.status = 'completed';
      job.completedAt = new Date();
      await job.save();
    } else {
      // Create a new job record
      const newJob = new Job({
        agentId: execution.agentId,
        nodeId: node.id,
        script: '',
        userId: execution.initiatedBy,
        executionId: execution._id,
        status: 'completed',
        createdAt: new Date(),
        completedAt: new Date()
      });
      
      await newJob.save();
    }
  },
  
  /**
   * Find start nodes in a workflow (nodes with no incoming edges)
   * @param {Array} nodes - Workflow nodes
   * @param {Array} edges - Workflow edges
   * @returns {Array} - Start nodes
   */
  findStartNodes(nodes, edges) {
    // Get all node IDs that are targets of edges
    const targetNodeIds = edges.map(edge => edge.target);
    
    // Filter nodes that don't appear as targets
    return nodes.filter(node => !targetNodeIds.includes(node.id));
  },
  
  /**
   * Replace variables in a string with their values from execution context
   * @param {string} text - Text with variables
   * @param {Execution} execution - Current execution
   * @returns {string} - Text with replaced variables
   */
  async replaceVariables(text, execution) {
    if (!text) return text;
    
    // Replace {{varName}} with variable values
    return text.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
      const value = this.getVariableByPath(path, execution);
      return value !== undefined ? value : match;
    });
  },
  
  /**
   * Get a variable value by path (e.g., "user.firstName")
   * @param {string} path - Variable path
   * @param {Execution} execution - Current execution
   * @returns {any} - Variable value
   */
  getVariableByPath(path, execution) {
    if (!path) return undefined;
    
    const parts = path.split('.');
    
    // Handle system, workflow, and user variables
    if (parts.length === 2) {
      const [category, name] = parts;
      
      if (category === 'system' || category === 'workflow' || category === 'user') {
        return execution.results.variables?.[category]?.[name];
      }
    }
    
    // Default behavior - check if it's a direct variable in user space
    return execution.results.variables?.user?.[path];
  },
  
  /**
   * Get variable value or return literal
   * @param {string} input - Variable path or literal value
   * @param {Execution} execution - Current execution
   * @returns {any} - Variable value or literal
   */
  async getVariableOrLiteral(input, execution) {
    // Check if input is a variable reference
    if (input && typeof input === 'string' && input.includes('.')) {
      return this.getVariableByPath(input, execution);
    }
    
    // Otherwise, treat as literal
    return input;
  },
  
  /**
   * Helper to get a variable value (handles direct variables without categories)
   * @param {string} name - Variable name or path
   * @param {Execution} execution - Current execution
   * @returns {any} - Variable value
   */
  async getVariableValue(name, execution) {
    // If name contains a dot, it's a path
    if (name.includes('.')) {
      return this.getVariableByPath(name, execution);
    }
    
    // Otherwise, check user variables
    return execution.results.variables?.user?.[name];
  },
  
  /**
   * Set a variable in the execution context
   * @param {string} name - Variable name
   * @param {any} value - Variable value
   * @param {Execution} execution - Current execution
   */
  setVariable(name, value, execution) {
    // Handle variable paths (e.g., "user.firstName")
    if (name.includes('.')) {
      const [category, varName] = name.split('.');
      
      // Make sure the category exists
      if (!execution.results.variables[category]) {
        execution.results.variables[category] = {};
      }
      
      execution.results.variables[category][varName] = value;
    } else {
      // Default to user variables
      if (!execution.results.variables.user) {
        execution.results.variables.user = {};
      }
      
      execution.results.variables.user[name] = value;
    }
  },
  
  /**
   * Evaluate a condition expression
   * @param {string} condition - Condition expression
   * @param {Execution} execution - Current execution
   * @returns {boolean} - Evaluation result
   */
  async evaluateCondition(condition, execution) {
    if (!condition) return true;
    
    // Replace variables
    const preparedCondition = await this.replaceVariables(condition, execution);
    
    try {
      // Use a sandbox to evaluate the condition
      const vm = require('vm');
      const context = {
        variables: execution.results.variables || {},
        result: false
      };
      
      // Prepare safe evaluation script
      const script = `
        try {
          result = Boolean(${preparedCondition});
        } catch (e) {
          result = false;
        }
      `;
      
      // Run in VM context
      vm.runInNewContext(script, context);
      return context.result;
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }
};

module.exports = workflowEngine;