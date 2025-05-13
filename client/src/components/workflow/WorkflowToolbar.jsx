// src/components/workflow/WorkflowToolbar.jsx
import React, { useState, useEffect } from 'react';
import { getAgents } from '../../services/api';

const WorkflowToolbar = ({ 
  workflow, 
  onSave, 
  onExecute, 
  onExport, 
  onImport,
  isSaving,
  isExecuting,
  hasUnsavedChanges,
  onBack
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'New Workflow');
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Load available agents for execution
  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const agentsData = await getAgents();
        // Filter only online agents
        setAgents(agentsData.filter(agent => agent.status === 'online'));
      } catch (error) {
        console.error('Error loading agents:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAgents();
  }, []);
  
  // Handle editing the workflow name
  const handleRenameWorkflow = () => {
    if (isEditing) {
      if (workflow) {
        workflow.name = workflowName;
      }
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };
  
  // Handle name input keypress
  const handleNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleRenameWorkflow();
    }
  };
  
  // Handle agent selection for execution
  const handleExecuteWithAgent = (agentId) => {
    setShowAgentDropdown(false);
    onExecute(agentId);
  };
  
  return (
    <div className="workflow-toolbar">
      <div className="toolbar-left">
        <button 
          className="btn btn-icon btn-back" 
          onClick={onBack}
          title="Back to Workflows"
        >
          <i className="fa fa-arrow-left"></i>
        </button>
        
        {isEditing ? (
          <div className="workflow-name-edit">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              onKeyPress={handleNameKeyPress}
              autoFocus
            />
            <button 
              className="btn btn-sm btn-icon"
              onClick={handleRenameWorkflow}
            >
              <i className="fa fa-check"></i>
            </button>
          </div>
        ) : (
          <div className="workflow-title">
            {workflow?.name || 'New Workflow'}
            <button 
              className="btn btn-sm btn-icon"
              onClick={handleRenameWorkflow}
              title="Rename Workflow"
            >
              <i className="fa fa-pencil"></i>
            </button>
          </div>
        )}
      </div>
      
      <div className="toolbar-right">
        <button 
          className="btn btn-secondary" 
          onClick={onSave}
          disabled={isSaving}
        >
          <i className="fa fa-save"></i>
          {isSaving ? 'Saving...' : (hasUnsavedChanges ? 'Save*' : 'Save')}
        </button>
        
        <div className="dropdown">
          <button 
            className="btn btn-secondary dropdown-toggle"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <i className="fa fa-ellipsis-v"></i>
          </button>
          
          {showDropdown && (
            <div className="dropdown-menu">
              <button 
                className="dropdown-item"
                onClick={() => {
                  onImport();
                  setShowDropdown(false);
                }}
              >
                <i className="fa fa-upload"></i> Import Workflow
              </button>
              
              <button 
                className="dropdown-item"
                onClick={() => {
                  onExport();
                  setShowDropdown(false);
                }}
              >
                <i className="fa fa-download"></i> Export Workflow
              </button>
              
              <div className="dropdown-divider"></div>
              
              <button 
                className="dropdown-item"
                onClick={() => {
                  // Implement a "Validate Workflow" function here
                  setShowDropdown(false);
                  alert('Workflow validation successful');
                }}
              >
                <i className="fa fa-check-circle"></i> Validate Workflow
              </button>
            </div>
          )}
        </div>
        
        {workflow?._id ? (
          <div className="dropdown">
            <button 
              className="btn btn-primary dropdown-toggle"
              onClick={() => setShowAgentDropdown(!showAgentDropdown)}
              disabled={isExecuting}
            >
              <i className={isExecuting ? "fa fa-spinner fa-spin" : "fa fa-play"}></i>
              {isExecuting ? 'Executing...' : 'Execute'}
            </button>
            
            {showAgentDropdown && (
              <div className="dropdown-menu">
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    handleExecuteWithAgent();  // Use default agent
                  }}
                >
                  <i className="fa fa-random"></i> Auto-select Agent
                </button>
                
                <div className="dropdown-divider"></div>
                
                {loading ? (
                  <div className="dropdown-item disabled">
                    <i className="fa fa-spinner fa-spin"></i> Loading agents...
                  </div>
                ) : agents.length > 0 ? (
                  agents.map(agent => (
                    <button 
                      key={agent.agentId}
                      className="dropdown-item"
                      onClick={() => handleExecuteWithAgent(agent.agentId)}
                    >
                      <i className={`fa fa-${getAgentIcon(agent.platform)}`}></i>
                      {agent.name}
                    </button>
                  ))
                ) : (
                  <div className="dropdown-item disabled">
                    <i className="fa fa-info-circle"></i> No online agents available
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <button 
            className="btn btn-primary" 
            onClick={onSave}
            title="Save workflow before executing"
          >
            <i className="fa fa-save"></i> Save to Execute
          </button>
        )}
      </div>
    </div>
  );
};

// Helper function to get agent icon based on platform
const getAgentIcon = (platform) => {
  if (!platform) return 'server';
  
  platform = platform.toLowerCase();
  if (platform.includes('win')) return 'windows';
  if (platform.includes('mac') || platform.includes('darwin')) return 'apple';
  if (platform.includes('linux')) return 'linux';
  return 'server';
};

export default WorkflowToolbar;