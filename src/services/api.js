import axios from 'axios';

const isFileProtocol = typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';
const API_BASE_URL = isFileProtocol ? 'http://localhost:3001/api' : '/api';

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

// --- WebRTC Signaling (WebSocket) ---
// Simple wrapper to connect to the signaling server at ws(s)://<host>/ws
export function createSignalingSocket() {
  if (isFileProtocol) {
    return new WebSocket('ws://localhost:3001/ws');
  }
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const url = `${protocol}://${window.location.host}/ws`;
  return new WebSocket(url);
}
