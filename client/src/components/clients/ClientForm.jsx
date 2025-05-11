import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getClient, createClient, updateClient } from '../../services/api';

const ClientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewClient = !id;
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    active: true
  });
  
  // UI state
  const [loading, setLoading] = useState(!isNewClient);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Load client data if editing
  useEffect(() => {
    if (!isNewClient) {
      const fetchClient = async () => {
        setLoading(true);
        
        try {
          const client = await getClient(id);
          setFormData({
            name: client.name,
            code: client.code,
            description: client.description || '',
            active: client.active
          });
        } catch (err) {
          console.error('Error fetching client:', err);
          setError('Failed to load client. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchClient();
    }
  }, [id, isNewClient]);
  
  // Handle form change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.code) {
      setError('Name and code are required.');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      if (isNewClient) {
        await createClient(formData);
      } else {
        await updateClient(id, formData);
      }
      
      // Navigate back to clients list
      navigate('/clients');
    } catch (err) {
      console.error('Error saving client:', err);
      setError(`Failed to ${isNewClient ? 'create' : 'update'} client. ${err.response?.data?.message || ''}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Render loading state
  if (loading) {
    return <div className="loading">Loading client data...</div>;
  }
  
  return (
    <div className="client-form-page">
      <div className="page-header">
        <h1>{isNewClient ? 'Create Client' : 'Edit Client'}</h1>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Client Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter client name"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="code">Client Code</label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Enter client code (e.g. ACME)"
              required
            />
            <div className="help-text">
              A unique identifier for this client. Will be displayed in uppercase.
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter client description (optional)"
              rows={3}
            />
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
              />
              Active
            </label>
            <div className="help-text">
              Inactive clients are hidden from workflow assignments.
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/clients')}
            >
              Cancel
            </button>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              {saving 
                ? (isNewClient ? 'Creating...' : 'Updating...') 
                : (isNewClient ? 'Create Client' : 'Update Client')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;