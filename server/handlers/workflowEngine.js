// handlers/workflowEngine.js
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
   * @returns {Promise<Execution>} - Created execution
   */
  async startExecution(workflowId, userId, agentId = null) {
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
      startedAt: new Date()
    });
    
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
        case 'script':
          await this.executeScriptNode(node, workflow, execution);
          break;
        
        case 'condition':
          await this.executeConditionNode(node, workflow, execution);
          break;
        
        case 'wait':
          await this.executeWaitNode(node, workflow, execution);
          break;
        
        case 'variable':
          await this.executeVariableNode(node, workflow, execution);
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
    }
    
    // Store the variable in execution context
    if (!execution.results.variables) {
      execution.results.variables = {};
    }
    execution.results.variables[variableName] = variableValue;
    
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
    
    // Get variables from execution context
    const variables = execution.results.variables || {};
    
    // Replace {{varName}} with variable values
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? variables[varName] : match;
    });
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