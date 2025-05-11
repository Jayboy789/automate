import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClients, createClient, updateClient, deleteClient } from '../../services/api';

const ClientsList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    active: true
  });

  // Load clients
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getClients();
        setClients(data);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load clients. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClients();
  }, []);
  
  // Open modal for create/edit
  const openModal = (client = null) => {
    if (client) {
      setFormData({
        name: client.name,
        code: client.code,
        description: client.description || '',
        active: client.active
      });
      setEditingClient(client);
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        active: true
      });
      setEditingClient(null);
    }
    
    setIsModalOpen(true);
  };
  
  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };
  
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
    
    try {
      let result;
      
      if (editingClient) {
        // Update existing client
        result = await updateClient(editingClient._id, formData);
        
        // Update clients list
        setClients(prev => prev.map(client => 
          client._id === editingClient._id ? result : client
        ));
      } else {
        // Create new client
        result = await createClient(formData);
        
        // Add to clients list
        setClients(prev => [result, ...prev]);
      }
      
      closeModal();
    } catch (err) {
      console.error('Error saving client:', err);
      alert(`Failed to ${editingClient ? 'update' : 'create'} client. Please try again.`);
    }
  };
  
  // Delete client
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return;
    }
    
    try {
      await deleteClient(id);
      
      // Remove from list
      setClients(prev => prev.filter(client => client._id !== id));
    } catch (err) {
      console.error('Error deleting client:', err);
      alert('Failed to delete client. Please try again.');
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Render loading state
  if (loading) {
    return <div className="loading">Loading clients...</div>;
  }
  
  return (
    <div className="clients-page">
      <div className="page-header">
        <h1>Clients</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => openModal()}
        >
          <i className="fa fa-plus"></i> New Client
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {clients.length === 0 ? (
        <div className="empty-state">
          <i className="fa fa-building empty-icon"></i>
          <h2>No clients yet</h2>
          <p>Create your first client to get started</p>
          <button 
            className="btn btn-primary"
            onClick={() => openModal()}
          >
            Create Client
          </button>
        </div>
      ) : (
        <div className="clients-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Description</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client._id}>
                  <td>{client.name}</td>
                  <td>{client.code}</td>
                  <td>{client.description || '-'}</td>
                  <td>{formatDate(client.createdAt)}</td>
                  <td>
                    <span className={`status-badge ${client.active ? 'status-online' : 'status-offline'}`}>
                      {client.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon"
                        title="Edit"
                        onClick={() => openModal(client)}
                      >
                        <i className="fa fa-edit"></i>
                      </button>
                      
                      <button 
                        className="btn-icon btn-icon-danger"
                        title="Delete"
                        onClick={() => handleDelete(client._id)}
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
      
      {/* Client Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingClient ? 'Edit Client' : 'New Client'}</h2>
              <button 
                className="modal-close"
                onClick={closeModal}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="client-form">
              <div className="form-group">
                <label htmlFor="name">Client Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
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
                  required
                />
                <div className="help-text">
                  Unique identifier for this client (e.g., ACME)
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
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
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  {editingClient ? 'Update Client' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsList;