import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { create } from 'zustand';
import apiService, { LoginResponse, SignupResponse } from '../services/api';
import { useBookStore } from './bookStore';
import { useCategoryStore } from './categoryStore';
import { useAssetStore } from './assetStore';
import { useBudgetStore } from './budgetStore';
import { notification } from '../services/notificationService';
import syncService from '../services/syncService';
import { oauth } from '../services/oauthService';

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
  oauthLogin: (provider: 'google' | 'apple' | 'naver' | 'kakao', accessToken?: string, refreshToken?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (email: string, username: string, password: string, name: string) => Promise<boolean>;
  checkAuthStatus: () => Promise<void>;
  setUser: (user: User) => void;
  loadInitialData: (user: User, token: string) => Promise<boolean>;
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

      // 로그인 성공 후 초기 데이터 로딩
      const hasBooks = await loadInitialData(response.user, response.token);

      // 가계부가 없으면 온보딩 화면으로, 있으면 메인 화면으로 이동
      if (hasBooks) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(onboarding)/create-first-book');
      }
      
      return true;
    } catch (error) {
      console.error('로그인 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  oauthLogin: async (provider: 'google' | 'apple' | 'naver' | 'kakao', accessToken?: string, refreshToken?: string) => {
    try {
      set({ isLoading: true });
      
      let oauthResult;
      
      // OAuth 서비스를 통해 로그인 처리
      if (accessToken) {
        // 직접 토큰이 제공된 경우 (외부에서 이미 OAuth 완료)
        oauthResult = {
          success: true,
          provider,
          accessToken,
          refreshToken,
        };
      } else {
        // OAuth 서비스를 통해 로그인 처리
        oauthResult = await oauth.login(provider);
      }

      if (!oauthResult.success) {
        set({ isLoading: false });
        console.error('OAuth 로그인 실패:', oauthResult.error);
        return false;
      }

      // 백엔드 서버로 OAuth 정보 전송
      const response = await apiService.oauthLogin({
        provider: oauthResult.provider || provider,
        accessToken: oauthResult.accessToken!,
        refreshToken: oauthResult.refreshToken,
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

      // 로그인 성공 후 초기 데이터 로딩
      const hasBooks = await loadInitialData(response.user, response.token);

      // 가계부가 없으면 온보딩 화면으로, 있으면 메인 화면으로 이동
      if (hasBooks) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(onboarding)/create-first-book');
      }
      
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
      
      // 모든 스토어 데이터 초기화
      await clearAllStoreData();
      
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

      // 회원가입 성공 후 초기 데이터 로딩
      const hasBooks = await loadInitialData(response.user, response.token);

      // 가계부가 없으면 온보딩 화면으로, 있으면 메인 화면으로 이동
      if (hasBooks) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(onboarding)/create-first-book');
      }
      
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

        // 가계부 존재 여부 확인
        const hasBooks = await loadInitialData(user, token);
        
        // 가계부가 없으면 온보딩 화면으로, 있으면 메인 화면으로 이동
        if (!hasBooks) {
          router.replace('/(onboarding)/create-first-book');
        }
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

  loadInitialData: async (user: User, token: string) => {
    return await loadInitialData(user, token);
  },
}));

// 모든 스토어 데이터 초기화 함수
const clearAllStoreData = async () => {
  try {
    // AsyncStorage에서 토큰 제거
    await AsyncStorage.removeItem('auth-token');
    await AsyncStorage.removeItem('refreshToken');
    
    // 각 스토어 초기화 (각 스토어에 reset 메서드가 있다면 사용)
    const bookStore = useBookStore.getState();
    const categoryStore = useCategoryStore.getState();
    const assetStore = useAssetStore.getState();
    const budgetStore = useBudgetStore.getState();
    
    // 스토어별 초기화 메서드 호출 (구현되어 있다면)
    if (bookStore.reset) bookStore.reset();
    if (categoryStore.reset) categoryStore.reset();
    if (assetStore.reset) assetStore.reset();
    if (budgetStore.reset) budgetStore.reset();
    
    // 동기화 서비스 연결 해제
    syncService.disconnect();
    
    console.log('모든 스토어 데이터 초기화 완료');
  } catch (error) {
    console.error('스토어 데이터 초기화 실패:', error);
  }
};

// 초기 데이터 로딩 함수
const loadInitialData = async (user: User, token: string): Promise<boolean> => {
  try {
    const bookStore = useBookStore.getState();
    const categoryStore = useCategoryStore.getState();
    const assetStore = useAssetStore.getState();
    const budgetStore = useBudgetStore.getState();

    // 1. 가계부 목록 로드
    const booksLoaded = await bookStore.fetchBooks(token);
    
    if (booksLoaded) {
      const currentBook = useBookStore.getState().currentBook;
      const books = useBookStore.getState().books;
      
      // 가계부가 없으면 false 반환
      if (!currentBook || books.length === 0) {
        console.log('가계부가 없음 - 온보딩 화면으로 이동');
        return false;
      }
      
      // 2. 병렬로 데이터 로딩
      await Promise.all([
        // 카테고리 및 결제수단 로드
        categoryStore.fetchCategoriesByBook(currentBook.id, token),
        categoryStore.fetchPaymentsByBook(currentBook.id, token),
        
        // 가계부 멤버 정보 로드
        bookStore.fetchBookMembers(currentBook.id, token),
        
        // 자산 정보 로드
        assetStore.fetchAssetTypes(token),
        assetStore.fetchAssetsByBook(currentBook.id, token),
      ]);

      // 3. 최근 거래 내역 로드
      await bookStore.fetchLedgers({
        bookId: currentBook.id,
        page: 0,
        size: 20
      }, token);

      // 4. 예산 정보 로드 (선택사항)
      const currentMonth = new Date().toISOString().slice(0, 7);
      try {
        await budgetStore.getBudgetSummary(currentBook.id, currentMonth, token);
      } catch (error) {
        console.log('예산 정보 없음 (정상)');
      }

      // 5. 실시간 동기화 연결
      if (user.id) {
        try {
          await syncService.connect(user.id, currentBook.id, token);
        } catch (error) {
          console.error('동기화 연결 실패:', error);
        }
      }

      // 6. 알림 서비스 초기화
      try {
        const pushToken = await notification.registerForPushNotifications();
        if (pushToken && user.id) {
          await notification.registerTokenWithServer(user.id.toString(), pushToken);
          notification.registerNotificationListeners();
        }
      } catch (error) {
        console.error('알림 초기화 실패:', error);
      }
      
      return true; // 가계부가 있고 데이터 로딩 완료
    }
    
    return false; // 가계부 로딩 실패
  } catch (error) {
    console.error('초기 데이터 로딩 실패:', error);
    return false;
  }
}; 