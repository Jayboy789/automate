import api from './api';

// Login user
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Register user
export const register = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

// Get current user
export const getUser = async () => {
  const response = await api.get('/auth/user');
  return response.data.user;
};

// Update user profile
export const updateUser = async (data) => {
  const response = await api.put('/auth/user', data);
  return response.data.user;
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/auth/user', { currentPassword, newPassword });
  return response.data;
};

// Create an object for the default export
const authService = {
  login,
  register,
  getUser,
  updateUser,
  changePassword
};

export default authService;