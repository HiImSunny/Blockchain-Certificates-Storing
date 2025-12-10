// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Organization APIs
export const organizationAPI = {
  login: (walletAddress) => api.post('/organizations/login', { walletAddress }),
  getProfile: () => api.get('/organizations/profile'),
  updateProfile: (data) => api.put('/organizations/profile', data),
  checkWhitelist: (walletAddress) => api.get(`/organizations/check-whitelist/${walletAddress}`),
};

// Certificate APIs
export const certificateAPI = {
  create: (formData) => api.post('/certificates/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  verify: (certificateId) => api.get(`/certificates/verify/${certificateId}`),
  getAll: (params) => api.get('/certificates/all', { params }),
  getMyCertificates: () => api.get('/certificates/my-certificates'),
  getStats: () => api.get('/certificates/stats'),
};

export default api;