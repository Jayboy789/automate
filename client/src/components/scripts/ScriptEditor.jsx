import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getScript, createScript, updateScript, getClients } from '../../services/api';

const ScriptEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewScript = id === 'new';
  
  // Script state
  const [script, setScript] = useState({
    name: '',
    description: '',
    content: '',
    language: 'PowerShell',
    tags: [],
    clientId: '',
    isPublic: false
  });
  
  // UI state
  const [loading, setLoading] = useState(!isNewScript);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  // Load script and clients
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch clients in all cases
        const clientsData = await getClients();
        setClients(clientsData);
        
        // Fetch script if editing existing one
        if (!isNewScript) {
          const scriptData = await getScript(id);
          
          // Format script data
          setScript({
            ...scriptData,
            clientId: scriptData.clientId?._id || '',
            tags: scriptData.tags || []
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load script data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isNewScript]);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setScript(prev => ({ ...prev, [name]: newValue }));
    setUnsavedChanges(true);
  };
  
  // Handle tag input
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };
  
  // Add tag
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    const newTag = tagInput.trim();
    
    if (!script.tags.includes(newTag)) {
      setScript(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setUnsavedChanges(true);
    }
    
    setTagInput('');
  };
  
  // Add tag on Enter key
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  // Remove tag
  const handleRemoveTag = (tag) => {
    setScript(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
    setUnsavedChanges(true);
  };
  
  // Save script
  const handleSave = async () => {
    // Validate required fields
    if (!script.name || !script.content) {
      setError('Name and content are required');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      let savedScript;
      
      if (isNewScript) {
        // Create new script
        savedScript = await createScript(script);
      } else {
        // Update existing script
        savedScript = await updateScript(id, script);
      }
      
      // Update UI with saved script
      setScript({
        ...savedScript,
        clientId: savedScript.clientId?._id || '',
        tags: savedScript.tags || []
      });
      
      setUnsavedChanges(false);
      
      // Navigate to script editor with saved ID if this was a new script
      if (isNewScript) {
        navigate(`/scripts/${savedScript._id}`, { replace: true });
      }
    } catch (err) {
      console.error('Error saving script:', err);
      setError('Failed to save script. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    if (unsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
      return;
    }
    
    navigate('/scripts');
  };
  
  // Render loading state
  if (loading) {
    return <div className="loading">Loading script data...</div>;
  }
  
  return (
    <div className="script-editor">
      <div className="page-header">
        <h1>{isNewScript ? 'New Script' : 'Edit Script'}</h1>
        <div className="header-actions">
          <button 
            className="btn btn-secondary" 
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : (unsavedChanges ? 'Save*' : 'Save')}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="editor-container">
        <div className="editor-sidebar">
          <div className="form-group">
            <label htmlFor="name">Script Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={script.name}
              onChange={handleChange}
              placeholder="Enter script name"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={script.description}
              onChange={handleChange}
              placeholder="Enter description"
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="language">Language</label>
            <select
              id="language"
              name="language"
              value={script.language}
              onChange={handleChange}
            >
              <option value="PowerShell">PowerShell</option>
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Bash">Bash</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="clientId">Client</label>
            <select
              id="clientId"
              name="clientId"
              value={script.clientId}
              onChange={handleChange}
            >
              <option value="">No Client</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Tags</label>
            <div className="tags-input">
              <div className="tags-container">
                {script.tags.map(tag => (
                  <div key={tag} className="tag">
                    <span>{tag}</span>
                    <button 
                      type="button" 
                      className="tag-remove" 
                      onClick={() => handleRemoveTag(tag)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <div className="tags-add">
                <input
                  type="text"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add tag..."
                />
                <button 
                  type="button" 
                  className="tag-add-btn"
                  onClick={handleAddTag}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isPublic"
                checked={script.isPublic}
                onChange={handleChange}
              />
              Public Script
            </label>
            <div className="help-text">
              Public scripts are available to all users
            </div>
          </div>
          
          {!isNewScript && (
            <div className="script-info">
              <div className="info-item">
                <span className="info-label">Version:</span>
                <span className="info-value">v{script.version || 1}</span>
              </div>
              {script.createdBy && (
                <div className="info-item">
                  <span className="info-label">Created By:</span>
                  <span className="info-value">{script.createdBy.name}</span>
                </div>
              )}
              {script.updatedAt && (
                <div className="info-item">
                  <span className="info-label">Last Modified:</span>
                  <span className="info-value">
                    {new Date(script.updatedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="editor-main">
          <div className="form-group code-editor">
            <label htmlFor="content">Script Content</label>
            <textarea
              id="content"
              name="content"
              value={script.content}
              onChange={handleChange}
              placeholder="Enter your script here..."
              rows={20}
              className="code-textarea"
              spellCheck="false"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptEditor;