import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

// Add response interceptor for error handling
api.interceptors.response.use(response => {
  return response;
}, error => {
  // Handle unauthorized errors
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  
  return Promise.reject(error);
});

// Workflows API
export const getWorkflows = async (params) => {
  const response = await api.get('/workflows', { params });
  return response.data;
};

export const getWorkflow = async (id) => {
  const response = await api.get(`/workflows/${id}`);
  return response.data;
};

export const createWorkflow = async (data) => {
  const response = await api.post('/workflows', data);
  return response.data;
};

export const updateWorkflow = async (id, data) => {
  const response = await api.put(`/workflows/${id}`, data);
  return response.data;
};

export const deleteWorkflow = async (id) => {
  const response = await api.delete(`/workflows/${id}`);
  return response.data;
};

export const executeWorkflow = async (id, agentId) => {
  const response = await api.post(`/workflows/${id}/execute`, { agentId });
  return response.data;
};

export const cloneWorkflow = async (id) => {
  const response = await api.post(`/workflows/${id}/clone`);
  return response.data;
};

// Scripts API
export const getScripts = async (params) => {
  const response = await api.get('/scripts', { params });
  return response.data;
};

export const getScript = async (id) => {
  const response = await api.get(`/scripts/${id}`);
  return response.data;
};

export const createScript = async (data) => {
  const response = await api.post('/scripts', data);
  return response.data;
};

export const updateScript = async (id, data) => {
  const response = await api.put(`/scripts/${id}`, data);
  return response.data;
};

export const deleteScript = async (id) => {
  const response = await api.delete(`/scripts/${id}`);
  return response.data;
};

export const cloneScript = async (id) => {
  const response = await api.post(`/scripts/${id}/clone`);
  return response.data;
};

// Clients API
export const getClients = async () => {
  const response = await api.get('/clients');
  return response.data;
};

export const getClient = async (id) => {
  const response = await api.get(`/clients/${id}`);
  return response.data;
};

export const createClient = async (data) => {
  const response = await api.post('/clients', data);
  return response.data;
};

export const updateClient = async (id, data) => {
  const response = await api.put(`/clients/${id}`, data);
  return response.data;
};

export const deleteClient = async (id) => {
  const response = await api.delete(`/clients/${id}`);
  return response.data;
};

// Agents API
export const getAgents = async () => {
  const response = await api.get('/agents');
  return response.data;
};

export const getAgent = async (id) => {
  const response = await api.get(`/agents/${id}`);
  return response.data;
};

export const createAgent = async () => {
  const response = await api.post('/agents/create');
  return response.data;
};

export const deleteAgent = async (id) => {
  const response = await api.delete(`/agents/${id}`);
  return response.data;
};

export const regenerateAgentKey = async (id) => {
  const response = await api.post(`/agents/${id}/regenerate-key`);
  return response.data;
};

// Executions API
export const getExecutions = async (params) => {
  const response = await api.get('/executions', { params });
  return response.data;
};

export const getExecution = async (id) => {
  const response = await api.get(`/executions/${id}`);
  return response.data;
};

export const getExecutionJobs = async (id) => {
  const response = await api.get(`/executions/${id}/jobs`);
  return response.data;
};

export const cancelExecution = async (id) => {
  const response = await api.post(`/executions/${id}/cancel`);
  return response.data;
};

export const rerunExecution = async (id, agentId) => {
  const response = await api.post(`/executions/${id}/rerun`, { agentId });
  return response.data;
};

// Jobs API
export const submitJob = async (data) => {
  const response = await api.post('/job/submit', data);
  return response.data;
};

export const getJobResults = async (params) => {
  const response = await api.get('/job/results', { params });
  return response.data;
};

export const getJob = async (id) => {
  const response = await api.get(`/job/${id}`);
  return response.data;
};

export const cancelJob = async (id) => {
  const response = await api.post(`/job/${id}/cancel`);
  return response.data;
};

export default api;