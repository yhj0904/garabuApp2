import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import apiService, { LoginResponse, SignupResponse } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<LoginResponse>;
  signup: (name: string, email: string, password: string) => Promise<SignupResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // 초기화 시 저장된 토큰 확인
  useEffect(() => {
    const checkAuthToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('auth-token');
        const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (storedToken) {
          // 토큰이 있으면 사용자 정보 가져오기
          const { user } = await apiService.getProfile(storedToken);
          setUser(user);
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);
        }
      } catch (error) {
        console.error('토큰 확인 실패:', error);
        // 토큰이 유효하지 않으면 제거
        await AsyncStorage.removeItem('auth-token');
        await AsyncStorage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthToken();
  }, []);

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await apiService.login({ email, password });
      setUser(response.user);
      setToken(response.token);
      setRefreshToken(response.refreshToken || null);
      
      // 토큰 저장
      await AsyncStorage.setItem('auth-token', response.token);
      if (response.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.refreshToken);
      }
      
      return response;
    } catch (error) {
      console.error('로그인 실패:', error);
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<SignupResponse> => {
    try {
      const response = await apiService.signup({
        email,
        username: email, // username으로 email 사용
        password,
        name,
      });
      
      // 회원가입 성공 시 자동 로그인 처리
      setUser(response.user);
      setToken(response.token);
      setRefreshToken(response.refreshToken || null);
      
      // 토큰 저장
      await AsyncStorage.setItem('auth-token', response.token);
      if (response.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.refreshToken);
      }
      
      return response;
    } catch (error) {
      console.error('회원가입 실패:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiService.logout(token);
      }
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      // API 호출 성공 여부와 관계없이 로컬 상태 초기화
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      await AsyncStorage.removeItem('auth-token');
      await AsyncStorage.removeItem('refreshToken');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    token,
    refreshToken,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 