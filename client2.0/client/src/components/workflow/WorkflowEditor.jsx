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
} from 'reactflow';
import 'reactflow/dist/style.css';

import { getWorkflow, updateWorkflow, createWorkflow, executeWorkflow } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import { nodeTypes } from './nodes/nodeTypes';
import NodePanel from './NodePanel';
import PropertiesPanel from './PropertiesPanel';

// Default workflow data
const defaultWorkflow = {
  name: 'New Workflow',
  description: '',
  nodes: [],
  edges: [],
  isActive: true
};

const WorkflowEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { on } = useSocket();
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
  
  // Load workflow data
  useEffect(() => {
    const loadWorkflow = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (id === 'new') {
          setWorkflow({ ...defaultWorkflow });
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
              label: node.data?.label || node.type 
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
        }
      } catch (err) {
        console.error('Error loading workflow:', err);
        setError('Failed to load workflow. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWorkflow();
  }, [id]);
  
  // Listen for workflow execution updates
  useEffect(() => {
    if (!workflow) return;
    
    const unsubscribe = on('execution:status', (data) => {
      // Display notification or update UI based on execution status
      console.log('Execution status update:', data);
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
      
      const newNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label: `New ${type}` },
      };
      
      setNodes((nds) => nds.concat(newNode));
      setSelectedNode(newNode);
    },
    [reactFlowInstance, setNodes, setSelectedNode]
  );
  
  // Handle node connections
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
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
      // Prepare workflow data
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
    } catch (err) {
      console.error('Error saving workflow:', err);
      setError('Failed to save workflow. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Execute workflow
  const executeCurrentWorkflow = async (agentId = null) => {
    if (!workflow._id) {
      setError('Please save the workflow before executing.');
      return;
    }
    
    setIsExecuting(true);
    setError(null);
    
    try {
      const result = await executeWorkflow(workflow._id, agentId);
      console.log('Workflow execution started:', result);
      
      // Navigate to execution details
      navigate(`/executions/${result.execution.id}`);
    } catch (err) {
      console.error('Error executing workflow:', err);
      setError('Failed to execute workflow. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return <div className="loading">Loading workflow...</div>;
  }
  
  return (
    <div className="workflow-editor">
      {/* Editor Toolbar */}
      <div className="editor-toolbar">
        <div className="workflow-title">
          {workflow?.name || 'New Workflow'}
        </div>
        
        <div className="toolbar-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/workflows')}
          >
            <i className="fa fa-arrow-left"></i> Back
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={saveWorkflow}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : (unsavedChanges ? 'Save*' : 'Save')}
          </button>
          
          {workflow?._id && (
            <button 
              className="btn btn-success" 
              onClick={() => executeCurrentWorkflow()}
              disabled={isExecuting}
            >
              {isExecuting ? 'Executing...' : 'Execute Workflow'}
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      {/* Editor Layout */}
      <div className="editor-layout">
        {/* Node Panel */}
        <NodePanel />
        
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
            >
              <Controls />
              <MiniMap />
              <Background color="#aaa" gap={16} />
            </ReactFlow>
          </div>
        </ReactFlowProvider>
        
        {/* Properties Panel */}
        {selectedNode && (
          <PropertiesPanel 
            node={selectedNode} 
            onUpdate={onNodeUpdate} 
            onClose={() => setSelectedNode(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default WorkflowEditor;