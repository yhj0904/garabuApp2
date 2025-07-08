import { api } from '@/services/api';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, username: string, password: string) => Promise<boolean>;
  oauthLogin: (provider: 'google' | 'naver', accessToken: string, refreshToken?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

// SecureStore 어댑터
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('SecureStore 저장 실패:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('SecureStore 삭제 실패:', error);
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setLoading: (loading) => set({ isLoading: loading }),

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          // 실제 API 호출
          const response = await api.login({ email, password });
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return true;
        } catch (error) {
          console.error('로그인 실패:', error);
          set({ isLoading: false });
          return false;
        }
      },

      signup: async (email: string, username: string, password: string) => {
        set({ isLoading: true });
        
        try {
          // 실제 API 호출
          const response = await api.signup({ email, username, password });
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return true;
        } catch (error) {
          console.error('회원가입 실패:', error);
          set({ isLoading: false });
          return false;
        }
      },

      oauthLogin: async (provider: 'google' | 'naver', accessToken: string, refreshToken?: string) => {
        set({ isLoading: true });
        
        try {
          // 실제 API 호출
          const response = await api.oauthLogin({ provider, accessToken });
          
          set({
            user: response.user,
            token: response.token,
            refreshToken: refreshToken || null,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return true;
        } catch (error) {
          console.error('OAuth 로그인 실패:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          // 토큰 삭제
          await secureStorage.removeItem('auth-token');
          await secureStorage.removeItem('refresh-token');
          await secureStorage.removeItem('user-data');
          
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('로그아웃 실패:', error);
          set({ isLoading: false });
        }
      },

      initializeAuth: async () => {
        set({ isLoading: true });
        
        try {
          // 저장된 토큰과 사용자 정보 확인
          const token = await secureStorage.getItem('auth-token');
          const refreshToken = await secureStorage.getItem('refresh-token');
          const userData = await secureStorage.getItem('user-data');
          
          if (token && userData) {
            const user = JSON.parse(userData);
            set({
              user,
              token,
              refreshToken: refreshToken || null,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('인증 초기화 실패:', error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 