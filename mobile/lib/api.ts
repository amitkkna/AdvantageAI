import axios from 'axios';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = storage.getString('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = storage.getString('refreshToken');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        storage.set('accessToken', data.data.tokens.accessToken);
        storage.set('refreshToken', data.data.tokens.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.tokens.accessToken}`;
        return api(originalRequest);
      } catch {
        storage.delete('accessToken');
        storage.delete('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);

export { storage };
export default api;
