import { create } from 'zustand';
import api, { storage } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  clientId?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { user, tokens } = data.data;
    storage.set('accessToken', tokens.accessToken);
    storage.set('refreshToken', tokens.refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    storage.delete('accessToken');
    storage.delete('refreshToken');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadUser: async () => {
    try {
      const token = storage.getString('accessToken');
      if (!token) { set({ isLoading: false }); return; }
      const { data } = await api.get('/auth/me');
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      storage.delete('accessToken');
      storage.delete('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
