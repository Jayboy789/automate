// client/src/components/workflow/WorkflowToolbar.jsx
import React, { useState } from 'react';

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
  const [isEditing, setIsEditing] = useState(false);
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'New Workflow');
  
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
                  alert('Workflow validation not implemented yet');
                }}
              >
                <i className="fa fa-check-circle"></i> Validate Workflow
              </button>
            </div>
          )}
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={onExecute}
          disabled={isExecuting || !workflow?._id}
        >
          <i className={isExecuting ? "fa fa-spinner fa-spin" : "fa fa-play"}></i>
          {isExecuting ? 'Executing...' : 'Execute'}
        </button>
      </div>
    </div>
  );
};

export default WorkflowToolbar;