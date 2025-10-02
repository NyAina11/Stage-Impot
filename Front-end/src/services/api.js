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

// --- Resource Orders Service ---
export const createResourceOrder = (orderData) => apiClient.post('/resource-orders', orderData);
export const getResourceOrders = (params) => apiClient.get('/resource-orders', { params });
export const updateResourceOrder = (id, updateData) => apiClient.put(`/resource-orders/${id}`, updateData);

// --- Personnel Service ---
export const getPersonnel = () => apiClient.get('/personnel');
export const createPersonnel = (personnelData) => apiClient.post('/personnel', personnelData);
export const updatePersonnel = (id, personnelData) => apiClient.put(`/personnel/${id}`, personnelData);
export const deletePersonnel = (id) => apiClient.delete(`/personnel/${id}`);
