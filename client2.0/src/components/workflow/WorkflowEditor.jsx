import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
} from 'react-flow-renderer';
import { useParams } from 'react-router-dom';
import NodePanel from './NodePanel';
import PropertiesPanel from './PropertiesPanel';
import { getWorkflow, saveWorkflow } from '../../services/api';
import { nodeTypes } from './nodes/nodeTypes';

const WorkflowEditor = () => {
  const { id } = useParams();
  const [workflow, setWorkflow] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load workflow data
  useEffect(() => {
    if (id && id !== 'new') {
      getWorkflow(id).then(data => {
        setWorkflow(data);
        setNodes(data.nodes);
        setEdges(data.edges);
      });
    }
  }, [id]);

  // Handle adding new nodes
  const onAddNode = (nodeType) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: nodeType,
      position: { x: 250, y: 250 },
      data: { label: `New ${nodeType}` }
    };
    setNodes(nodes => [...nodes, newNode]);
  };

  // Handle connections
  const onConnect = useCallback((params) => {
    setEdges(edges => addEdge(params, edges));
  }, []);

  // Handle node selection
  const onNodeClick = (_, node) => {
    setSelectedNode(node);
  };

  // Handle node update
  const onNodeUpdate = (updatedNode) => {
    setNodes(nodes => 
      nodes.map(node => (node.id === updatedNode.id ? updatedNode : node))
    );
  };

  // Save workflow
  const saveCurrentWorkflow = async () => {
    if (!workflow) return;
    
    setSaving(true);
    try {
      const updatedWorkflow = {
        ...workflow,
        nodes,
        edges
      };
      await saveWorkflow(id, updatedWorkflow);
    } catch (error) {
      console.error('Error saving workflow:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="workflow-editor">
      <div className="editor-toolbar">
        <button onClick={saveCurrentWorkflow} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      
      <div className="editor-layout">
        <NodePanel onAddNode={onAddNode} />
        
        <div className="editor-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
        
        {selectedNode && (
          <PropertiesPanel 
            node={selectedNode} 
            onUpdate={onNodeUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default WorkflowEditor;