import axios from 'axios';

// Create axios instance with improved settings
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000, // 15 second timeout
  withCredentials: false // Disable credentials for now to avoid CORS issues
});

// Add request interceptor for authentication
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  
  // Add debugging info
  console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
}, error => {
  console.error('API request error:', error);
  return Promise.reject(error);
});

// Add response interceptor for error handling
api.interceptors.response.use(response => {
  // Add debugging info
  console.log(`API Response: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
  
  return response.data; // Automatically extract data property
}, error => {
  // Log the error details
  console.error(
    'API error:',
    error?.response?.status,
    error?.config?.method,
    error?.config?.url,
    error?.response?.data || error.message
  );
  
  // Handle unauthorized errors
  if (error.response && error.response.status === 401) {
    console.log('Auth token expired or invalid. Redirecting to login...');
    localStorage.removeItem('token');
    
    // Only redirect if we're not already on the login page
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }
  
  // Handle server errors
  if (error.response && error.response.status >= 500) {
    console.error('Server error:', error.response.data);
  }
  
  // Handle network errors
  if (error.message === 'Network Error') {
    console.error('Network error - server may be down');
  }
  
  return Promise.reject(error);
});

// Simplified API functions that don't require additional .data extraction

// Workflows API
export const getWorkflows = async (params) => {
  try {
    const response = await api.get('/workflows', { params });
    return response;
  } catch (error) {
    console.error('Error in getWorkflows:', error);
    throw error;
  }
};

export const getWorkflow = async (id) => {
  try {
    const response = await api.get(`/workflows/${id}`);
    return response;
  } catch (error) {
    console.error(`Error in getWorkflow(${id}):`, error);
    throw error;
  }
};

export const createWorkflow = async (data) => {
  return await api.post('/workflows', data);
};

export const updateWorkflow = async (id, data) => {
  return await api.put(`/workflows/${id}`, data);
};

export const deleteWorkflow = async (id) => {
  return await api.delete(`/workflows/${id}`);
};

export const executeWorkflow = async (id, agentId) => {
  return await api.post(`/workflows/${id}/execute`, { agentId });
};

export const cloneWorkflow = async (id) => {
  return await api.post(`/workflows/${id}/clone`);
};

// Scripts API
export const getScripts = async (params) => {
  try {
    const response = await api.get('/scripts', { params });
    return response;
  } catch (error) {
    console.error('Error in getScripts:', error);
    throw error;
  }
};

export const getScript = async (id) => {
  return await api.get(`/scripts/${id}`);
};

export const createScript = async (data) => {
  return await api.post('/scripts', data);
};

export const updateScript = async (id, data) => {
  return await api.put(`/scripts/${id}`, data);
};

export const deleteScript = async (id) => {
  return await api.delete(`/scripts/${id}`);
};

export const cloneScript = async (id) => {
  return await api.post(`/scripts/${id}/clone`);
};

// Clients API
export const getClients = async () => {
  try {
    const response = await api.get('/clients');
    return response;
  } catch (error) {
    console.error('Error in getClients:', error);
    throw error;
  }
};

export const getClient = async (id) => {
  return await api.get(`/clients/${id}`);
};

export const createClient = async (data) => {
  return await api.post('/clients', data);
};

export const updateClient = async (id, data) => {
  return await api.put(`/clients/${id}`, data);
};

export const deleteClient = async (id) => {
  return await api.delete(`/clients/${id}`);
};

// Agents API
export const getAgents = async () => {
  try {
    const response = await api.get('/agents');
    return response;
  } catch (error) {
    console.error('Error in getAgents:', error);
    throw error;
  }
};

export const getAgent = async (id) => {
  return await api.get(`/agents/${id}`);
};

export const createAgent = async () => {
  return await api.post('/agents/create');
};

export const deleteAgent = async (id) => {
  return await api.delete(`/agents/${id}`);
};

export const regenerateAgentKey = async (id) => {
  return await api.post(`/agents/${id}/regenerate-key`);
};

// Executions API
export const getExecutions = async (params) => {
  try {
    const response = await api.get('/executions', { params });
    return response;
  } catch (error) {
    console.error('Error in getExecutions:', error);
    throw error;
  }
};

export const getExecution = async (id) => {
  return await api.get(`/executions/${id}`);
};

export const getExecutionJobs = async (id) => {
  return await api.get(`/executions/${id}/jobs`);
};

export const cancelExecution = async (id) => {
  return await api.post(`/executions/${id}/cancel`);
};

export const rerunExecution = async (id, agentId) => {
  return await api.post(`/executions/${id}/rerun`, { agentId });
};

// Jobs API
export const submitJob = async (data) => {
  return await api.post('/job/submit', data);
};

export const getJobResults = async (params) => {
  return await api.get('/job/results', { params });
};

export const getJob = async (id) => {
  return await api.get(`/job/${id}`);
};

export const cancelJob = async (id) => {
  return await api.post(`/job/${id}/cancel`);
};

// Auth API
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (userData) => {
  return await api.post('/auth/register', userData);
};

export const getCurrentUser = async () => {
  return await api.get('/auth/me');
};

export const refreshToken = async () => {
  return await api.post('/auth/refresh-token');
};

export default api;