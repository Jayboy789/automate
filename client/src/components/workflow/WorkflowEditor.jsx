import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

import { getWorkflow, updateWorkflow, createWorkflow, executeWorkflow } from '../../services/api';
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
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showVariablesPanel, setShowVariablesPanel] = useState(false);
  const [nodePanelWidth, setNodePanelWidth] = useState(240);
  const [propertiesPanelWidth, setPropertiesPanelWidth] = useState(320);
  
  // Variables context
  const { setVariable } = useWorkflowVariables();
  
  // Load workflow data
  useEffect(() => {
    const loadWorkflow = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (id === 'new') {
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
  }, [id, setVariable]);
  
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
          
          // In a real app, you'd show a toast notification here
          alert(statusMessage);
        }
      }
    });
    
    return unsubscribe;
  }, [workflow, on]);
  
  // Mark unsaved changes when nodes or edges change
  useEffect(() => {
    if (workflow) {
      setUnsavedChanges(true);
    }
  }, [nodes, edges]);
  
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
      stringNode: 'String Operations'
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
      
      // Prepare workflow data
      const { getAllVariables, exportVariables } = useWorkflowVariables();
      const variables = exportVariables ? JSON.parse(exportVariables()) : {};
      
      const workflowData = {
        ...workflow,
        name: workflow.name,
        description: workflow.description,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data
        })),
        edges: edges,
        variables
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
      alert('Workflow saved successfully');
    } catch (err) {
      console.error('Error saving workflow:', err);
      setError('Failed to save workflow. Please try again.');
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
    
    // Additional validation can be added here
    
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
      const result = await executeWorkflow(workflow._id, agentId);
      console.log('Workflow execution started:', result);
      
      // Update UI to show execution status
      // In a real implementation, you would update the nodes based on execution status
      // For now, we'll just wait and redirect to execution details
      setTimeout(() => {
        setIsExecuting(false);
        navigate(`/executions/${result.execution.id}`);
      }, 2000);
    } catch (err) {
      console.error('Error executing workflow:', err);
      setError('Failed to execute workflow. Please try again.');
      setIsExecuting(false);
    }
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
        name: importedWorkflow.name || 'Imported Workflow'
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
        // Your code to import variables here
      }
      
      setUnsavedChanges(true);
    } catch (error) {
      setError('Invalid workflow JSON. Please check the format.');
    }
  };
  
  // Export workflow JSON
  const exportWorkflow = () => {
    if (!workflow) return;
    
    try {
      const workflowData = {
        ...workflow,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data
        })),
        edges: edges
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
    return <div className="loading">Loading workflow...</div>;
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
      />
      
      {error && (
        <div className="error-message">
          {error}
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
                  return '#1a192b';
                }}
                nodeColor={(n) => {
                  if (n.type === 'scriptNode') return '#bbf7d0';
                  if (n.type === 'conditionNode') return '#fef3c7';
                  return '#fff';
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