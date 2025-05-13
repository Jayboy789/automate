// client/src/contexts/WorkflowVariablesContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

// Create context
const WorkflowVariablesContext = createContext(null);

// Provider component
export const WorkflowVariablesProvider = ({ children, workflowId }) => {
  const [variables, setVariables] = useState({});
  const [variableHistory, setVariableHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load variables when workflowId changes
  useEffect(() => {
    const loadVariables = async () => {
      if (!workflowId || workflowId === 'new') return;
      
      setIsLoading(true);
      try {
        // In a real implementation, you'd load from backend
        // For now, initialize with some defaults based on node types in the workflow
        setVariables({
          workflow: {
            id: workflowId,
            startTime: new Date().toISOString(),
          },
          system: {
            date: new Date().toISOString(),
            environment: 'development',
          },
          // User-defined variables will be added here
        });
      } catch (error) {
        console.error('Error loading variables:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVariables();
  }, [workflowId]);

  // Add a new variable
  const addVariable = (name, value, category = 'user') => {
    if (!name) return;
    
    setVariables(prev => {
      // Create category if it doesn't exist
      const updatedVars = { ...prev };
      if (!updatedVars[category]) {
        updatedVars[category] = {};
      }
      
      // Add the variable
      updatedVars[category][name] = value;
      
      // Add to history
      setVariableHistory(prev => [
        ...prev,
        { action: 'add', category, name, value, timestamp: new Date() }
      ]);
      
      return updatedVars;
    });
  };

  // Update a variable
  const updateVariable = (name, value, category = 'user') => {
    setVariables(prev => {
      // Check if category and variable exist
      if (!prev[category] || prev[category][name] === undefined) {
        return prev;
      }
      
      // Update the variable
      const updatedVars = { 
        ...prev,
        [category]: {
          ...prev[category],
          [name]: value
        }
      };
      
      // Add to history
      setVariableHistory(prev => [
        ...prev,
        { action: 'update', category, name, 
          oldValue: prev[category][name], 
          newValue: value, 
          timestamp: new Date() 
        }
      ]);
      
      return updatedVars;
    });
  };

  // Delete a variable
  const deleteVariable = (name, category = 'user') => {
    setVariables(prev => {
      // Check if category and variable exist
      if (!prev[category] || prev[category][name] === undefined) {
        return prev;
      }
      
      // Create a new object without the variable
      const updatedCategory = { ...prev[category] };
      const oldValue = updatedCategory[name];
      delete updatedCategory[name];
      
      // Add to history
      setVariableHistory(prev => [
        ...prev,
        { action: 'delete', category, name, oldValue, timestamp: new Date() }
      ]);
      
      return {
        ...prev,
        [category]: updatedCategory
      };
    });
  };

  // Get flat list of all variables for selection dropdowns
  const getAllVariables = () => {
    const result = [];
    
    Object.entries(variables).forEach(([category, vars]) => {
      Object.entries(vars).forEach(([name, value]) => {
        result.push({
          fullPath: `${category}.${name}`,
          category,
          name,
          value,
          type: typeof value
        });
      });
    });
    
    return result;
  };

  // Get variable by path (e.g., "user.firstName")
  const getVariableByPath = (path) => {
    if (!path) return undefined;
    
    const [category, name] = path.split('.');
    return variables[category]?.[name];
  };

  // Export variables to JSON
  const exportVariables = () => {
    return JSON.stringify(variables, null, 2);
  };

  // Import variables from JSON
  const importVariables = (jsonString) => {
    try {
      const imported = JSON.parse(jsonString);
      setVariables(imported);
      
      // Add to history
      setVariableHistory(prev => [
        ...prev,
        { action: 'import', timestamp: new Date() }
      ]);
      
      return true;
    } catch (error) {
      console.error('Error importing variables:', error);
      return false;
    }
  };

  // Replace variable placeholders in text
  const resolvePlaceholders = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    return text.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
      const value = getVariableByPath(path);
      return value !== undefined ? value : match;
    });
  };

  // Context value
  const value = {
    variables,
    isLoading,
    variableHistory,
    addVariable,
    updateVariable,
    deleteVariable,
    getAllVariables,
    getVariableByPath,
    exportVariables,
    importVariables,
    resolvePlaceholders
  };

  return (
    <WorkflowVariablesContext.Provider value={value}>
      {children}
    </WorkflowVariablesContext.Provider>
  );
};

// Custom hook for using variables context
export const useWorkflowVariables = () => {
  const context = useContext(WorkflowVariablesContext);
  
  if (!context) {
    throw new Error('useWorkflowVariables must be used within a WorkflowVariablesProvider');
  }
  
  return context;
};

export default WorkflowVariablesContext;