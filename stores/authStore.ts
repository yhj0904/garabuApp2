import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { create } from 'zustand';
import apiService, { LoginResponse, SignupResponse } from '../services/api';

interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  role: string;
  providerId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  oauthLogin: (provider: 'google' | 'naver', accessToken: string, refreshToken?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (email: string, username: string, password: string, name: string) => Promise<boolean>;
  checkAuthStatus: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      
      const response: LoginResponse = await apiService.login({ email, password });
      
      set({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken || null,
        isAuthenticated: true,
        isLoading: false,
      });

      // 로그인 성공 후 메인 화면으로 이동
      router.replace('/(tabs)');
      
      return true;
    } catch (error) {
      console.error('로그인 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  oauthLogin: async (provider: 'google' | 'naver', accessToken: string, refreshToken?: string) => {
    try {
      set({ isLoading: true });
      
      const response = await apiService.oauthLogin({
        provider,
        accessToken,
        refreshToken,
      });

      // 토큰 저장
      await AsyncStorage.setItem('auth-token', response.token);
      
      set({
        user: response.user,
        token: response.token,
        refreshToken: null, // OAuth는 별도의 refresh token 없음
        isAuthenticated: true,
        isLoading: false,
      });

      // 로그인 성공 후 메인 화면으로 이동
      router.replace('/(tabs)');
      
      return true;
    } catch (error) {
      console.error('OAuth 로그인 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      const { token } = get();
      if (token) {
        await apiService.logout(token);
      }
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      // API 호출 성공 여부와 관계없이 로컬 상태 초기화
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      });
      
      // 로그인 화면으로 이동
      router.replace('/(auth)/login');
    }
  },

  signup: async (email: string, username: string, password: string, name: string) => {
    try {
      set({ isLoading: true });
      
      const response: SignupResponse = await apiService.signup({
        email,
        username,
        password,
        name,
      });
      
      // 회원가입 성공 시 자동 로그인
      set({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken || null,
        isAuthenticated: true,
        isLoading: false,
      });

      // 메인 화면으로 이동
      router.replace('/(tabs)');
      
      return true;
    } catch (error) {
      console.error('회원가입 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  checkAuthStatus: async () => {
    try {
      set({ isLoading: true });
      
      const token = await AsyncStorage.getItem('auth-token');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (token) {
        // 토큰이 있으면 사용자 정보 가져오기
        const { user } = await apiService.getProfile(token);
        
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
      // 토큰이 유효하지 않으면 초기화
      await AsyncStorage.removeItem('auth-token');
      await AsyncStorage.removeItem('refreshToken');
      
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user: User) => {
    set({ user });
  },
})); 