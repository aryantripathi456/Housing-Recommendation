import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export const getConfig = async () => {
  const { data } = await api.get('/config');
  return data;
};

export const getProperties = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const { data } = await api.get(`/properties?${params.toString()}`);
  return data;
};

export const getProperty = async (id) => {
  const { data } = await api.get(`/properties/${id}`);
  return data;
};

export const getLiveability = async (propertyId) => {
  const { data } = await api.get(`/properties/${propertyId}/liveability`);
  return data;
};

export const getRecommendations = async (params) => {
  const { data } = await api.post('/recommend', params);
  return data;
};

export const checkAffordability = async (params) => {
  const { data } = await api.post('/affordability/check', params);
  return data;
};

export const getMapData = async () => {
  const { data } = await api.get('/liveability/map-data');
  return data;
};

export const getPersonas = async () => {
  const { data } = await api.get('/personas');
  return data;
};

export const getLocalities = async () => {
  const { data } = await api.get('/localities');
  return data;
};

export const getPriceTrends = async (propertyId) => {
  const { data } = await api.get(`/properties/${propertyId}/price-trends`);
  return data;
};

export const getCommute = async (propertyId, workplaceLat, workplaceLon) => {
  const params = new URLSearchParams({ workplace_lat: workplaceLat, workplace_lon: workplaceLon });
  const { data } = await api.get(`/properties/${propertyId}/commute?${params.toString()}`);
  return data;
};

export const getDashboardStats = async () => {
  const { data } = await api.get('/dashboard/stats');
  return data;
};

export default api;
