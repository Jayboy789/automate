import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Panel,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';

import { getWorkflow, updateWorkflow, createWorkflow, executeWorkflow as executeWorkflowAPI, getAgents } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import { WorkflowVariablesProvider, useWorkflowVariables } from '../../contexts/WorkflowVariablesContext';
import nodeTypes from './nodes/nodeTypes';
import NodePanel from './NodePanel';
import PropertiesPanel from './PropertiesPanel';
import VariablesPanel from './VariablesPanel';
import WorkflowToolbar from './WorkflowToolbar';

// Default workflow data
const defaultWorkflow = {
  name: 'New Workflow',
  description: '',
  nodes: [],
  edges: [],
  isActive: true,
  variables: {
    system: {
      workflowId: '',
      environment: 'development'
    },
    workflow: {},
    user: {}
  }
};

const WorkflowEditorContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { on, emit, connected } = useSocket();
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  
  // Workflow state
  const [workflow, setWorkflow] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showVariablesPanel, setShowVariablesPanel] = useState(false);
  const [nodePanelWidth, setNodePanelWidth] = useState(240);
  const [propertiesPanelWidth, setPropertiesPanelWidth] = useState(320);
  const [availableAgents, setAvailableAgents] = useState([]);
  
  // Variables context
  const { setVariable, exportVariables } = useWorkflowVariables();
  
  // Check if we're creating a new workflow
  const isNewWorkflow = id === 'new';
  
  // Load available agents
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const agents = await getAgents();
        const onlineAgents = agents.filter(agent => agent.status === 'online');
        setAvailableAgents(onlineAgents);
      } catch (error) {
        console.error('Error loading agents:', error);
      }
    };
    
    loadAgents();
    
    // Set up interval to refresh agents every 30 seconds
    const interval = setInterval(loadAgents, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Load workflow data
  useEffect(() => {
    const loadWorkflow = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (isNewWorkflow) {
          const newWorkflow = { ...defaultWorkflow };
          setWorkflow(newWorkflow);
          setNodes([]);
          setEdges([]);
        } else {
          const data = await getWorkflow(id);
          setWorkflow(data);
          
          // Convert nodes and edges to ReactFlow format
          const flowNodes = data.nodes.map(node => ({
            ...node,
            // Ensure position is an object with x and y
            position: node.position || { x: 100, y: 100 },
            // Set type and data
            type: node.type,
            data: { 
              ...node.data,
              label: node.data?.label || getDefaultNodeLabel(node.type) 
            }
          }));
          
          const flowEdges = data.edges.map(edge => ({
            ...edge,
            // Ensure required properties for edges
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle
          }));
          
          setNodes(flowNodes);
          setEdges(flowEdges);
          
          // Initialize variables from workflow
          if (data.variables) {
            Object.entries(data.variables).forEach(([category, vars]) => {
              Object.entries(vars).forEach(([name, value]) => {
                setVariable(name, value, category);
              });
            });
          }
        }
      } catch (err) {
        console.error('Error loading workflow:', err);
        setError('Failed to load workflow. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWorkflow();
  }, [id, isNewWorkflow, setVariable]);
  
  // Listen for workflow execution updates
  useEffect(() => {
    if (!workflow || !on) return;
    
    const unsubscribe = on('execution:status', (data) => {
      if (data && workflow._id === data.workflowId) {
        // Update nodes with execution status
        if (data.nodeStatus) {
          setNodes(prevNodes => 
            prevNodes.map(node => 
              node.id === data.nodeStatus.nodeId 
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      executionStatus: data.nodeStatus.status
                    }
                  }
                : node
            )
          );
        }
        
        // Show execution completion
        if (['completed', 'failed', 'cancelled'].includes(data.status)) {
          setIsExecuting(false);
          
          // Show notification
          const statusMessage = data.status === 'completed' 
            ? 'Workflow execution completed successfully'
            : `Workflow execution ${data.status}`;
          
          setSuccessMessage(statusMessage);
          setTimeout(() => setSuccessMessage(null), 5000);
        }
      }
    });
    
    return unsubscribe;
  }, [workflow, on]);
  
  // Mark unsaved changes when nodes or edges change
  useEffect(() => {
    if (workflow && !isLoading) {
      setUnsavedChanges(true);
    }
  }, [nodes, edges, workflow, isLoading]);
  
  // Handle adding a new node
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      
      if (typeof type === 'undefined' || !type) {
        return;
      }
      
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      const id = `${type}_${Date.now()}`;
      const newNode = {
        id,
        type,
        position,
        data: { label: getDefaultNodeLabel(type) },
      };
      
      setNodes((nds) => nds.concat(newNode));
      setSelectedNode(newNode);
    },
    [reactFlowInstance, setNodes]
  );
  
  // Get default label for node type
  const getDefaultNodeLabel = (type) => {
    const labels = {
      scriptNode: 'Script',
      conditionNode: 'Condition',
      waitNode: 'Wait',
      variableNode: 'Variable',
      httpNode: 'HTTP Request',
      webhookNode: 'Webhook',
      scheduleNode: 'Schedule',
      loopNode: 'Loop',
      transformNode: 'Transform',
      foreachNode: 'For Each',
      stringNode: 'String Operations',
      emailNode: 'Send Email',
      apiNode: 'API Call',
      notificationNode: 'Notification',
      databaseNode: 'Database',
      fileNode: 'File Operations'
    };
    
    return labels[type] || 'Node';
  };
  
  // Handle node connections
  const onConnect = useCallback((params) => {
    // Add extra validation logic here if needed
    setEdges((eds) => addEdge({
      ...params,
      id: `edge_${Date.now()}`
    }, eds));
  }, [setEdges]);
  
  // Handle node selection
  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);
  
  // Handle node update from properties panel
  const onNodeUpdate = useCallback((updatedNode) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === updatedNode.id ? updatedNode : node))
    );
    setUnsavedChanges(true);
  }, [setNodes]);
  
  // Handle pane click (deselect nodes)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);
  
  // Save workflow
  const saveWorkflow = async () => {
    if (!workflow) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Validate workflow before saving
      const validationError = validateWorkflow(nodes, edges);
      if (validationError) {
        setError(validationError);
        setIsSaving(false);
        return;
      }
      
      // Get all variables from context
      const variables = exportVariables ? JSON.parse(exportVariables()) : {};
      
      // Prepare workflow data
      const workflowData = {
        name: workflow.name || 'Untitled Workflow',
        description: workflow.description || '',
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || null,
          targetHandle: edge.targetHandle || null
        })),
        variables,
        isActive: workflow.isActive !== false,
        clientId: workflow.clientId || null
      };
      
      let savedWorkflow;
      
      if (workflow._id) {
        // Update existing workflow
        savedWorkflow = await updateWorkflow(workflow._id, workflowData);
      } else {
        // Create new workflow
        savedWorkflow = await createWorkflow(workflowData);
        // Navigate to the new workflow's URL
        navigate(`/workflows/${savedWorkflow._id}`, { replace: true });
      }
      
      setWorkflow(savedWorkflow);
      setUnsavedChanges(false);
      
      // Show success message
      setSuccessMessage('Workflow saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving workflow:', err);
      setError(`Failed to save workflow: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Validate workflow before saving
  const validateWorkflow = (nodes, edges) => {
    // Check if workflow has at least one node
    if (nodes.length === 0) {
      return 'Workflow must have at least one node';
    }
    
    // Check for start nodes (nodes with no incoming edges)
    const targetNodeIds = edges.map(edge => edge.target);
    const startNodes = nodes.filter(node => !targetNodeIds.includes(node.id));
    
    if (startNodes.length === 0) {
      return 'Workflow must have at least one start node (node with no incoming connections)';
    }
    
    // Validate node configurations
    for (const node of nodes) {
      switch (node.type) {
        case 'scriptNode':
          if (!node.data.script && !node.data.scriptId) {
            return `Script node "${node.data.label}" must have a script configured`;
          }
          break;
        case 'conditionNode':
          if (!node.data.condition) {
            return `Condition node "${node.data.label}" must have a condition configured`;
          }
          break;
        case 'variableNode':
          if (!node.data.name) {
            return `Variable node "${node.data.label}" must have a variable name configured`;
          }
          break;
        case 'httpNode':
          if (!node.data.url) {
            return `HTTP node "${node.data.label}" must have a URL configured`;
          }
          break;
        case 'webhookNode':
          if (!node.data.path) {
            return `Webhook node "${node.data.label}" must have a path configured`;
          }
          break;
        case 'foreachNode':
          if (!node.data.collectionVariable || !node.data.itemVariable) {
            return `ForEach node "${node.data.label}" must have collection and item variables configured`;
          }
          break;
        case 'stringNode':
          if (!node.data.operation || !node.data.input1 || !node.data.outputVariable) {
            return `String node "${node.data.label}" must have operation, input, and output configured`;
          }
          break;
      }
    }
    
    return null;
  };
  
  // Execute workflow
  const executeWorkflow = async (agentId = null) => {
    if (!workflow._id) {
      setError('Please save the workflow before executing.');
      return;
    }
    
    setIsExecuting(true);
    setError(null);
    
    try {
      // If no agent specified, try to find an available one
      if (!agentId && availableAgents.length > 0) {
        agentId = availableAgents[0].agentId;
      }
      
      if (!agentId) {
        setError('No online agents available. Please ensure at least one agent is running.');
        setIsExecuting(false);
        return;
      }
      
      // Clear any previous execution status from nodes
      setNodes(prevNodes => 
        prevNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            executionStatus: null
          }
        }))
      );
      
      const result = await executeWorkflowAPI(workflow._id, agentId);
      console.log('Workflow execution started:', result);
      
      // Show success message
      setSuccessMessage('Workflow execution started successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Optional: Navigate to execution details after a delay
      if (result.execution?.id) {
        setTimeout(() => {
          if (window.confirm('Would you like to view the execution details?')) {
            navigate(`/executions/${result.execution.id}`);
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Error executing workflow:', err);
      setError(`Failed to execute workflow: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Handle workflow name change
  const handleWorkflowNameChange = (newName) => {
    setWorkflow(prev => ({
      ...prev,
      name: newName
    }));
    setUnsavedChanges(true);
  };
  
  // Handle workflow description change
  const handleWorkflowDescriptionChange = (newDescription) => {
    setWorkflow(prev => ({
      ...prev,
      description: newDescription
    }));
    setUnsavedChanges(true);
  };
  
  // Handle back navigation
  const handleBack = () => {
    if (unsavedChanges) {
      const confirm = window.confirm('You have unsaved changes. Do you want to save before leaving?');
      if (confirm) {
        saveWorkflow().then(() => navigate('/workflows'));
        return;
      }
    }
    navigate('/workflows');
  };
  
  // Import workflow JSON
  const importWorkflow = () => {
    try {
      const input = prompt('Paste workflow JSON:');
      if (!input) return;
      
      const importedWorkflow = JSON.parse(input);
      
      // Set workflow data
      setWorkflow({
        ...defaultWorkflow,
        ...importedWorkflow,
        name: importedWorkflow.name || 'Imported Workflow',
        _id: workflow?._id // Keep current ID if editing
      });
      
      // Convert nodes and edges
      if (importedWorkflow.nodes) {
        setNodes(importedWorkflow.nodes.map(node => ({
          ...node,
          position: node.position || { x: 100, y: 100 },
          data: { 
            ...node.data,
            label: node.data?.label || getDefaultNodeLabel(node.type) 
          }
        })));
      }
      
      if (importedWorkflow.edges) {
        setEdges(importedWorkflow.edges);
      }
      
      // Import variables
      if (importedWorkflow.variables) {
        Object.entries(importedWorkflow.variables).forEach(([category, vars]) => {
          Object.entries(vars).forEach(([name, value]) => {
            setVariable(name, value, category);
          });
        });
      }
      
      setUnsavedChanges(true);
      setSuccessMessage('Workflow imported successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError('Invalid workflow JSON. Please check the format.');
    }
  };
  
  // Export workflow JSON
  const exportWorkflow = () => {
    if (!workflow) return;
    
    try {
      const variables = exportVariables ? JSON.parse(exportVariables()) : {};
      
      const workflowData = {
        ...workflow,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data
        })),
        edges: edges,
        variables
      };
      
      // Create and download JSON file
      const json = JSON.stringify(workflowData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${workflow.name || 'workflow'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccessMessage('Workflow exported successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError('Failed to export workflow. Please try again.');
    }
  };
  
  // Toggle variables panel
  const toggleVariablesPanel = () => {
    setShowVariablesPanel(prev => !prev);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="workflow-editor loading-container">
        <div className="loading">
          <i className="fa fa-spinner fa-spin"></i> Loading workflow...
        </div>
      </div>
    );
  }
  
  return (
    <div className="workflow-editor">
      {/* Editor Toolbar */}
      <WorkflowToolbar 
        workflow={workflow}
        onSave={saveWorkflow}
        onExecute={executeWorkflow}
        onExport={exportWorkflow}
        onImport={importWorkflow}
        isSaving={isSaving}
        isExecuting={isExecuting}
        hasUnsavedChanges={unsavedChanges}
        onBack={handleBack}
        onNameChange={handleWorkflowNameChange}
      />
      
      {/* Messages */}
      {error && (
        <div className="error-message">
          <i className="fa fa-exclamation-triangle"></i> {error}
          <button className="close-btn" onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          <i className="fa fa-check-circle"></i> {successMessage}
          <button className="close-btn" onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}
      
      {/* No agents warning */}
      {availableAgents.length === 0 && (
        <div className="warning-message">
          <i className="fa fa-exclamation-triangle"></i> No online agents available. 
          Workflow execution requires at least one agent to be running.
        </div>
      )}
      
      {/* Editor Layout */}
      <div className="editor-layout">
        {/* Node Panel */}
        <NodePanel width={nodePanelWidth} />
        
        {/* Flow Canvas */}
        <ReactFlowProvider>
          <div className="editor-canvas" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            >
              <Controls />
              <MiniMap 
                nodeStrokeColor={(n) => {
                  if (n.type === 'scriptNode') return '#0041d0';
                  if (n.type === 'conditionNode') return '#ff0072';
                  if (n.type === 'variableNode') return '#a5b4fc';
                  if (n.type === 'httpNode') return '#c4b5fd';
                  return '#1a192b';
                }}
                nodeColor={(n) => {
                  if (n.type === 'scriptNode') return '#dbeafe';
                  if (n.type === 'conditionNode') return '#fef3c7';
                  if (n.type === 'variableNode') return '#e0e7ff';
                  if (n.type === 'httpNode') return '#ede9fe';
                  return '#fff';
                }}
                style={{
                  backgroundColor: '#f8f8f8',
                  border: '1px solid #ddd'
                }}
              />
              <Background color="#aaa" gap={16} />
              
              {/* Panel for variables button */}
              <Panel position="top-right">
                <button 
                  className="btn btn-icon workflow-panel-toggle"
                  title={showVariablesPanel ? 'Hide Variables' : 'Show Variables'}
                  onClick={toggleVariablesPanel}
                >
                  <i className={`fa fa-${showVariablesPanel ? 'times' : 'cube'}`}></i>
                </button>
              </Panel>
            </ReactFlow>
          </div>
        </ReactFlowProvider>
        
        {/* Properties Panel */}
        {selectedNode && (
          <PropertiesPanel 
            node={selectedNode} 
            onUpdate={onNodeUpdate} 
            onClose={() => setSelectedNode(null)} 
            width={propertiesPanelWidth}
          />
        )}
        
        {/* Variables Panel */}
        {showVariablesPanel && (
          <VariablesPanel onClose={() => setShowVariablesPanel(false)} />
        )}
      </div>
      
      {/* Hidden form for workflow metadata */}
      {workflow && (
        <div style={{ display: 'none' }}>
          <input
            type="text"
            value={workflow.description || ''}
            onChange={(e) => handleWorkflowDescriptionChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

// Wrapper with WorkflowVariablesProvider
const WorkflowEditor = () => {
  const { id } = useParams();
  
  return (
    <WorkflowVariablesProvider workflowId={id}>
      <WorkflowEditorContent />
    </WorkflowVariablesProvider>
  );
};

export default WorkflowEditor;