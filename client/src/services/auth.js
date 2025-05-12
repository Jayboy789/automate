import api from './api';

// Login user
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    console.log('Login response from API:', response);
    return response;
  } catch (error) {
    console.error('Login error in auth service:', error);
    throw error;
  }
};

// Register user
export const register = async (name, email, password) => {
  try {
    const response = await api.post('/auth/register', { name, email, password });
    console.log('Register response from API:', response);
    return response;
  } catch (error) {
    console.error('Register error in auth service:', error);
    throw error;
  }
};

// Get current user
export const getUser = async () => {
  try {
    const response = await api.get('/auth/user');
    console.log('Get user response from API:', response);
    return response.user;
  } catch (error) {
    console.error('Get user error in auth service:', error);
    throw error;
  }
};

// Update user profile
export const updateUser = async (data) => {
  const response = await api.put('/auth/user', data);
  return response.user;
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/auth/user', { currentPassword, newPassword });
  return response;
};

export default {
  login,
  register,
  getUser,
  updateUser,
  changePassword
};