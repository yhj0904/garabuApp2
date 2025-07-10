import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { Member } from '@/services/api';

interface AuthState {
  user: Member | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: Member | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, username: string, password: string, name: string) => Promise<boolean>;
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

export const useAuthStore = create<AuthState>((set, _get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  setRefreshToken: (refreshToken) => set({ refreshToken }),
  setLoading: (loading) => set({ isLoading: loading }),

  login: async (email: string, password: string) => {
    console.log('로그인 시작:', email);
    set({ isLoading: true });
    
    try {
      // 동적 import로 API 호출
      const apiModule = await import('@/services/api');
      const apiService = apiModule.default;
      const response = await apiService.login({ email, password });
      
      console.log('로그인 성공:', response);
      
      // 토큰과 사용자 정보 저장
      await secureStorage.setItem('auth-token', response.token);
      await secureStorage.setItem('user-data', JSON.stringify(response.user));
      if (response.refreshToken) {
        await secureStorage.setItem('refresh-token', response.refreshToken);
      }
      
      set({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken || null,
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

  signup: async (email: string, username: string, password: string, name: string) => {
    console.log('회원가입 시작:', email, username, name);
    set({ isLoading: true });
    
    try {
      // 동적 import로 API 호출
      const apiModule = await import('@/services/api');
      const apiService = apiModule.default;
      const response = await apiService.signup({ email, username, password, name });
      
      console.log('회원가입 성공:', response);
      
      // 토큰과 사용자 정보 저장
      await secureStorage.setItem('auth-token', response.token);
      await secureStorage.setItem('user-data', JSON.stringify(response.user));
      if (response.refreshToken) {
        await secureStorage.setItem('refresh-token', response.refreshToken);
      }
      
      set({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken || null,
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
    console.log(`${provider} OAuth 로그인 시작, 토큰:`, accessToken);
    set({ isLoading: true });
    
    try {
      // 동적 import로 API 호출
      console.log('API 호출 중...');
      const apiModule = await import('@/services/api');
      const apiService = apiModule.default;
      const response = await apiService.oauthLogin({ provider, accessToken });
      console.log('API 응답:', response);
      
      // 토큰과 사용자 정보 저장
      await secureStorage.setItem('auth-token', response.token);
      await secureStorage.setItem('user-data', JSON.stringify(response.user));
      if (refreshToken) {
        await secureStorage.setItem('refresh-token', refreshToken);
      }
      
      set({
        user: response.user,
        token: response.token,
        refreshToken: refreshToken || null,
        isAuthenticated: true,
        isLoading: false,
      });
      
      console.log(`${provider} OAuth 로그인 성공!`);
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
})); 