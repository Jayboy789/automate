// client/src/components/workflow/VariablesPanel.jsx
import React, { useState, useEffect } from 'react';
import { useWorkflowVariables } from '../../contexts/WorkflowVariablesContext';

const VariablesPanel = ({ onClose }) => {
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
  const [newVarCategory, setNewVarCategory] = useState('user');
  const [editingVar, setEditingVar] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Get all variables in flat list format
  const allVariables = getAllVariables();
  
  // Filter variables based on active category
  const filteredVariables = activeCategory === 'all' 
    ? allVariables 
    : allVariables.filter(v => v.category === activeCategory);
  
  // Add a new variable
  const handleAddVariable = () => {
    if (!newVarName.trim()) {
      setError('Variable name is required');
      return;
    }
    
    // Validate variable name format
    const nameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!nameRegex.test(newVarName)) {
      setError('Variable name must start with a letter and contain only letters, numbers, and underscores');
      return;
    }
    
    // Check if variable already exists
    const exists = allVariables.some(v => 
      v.category === newVarCategory && v.name === newVarName
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
    
    addVariable(newVarName, parsedValue, newVarCategory);
    
    // Reset form
    setNewVarName('');
    setNewVarValue('');
    setError('');
  };
  
  // Start editing a variable
  const handleStartEdit = (category, name, value) => {
    setEditingVar({ 
      category, 
      name, 
      value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value) 
    });
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
    
    try {
      const variables = JSON.parse(importText);
      
      // Validate the structure
      if (typeof variables !== 'object') {
        setError('Invalid variables format. Expected an object.');
        return;
      }
      
      // Process each category
      let importCount = 0;
      Object.entries(variables).forEach(([category, vars]) => {
        if (typeof vars !== 'object') return;
        
        // Import each variable
        Object.entries(vars).forEach(([name, value]) => {
          addVariable(name, value, category);
          importCount++;
        });
      });
      
      setImportText('');
      setShowImport(false);
      setError('');
      
      // Show success message
      alert(`Successfully imported ${importCount} variables.`);
    } catch (error) {
      setError('Invalid JSON format: ' + error.message);
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
          <button 
            className="panel-action-btn" 
            title="Close Panel"
            onClick={onClose}
          >
            <i className="fa fa-times"></i>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="variable-error">
          <i className="fa fa-exclamation-triangle"></i> {error}
        </div>
      )}
      
      {/* Category selector */}
      <div className="category-selector">
        <button 
          className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All
        </button>
        <button 
          className={`category-btn ${activeCategory === 'system' ? 'active' : ''}`}
          onClick={() => setActiveCategory('system')}
        >
          System
        </button>
        <button 
          className={`category-btn ${activeCategory === 'workflow' ? 'active' : ''}`}
          onClick={() => setActiveCategory('workflow')}
        >
          Workflow
        </button>
        <button 
          className={`category-btn ${activeCategory === 'user' ? 'active' : ''}`}
          onClick={() => setActiveCategory('user')}
        >
          User
        </button>
      </div>
      
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
          <div className="form-row">
            <select
              value={newVarCategory}
              onChange={(e) => setNewVarCategory(e.target.value)}
              className="category-select"
            >
              <option value="user">User</option>
              <option value="workflow">Workflow</option>
              {/* System variables are read-only */}
            </select>
            <input
              type="text"
              placeholder="Variable name"
              value={newVarName}
              onChange={(e) => setNewVarName(e.target.value)}
              className="var-name-input"
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              placeholder="Value"
              value={newVarValue}
              onChange={(e) => setNewVarValue(e.target.value)}
              className="var-value-input"
            />
            <button 
              className="btn btn-sm btn-primary"
              onClick={handleAddVariable}
            >
              Add
            </button>
          </div>
        </div>
      </div>
      
      {/* Variables List */}
      <div className="variables-list">
        {filteredVariables.length === 0 ? (
          <div className="empty-variables">
            {activeCategory === 'all' 
              ? 'No variables defined yet.' 
              : `No ${activeCategory} variables defined yet.`}
          </div>
        ) : (
          filteredVariables.map((v) => (
            <div 
              key={`${v.category}.${v.name}`} 
              className={`variable-item ${v.category === 'system' ? 'readonly' : ''}`}
            >
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
                    <div className="variable-meta">
                      <span className={`category-badge category-${v.category}`}>
                        {v.category}
                      </span>
                      <span className="variable-name">{v.name}</span>
                    </div>
                    <div className="variable-value">
                      {typeof v.value === 'object' 
                        ? JSON.stringify(v.value) 
                        : String(v.value)}
                    </div>
                  </div>
                  
                  {v.category !== 'system' && (
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
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
      
      <div className="variables-help">
        <h4>Using Variables in Workflow</h4>
        <p>Reference variables in workflow nodes using the format: <code>{"{{category.name}}"}</code></p>
        <p>Examples:</p>
        <ul>
          <li><code>{"{{user.myVariable}}"}</code> - Reference a user variable</li>
          <li><code>{"{{workflow.status}}"}</code> - Reference a workflow variable</li>
          <li><code>{"{{system.workflowId}}"}</code> - Reference a system variable</li>
        </ul>
      </div>
    </div>
  );
};

export default VariablesPanel;