import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Auth Service ---
export const login = (username, password) => apiClient.post('/auth/login', { username, password });
export const register = (username, password, role) => apiClient.post('/auth/register', { username, password, role });

// --- Dossiers Service ---
export const getDossiers = (params) => apiClient.get('/dossiers', { params });
export const createDossier = (dossierData) => apiClient.post('/dossiers', dossierData);
export const updateDossier = (id, dossierData) => apiClient.put(`/dossiers/${id}`, dossierData);
export const deleteDossier = (id) => apiClient.delete(`/dossiers/${id}`);

// --- User Service ---
export const getUsers = () => apiClient.get('/users');

// --- Audit Log Service ---
export const getAuditLogs = () => apiClient.get('/auditlogs');

// --- Messages Service ---
export const sendMessage = (content) => apiClient.post('/messages', { content });
export const getMessages = (params) => apiClient.get('/messages', { params });
export const confirmMessage = (id) => apiClient.put(`/messages/${id}/confirm`);
