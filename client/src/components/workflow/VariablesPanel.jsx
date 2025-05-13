// client/src/components/workflow/VariablesPanel.jsx
import React, { useState } from 'react';
import { useWorkflowVariables } from '../../contexts/WorkflowVariablesContext';

const VariablesPanel = () => {
  const { 
    variables, 
    addVariable, 
    updateVariable, 
    deleteVariable,
    getAllVariables, 
    exportVariables, 
    importVariables 
  } = useWorkflowVariables();
  
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [editingVar, setEditingVar] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [error, setError] = useState('');
  
  // Get all variables in flat list format
  const allVariables = getAllVariables();
  
  // Add a new variable
  const handleAddVariable = () => {
    if (!newVarName.trim()) {
      setError('Variable name is required');
      return;
    }
    
    // Check if variable already exists
    const exists = allVariables.some(v => 
      v.category === 'user' && v.name === newVarName
    );
    
    if (exists) {
      setError('A variable with this name already exists');
      return;
    }
    
    // Try to parse the value as JSON if possible
    let parsedValue = newVarValue;
    try {
      if (newVarValue.trim().startsWith('{') || 
          newVarValue.trim().startsWith('[') ||
          newVarValue.trim() === 'true' ||
          newVarValue.trim() === 'false' ||
          !isNaN(Number(newVarValue))) {
        parsedValue = JSON.parse(newVarValue);
      }
    } catch (e) {
      // If parsing fails, keep as string
    }
    
    addVariable(newVarName, parsedValue);
    
    // Reset form
    setNewVarName('');
    setNewVarValue('');
    setError('');
  };
  
  // Start editing a variable
  const handleStartEdit = (category, name, value) => {
    setEditingVar({ category, name, value: JSON.stringify(value) });
  };
  
  // Save edited variable
  const handleSaveEdit = () => {
    if (!editingVar) return;
    
    // Try to parse the value as JSON if possible
    let parsedValue = editingVar.value;
    try {
      parsedValue = JSON.parse(editingVar.value);
    } catch (e) {
      // If parsing fails, keep as string
    }
    
    updateVariable(editingVar.name, parsedValue, editingVar.category);
    setEditingVar(null);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingVar(null);
  };
  
  // Import variables from JSON
  const handleImportVariables = () => {
    if (!importText.trim()) {
      setError('Import text is empty');
      return;
    }
    
    const success = importVariables(importText);
    if (success) {
      setImportText('');
      setShowImport(false);
      setError('');
    } else {
      setError('Invalid JSON format');
    }
  };
  
  // Export variables to JSON
  const handleExportVariables = () => {
    const json = exportVariables();
    
    // Create and download file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'workflow_variables.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="variables-panel">
      <div className="panel-header">
        <h3>Workflow Variables</h3>
        <div className="panel-actions">
          <button 
            className="panel-action-btn" 
            title="Import Variables"
            onClick={() => setShowImport(!showImport)}
          >
            <i className="fa fa-upload"></i>
          </button>
          <button 
            className="panel-action-btn" 
            title="Export Variables"
            onClick={handleExportVariables}
          >
            <i className="fa fa-download"></i>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="variable-error">
          <i className="fa fa-exclamation-triangle"></i> {error}
        </div>
      )}
      
      {/* Import Panel */}
      {showImport && (
        <div className="import-panel">
          <textarea
            placeholder="Paste variables JSON here..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={5}
          />
          <div className="import-actions">
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => setShowImport(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-sm btn-primary"
              onClick={handleImportVariables}
            >
              Import
            </button>
          </div>
        </div>
      )}
      
      {/* Add New Variable */}
      <div className="add-variable">
        <h4>Add New Variable</h4>
        <div className="add-variable-form">
          <input
            type="text"
            placeholder="Variable name"
            value={newVarName}
            onChange={(e) => setNewVarName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Value"
            value={newVarValue}
            onChange={(e) => setNewVarValue(e.target.value)}
          />
          <button 
            className="btn btn-sm btn-primary"
            onClick={handleAddVariable}
          >
            Add
          </button>
        </div>
      </div>
      
      {/* Variables List */}
      <div className="variables-list">
        <h4>System Variables</h4>
        <div className="variables-category">
          {allVariables
            .filter(v => v.category === 'system')
            .map((v) => (
              <div key={`${v.category}.${v.name}`} className="variable-item readonly">
                <div className="variable-info">
                  <div className="variable-name">{v.name}</div>
                  <div className="variable-value">{JSON.stringify(v.value)}</div>
                </div>
                <div className="variable-type">{v.type}</div>
              </div>
            ))}
        </div>
        
        <h4>Workflow Variables</h4>
        <div className="variables-category">
          {allVariables
            .filter(v => v.category === 'workflow')
            .map((v) => (
              <div key={`${v.category}.${v.name}`} className="variable-item readonly">
                <div className="variable-info">
                  <div className="variable-name">{v.name}</div>
                  <div className="variable-value">{JSON.stringify(v.value)}</div>
                </div>
                <div className="variable-type">{v.type}</div>
              </div>
            ))}
        </div>
        
        <h4>User Variables</h4>
        <div className="variables-category">
          {allVariables
            .filter(v => v.category === 'user')
            .map((v) => (
              <div key={`${v.category}.${v.name}`} className="variable-item">
                {editingVar && editingVar.category === v.category && editingVar.name === v.name ? (
                  <div className="variable-edit">
                    <input
                      type="text"
                      value={editingVar.value}
                      onChange={(e) => setEditingVar({...editingVar, value: e.target.value})}
                    />
                    <div className="edit-actions">
                      <button 
                        className="btn-icon" 
                        onClick={handleSaveEdit}
                        title="Save"
                      >
                        <i className="fa fa-check"></i>
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={handleCancelEdit}
                        title="Cancel"
                      >
                        <i className="fa fa-times"></i>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="variable-info">
                      <div className="variable-name">{v.name}</div>
                      <div className="variable-value">{JSON.stringify(v.value)}</div>
                    </div>
                    <div className="variable-actions">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleStartEdit(v.category, v.name, v.value)}
                        title="Edit"
                      >
                        <i className="fa fa-pencil"></i>
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => deleteVariable(v.name, v.category)}
                        title="Delete"
                      >
                        <i className="fa fa-trash"></i>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            
          {allVariables.filter(v => v.category === 'user').length === 0 && (
            <div className="empty-variables">
              No user variables defined yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VariablesPanel;