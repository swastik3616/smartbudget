import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (username, password) => 
    api.post('/auth/register', { username, password }),
  
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
};

// Income API
export const incomeAPI = {
  getAll: () => api.get('/income'),
  
  add: (amount, source, date) => 
    api.post('/income', { amount, source, date }),
  
  delete: (id) => api.delete(`/income/${id}`),
  
  export: () => api.get('/income/export', { responseType: 'blob' }),
};

// Expense API
export const expenseAPI = {
  getAll: () => api.get('/expenses'),
  
  add: (amount, category, description, date) => 
    api.post('/expenses', { amount, category, description, date }),
  
  delete: (id) => api.delete(`/expenses/${id}`),
  
  export: () => api.get('/expenses/export', { responseType: 'blob' }),
};

// Transactions API
export const transactionAPI = {
  getRecent: () => api.get('/transactions/recent'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api; 