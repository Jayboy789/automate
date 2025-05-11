import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getScripts, deleteScript, cloneScript } from '../../services/api';
import { getClients } from '../../services/api';

const ScriptsList = () => {
  const [scripts, setScripts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    search: '',
    language: '',
    clientId: ''
  });
  
  // Load scripts and clients
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch data in parallel
        const [scriptsData, clientsData] = await Promise.all([
          getScripts(),
          getClients()
        ]);
        
        setScripts(scriptsData);
        setClients(clientsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load scripts. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };
  
  // Apply filters
  const filteredScripts = scripts.filter(script => {
    // Search filter
    if (filter.search && 
        !script.name.toLowerCase().includes(filter.search.toLowerCase()) &&
        !(script.description && script.description.toLowerCase().includes(filter.search.toLowerCase())) &&
        !(script.tags && script.tags.some(tag => tag.toLowerCase().includes(filter.search.toLowerCase())))) {
      return false;
    }
    
    // Language filter
    if (filter.language && script.language !== filter.language) {
      return false;
    }
    
    // Client filter
    if (filter.clientId) {
      if (filter.clientId === 'public') {
        return script.isPublic;
      } else if (filter.clientId === 'nopublic') {
        return !script.isPublic;
      } else if (script.clientId?._id !== filter.clientId) {
        return false;
      }
    }
    
    return true;
  });
  
  // Delete script
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this script?')) {
      return;
    }
    
    try {
      await deleteScript(id);
      
      // Remove from list
      setScripts(scripts.filter(script => script._id !== id));
    } catch (err) {
      console.error('Error deleting script:', err);
      alert('Failed to delete script. Please try again.');
    }
  };
  
  // Clone script
  const handleClone = async (id) => {
    try {
      const result = await cloneScript(id);
      
      // Add to list
      setScripts([result, ...scripts]);
    } catch (err) {
      console.error('Error cloning script:', err);
      alert('Failed to clone script. Please try again.');
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Render loading state
  if (loading) {
    return <div className="loading">Loading scripts...</div>;
  }
  
  // Render error state
  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="scripts-page">
      <div className="page-header">
        <h1>Scripts</h1>
        <Link to="/scripts/new" className="btn btn-primary">
          <i className="fa fa-plus"></i> New Script
        </Link>
      </div>
      
      {/* Filters */}
      <div className="filters">
        <div className="filter-item">
          <input
            type="text"
            name="search"
            placeholder="Search scripts..."
            value={filter.search}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
        
        <div className="filter-item">
          <select
            name="language"
            value={filter.language}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Languages</option>
            <option value="PowerShell">PowerShell</option>
            <option value="Python">Python</option>
            <option value="JavaScript">JavaScript</option>
            <option value="Bash">Bash</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="filter-item">
          <select
            name="clientId"
            value={filter.clientId}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Clients</option>
            <option value="public">Public Scripts</option>
            <option value="nopublic">Non-Public Scripts</option>
            {clients.map(client => (
              <option key={client._id} value={client._id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {filteredScripts.length === 0 ? (
        <div className="empty-state">
          <i className="fa fa-code empty-icon"></i>
          <h2>No scripts found</h2>
          <p>
            {scripts.length === 0 
              ? 'Create your first script to get started'
              : 'Try adjusting your filters'}
          </p>
          {scripts.length === 0 && (
            <Link to="/scripts/new" className="btn btn-primary">
              Create Script
            </Link>
          )}
        </div>
      ) : (
        <div className="scripts-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Language</th>
                <th>Client</th>
                <th>Tags</th>
                <th>Last Modified</th>
                <th>Version</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredScripts.map((script) => (
                <tr key={script._id}>
                  <td>
                    <Link to={`/scripts/${script._id}`} className="script-name">
                      {script.name || 'Untitled Script'}
                    </Link>
                    {script.description && (
                      <div className="script-description">
                        {script.description.length > 50 
                          ? `${script.description.substring(0, 50)}...` 
                          : script.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`language-badge language-${script.language.toLowerCase()}`}>
                      {script.language}
                    </span>
                  </td>
                  <td>
                    {script.clientId ? (
                      <span className="client-badge">
                        {script.clientId.name || 'Unknown Client'}
                      </span>
                    ) : (
                      <span className={`public-badge ${script.isPublic ? 'public' : 'private'}`}>
                        {script.isPublic ? 'Public' : 'Private'}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="tags">
                      {script.tags && script.tags.map(tag => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{formatDate(script.updatedAt)}</td>
                  <td>v{script.version}</td>
                  <td>
                    <div className="action-buttons">
                      <Link 
                        to={`/scripts/${script._id}`}
                        className="btn-icon"
                        title="Edit"
                      >
                        <i className="fa fa-edit"></i>
                      </Link>
                      
                      <button 
                        className="btn-icon"
                        title="Clone"
                        onClick={() => handleClone(script._id)}
                      >
                        <i className="fa fa-copy"></i>
                      </button>
                      
                      <button 
                        className="btn-icon btn-icon-danger"
                        title="Delete"
                        onClick={() => handleDelete(script._id)}
                      >
                        <i className="fa fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ScriptsList;