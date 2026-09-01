import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getMaterials = async (params = {}) => {
  const response = await api.get('/materials', { params });
  return response.data;
};

export const getMaterialById = async (id) => {
  const response = await api.get(`/materials/${id}`);
  return response.data;
};

export const addMaterial = async (material) => {
  const response = await api.post('/materials', material);
  return response.data;
};

export const updateMaterial = async (id, material) => {
  const response = await api.put(`/materials/${id}`, material);
  return response.data;
};

export const uploadMaterials = async (materials) => {
  const response = await api.post('/upload', { materials });
  return response.data;
};

export const getMatches = async () => {
  const response = await api.get('/matches');
  return response.data;
};

export const runMatching = async () => {
  const response = await api.post('/match');
  return response.data;
};

export const approveMatch = async (id, comment, reviewer) => {
  const response = await api.post(`/matches/${id}/approve`, { comment, reviewer });
  return response.data;
};

export const rejectMatch = async (id, comment, reviewer) => {
  const response = await api.post(`/matches/${id}/reject`, { comment, reviewer });
  return response.data;
};

export const getClusters = async () => {
  const response = await api.get('/clusters');
  return response.data;
};

export const getClusterDetails = async (id) => {
  const response = await api.get(`/clusters/${id}`);
  return response.data;
};

export const getNationalCodes = async () => {
  const response = await api.get('/national-codes');
  return response.data;
};

export const getMappings = async () => {
  const response = await api.get('/mappings');
  return response.data;
};

export const getAnalytics = async () => {
  const response = await api.get('/analytics');
  return response.data;
};

export const getAuditLogs = async () => {
  const response = await api.get('/audit-logs');
  return response.data;
};

export const getErpStatus = async () => {
  const response = await api.get('/erp/status');
  return response.data;
};

export const syncErpMaterials = async () => {
  const response = await api.post('/erp/sync');
  return response.data;
};

export const pushErpMappings = async () => {
  const response = await api.post('/erp/push');
  return response.data;
};

export const seedDemoDataset = async () => {
  const response = await api.post('/demo/seed');
  return response.data;
};

export default {
  getMaterials,
  getMaterialById,
  addMaterial,
  updateMaterial,
  uploadMaterials,
  getMatches,
  runMatching,
  approveMatch,
  rejectMatch,
  getClusters,
  getClusterDetails,
  getNationalCodes,
  getMappings,
  getAnalytics,
  getAuditLogs,
  getErpStatus,
  syncErpMaterials,
  pushErpMappings,
  seedDemoDataset,
};
