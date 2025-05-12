import axios from 'axios';

// Create axios instance with hardcoded baseURL for development
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30 second timeout
  withCredentials: false // Disable credentials to avoid CORS issues
});

// Add request interceptor with more logging
api.interceptors.request.use(config => {
  // Add debugging info
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  
  // Add auth token if available (for development, we're skipping this)
  // const token = localStorage.getItem('token');
  // if (token) {
  //   config.headers['Authorization'] = `Bearer ${token}`;
  // }
  
  return config;
}, error => {
  console.error('API request error:', error);
  return Promise.reject(error);
});

// Add response interceptor with more detailed error logging
api.interceptors.response.use(response => {
  // Add debugging info
  console.log(`API Response Success: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
  
  // Return data directly if available, otherwise the whole response
  return response.data || response;
}, error => {
  // Create a more detailed error message
  const errorDetails = {
    message: error.message,
    status: error.response?.status,
    url: error.config?.url,
    method: error.config?.method,
    data: error.response?.data
  };
  
  console.error('API Error Details:', errorDetails);
  
  // In development mode, return dummy data for certain endpoints to avoid blocking the UI
  if (process.env.NODE_ENV === 'development') {
    const url = error.config?.url;
    
    // Provide fallback data for common endpoints
    if (url?.includes('/workflows')) {
      console.log('Returning empty workflows array as fallback');
      return { data: [] };
    }
    
    if (url?.includes('/agents')) {
      console.log('Returning empty agents array as fallback');
      return { data: [] };
    }
    
    if (url?.includes('/executions')) {
      console.log('Returning empty executions array as fallback');
      return { data: [] };
    }
    
    if (url?.includes('/scripts')) {
      console.log('Returning empty scripts array as fallback');
      return { data: [] };
    }
    
    if (url?.includes('/clients')) {
      console.log('Returning empty clients array as fallback');
      return { data: [] };
    }
  }
  
  return Promise.reject(error);
});

// Simplified API functions that don't require additional .data extraction

// Workflows API
export const getWorkflows = async (params) => {
  try {
    console.log('Fetching workflows with params:', params);
    const response = await api.get('/workflows', { params });
    return response || [];
  } catch (error) {
    console.error('Error in getWorkflows:', error);
    return []; // Return empty array in development
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
    return response || [];
  } catch (error) {
    console.error('Error in getScripts:', error);
    return []; // Return empty array in development
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
    return response || [];
  } catch (error) {
    console.error('Error in getClients:', error);
    return []; // Return empty array in development
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
    return response || [];
  } catch (error) {
    console.error('Error in getAgents:', error);
    return []; // Return empty array in development
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
    return response || [];
  } catch (error) {
    console.error('Error in getExecutions:', error);
    return []; // Return empty array in development
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

export default api;