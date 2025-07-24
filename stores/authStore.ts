import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { create } from 'zustand';
import apiService, { LoginResponse, SignupResponse } from '@/core/api/client';
import { useBookStore } from './bookStore';
import { useCategoryStore } from './categoryStore';
import { useAssetStore } from './assetStore';
import { useBudgetStore } from './budgetStore';
import { firebaseService } from '@/services/firebaseService';
import { notification } from '@/core/notifications/fcm';
import syncService from '@/services/syncService';
import kakaoService from '@/features/auth/services/kakaoService';
import googleService from '@/features/auth/services/googleService';
import appleService from '@/features/auth/services/appleService';

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
  isCheckingAuth: boolean; // 🔒 중복 실행 방지용 플래그 추가
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  loginWithKakao: () => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithApple: () => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (email: string, username: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  checkAuthStatus: () => Promise<void>;
  setUser: (user: User) => void;
  loadInitialData: (user: User, token: string) => Promise<boolean>;
  performCompleteReset: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
  isCheckingAuth: false, // 초기화

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      
      const response: LoginResponse = await apiService.login({ email, password });
      
      const access = response.token;
      const refresh = response.refreshToken || null;
      
      set({
        user: response.user,
        token: access,
        refreshToken: refresh,
        isAuthenticated: true,
        isLoading: false,
        isCheckingAuth: false, // 🔒 로그인 완료 시 플래그 초기화
      });
      
      // 토큰 저장
      if (access) {
        await AsyncStorage.setItem('auth-token', access);
      }
      if (refresh) {
        await AsyncStorage.setItem('refreshToken', refresh);
      }
      
      // 사용자 정보도 저장 (오프라인 모드를 위해)
      if (response.user) {
        await AsyncStorage.setItem('user-data', JSON.stringify(response.user));
      }
      
      // 사용자 정보도 저장 (오프라인 모드를 위해)
      if (response.user) {
        await AsyncStorage.setItem('user-data', JSON.stringify(response.user));
      }

      // 로그인 성공 후 초기 데이터 로딩
      const hasBooks = await loadInitialData(response.user, response.token);

      // 가계부가 없으면 온보딩 화면으로, 있으면 메인 화면으로 이동
      if (hasBooks) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(modals)/book-creation?mode=onboarding');
      }
      
      return true;
    } catch (error: any) {
      console.error('로그인 실패:', error);
      set({ 
        isLoading: false,
        isCheckingAuth: false, // 🔒 로그인 실패 시 플래그 초기화
      });
      
      // 401 에러인 경우 구체적인 메시지 표시
      if (error.response?.status === 401) {
        throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
      } else if (error.response?.status === 404) {
        throw new Error('등록되지 않은 사용자입니다.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  },

  loginWithKakao: async () => {
    console.log('\n=== AuthStore: Kakao Login Started ===');
    try {
      set({ isLoading: true });
      
      // 1. Kakao 로그인 수행
      console.log('Step 1: Calling kakaoService.login()...');
      const kakaoResult = await kakaoService.login();
      console.log('Step 1 Complete: Got Kakao result');
      
      // 사용자가 취소한 경우
      if (!kakaoResult) {
        console.log('Kakao login cancelled by user');
        set({ isLoading: false });
        return false;
      }
      
      if (!kakaoResult.accessToken) {
        throw new Error('No access token received from Kakao');
      }
      
      // 2. 백엔드 로그인
      console.log('Step 2: Calling backend login with Kakao token...');
      const response = await kakaoService.loginWithBackend(kakaoResult.accessToken);
      console.log('Step 2 Complete: Backend login successful');
      
      // 3. 상태 업데이트
      console.log('Step 3: Updating auth state...');
      const access = response.accessToken || response.token;
      const refresh = response.refreshToken || response.refresh || null;
      
      if (!access) {
        console.error('No access token in response:', response);
        throw new Error('No access token received from backend');
      }

      set({
        user: response.user,
        token: access,
        refreshToken: refresh,
        isAuthenticated: true,
        isLoading: false,
        isCheckingAuth: false, // 🔒 로그인 완료 시 플래그 초기화
      });

      // 4. 토큰 저장
      console.log('Step 4: Saving tokens to AsyncStorage...');
      if (access) {
        await AsyncStorage.setItem('auth-token', access);
      }
      if (refresh) {
        await AsyncStorage.setItem('refreshToken', refresh);
      }

      // 5. 초기 데이터 로딩
      console.log('Step 5: Loading initial data...');
      const hasBooks = await loadInitialData(response.user, access);
      console.log('Step 5 Complete: Initial data loaded, hasBooks:', hasBooks);

      // 6. 네비게이션
      console.log('Step 6: Navigating to appropriate screen...');
      if (hasBooks) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(modals)/book-creation?mode=onboarding');
      }
      
      console.log('=== Kakao Login Complete ===\n');
      return true;
    } catch (error: any) {
      console.error('=== Kakao Login Failed ===');
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      set({ 
        isLoading: false,
        isCheckingAuth: false, // 🔒 실패 시 플래그 초기화
      });
      return false;
    }
  },

  loginWithGoogle: async () => {
    try {
      set({ isLoading: true });
      console.log('Starting Google login process...');
      
      // 1. Universal Google 로그인 수행 (One Tap)
      const googleResult = await googleService.loginWithOneTap();
      console.log('Google login result:', googleResult);
      
      // 사용자가 취소한 경우
      if (!googleResult) {
        console.log('Google login cancelled by user');
        set({ isLoading: false });
        return false;
      }
      
      if (!googleResult.idToken) {
        throw new Error('No ID token received from Google');
      }
      
      // 2. 백엔드 로그인
      const response = await googleService.loginWithBackend(googleResult.idToken);
      console.log('Google backend login response received');
      
      const access = response.accessToken || response.token;
      const refresh = response.refreshToken || response.refresh || null;
      
      if (!access) {
        console.error('No access token in response:', response);
        throw new Error('No access token received from backend');
      }
      
      set({
        user: response.user,
        token: access,
        refreshToken: refresh,
        isAuthenticated: true,
        isLoading: false,
        isCheckingAuth: false, // 🔒 로그인 완료 시 플래그 초기화
      });

      // 토큰 저장
      if (access) {
        await AsyncStorage.setItem('auth-token', access);
      }
      if (refresh) {
        await AsyncStorage.setItem('refreshToken', refresh);
      }
      
      // 사용자 정보도 저장 (오프라인 모드를 위해)
      if (response.user) {
        await AsyncStorage.setItem('user-data', JSON.stringify(response.user));
      }

      // 로그인 성공 후 초기 데이터 로딩
      const hasBooks = await loadInitialData(response.user, access);

      // 가계부가 없으면 온보딩 화면으로, 있으면 메인 화면으로 이동
      if (hasBooks) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(modals)/book-creation?mode=onboarding');
      }
      
      return true;
    } catch (error) {
      console.error('Google 로그인 실패:', error);
      set({ 
        isLoading: false,
        isCheckingAuth: false, // 🔒 실패 시 플래그 초기화
      });
      return false;
    }
  },

  loginWithApple: async () => {
    console.log('\n=== AuthStore: Apple Login Started ===');
    try {
      set({ isLoading: true });
      
      // 1. Apple 로그인 수행
      console.log('Step 1: Calling appleService.login()...');
      const appleResult = await appleService.login();
      
      // 사용자가 취소한 경우
      if (!appleResult) {
        console.log('Apple login cancelled by user');
        set({ isLoading: false });
        return false;
      }
      
      console.log('Step 1 Complete: Got Apple tokens', {
        hasIdentityToken: !!appleResult.identityToken,
        hasAuthorizationCode: !!appleResult.authorizationCode,
        user: appleResult.user,
        email: appleResult.email
      });
      
      if (!appleResult.identityToken) {
        throw new Error('No identity token received from Apple');
      }
      
      // 2. 백엔드 로그인
      console.log('Step 2: Calling backend login with Apple tokens...');
      const response = await appleService.loginWithBackend(
        appleResult.identityToken,
        appleResult.authorizationCode || undefined
      );
      console.log('Step 2 Complete: Backend login successful');
      
      // 3. 상태 업데이트
      console.log('Step 3: Updating auth state...');
      const access = response.accessToken || response.token;
      const refresh = response.refreshToken || response.refresh || null;
      
      if (!access) {
        console.error('No access token in response:', response);
        throw new Error('No access token received from backend');
      }
      
      set({
        user: response.user,
        token: access,
        refreshToken: refresh,
        isAuthenticated: true,
        isLoading: false,
        isCheckingAuth: false, // 🔒 로그인 완료 시 플래그 초기화
      });

      // 4. 토큰 저장
      console.log('Step 4: Saving tokens to AsyncStorage...');
      if (access) {
        await AsyncStorage.setItem('auth-token', access);
      }
      if (refresh) {
        await AsyncStorage.setItem('refreshToken', refresh);
      }

      // 5. 초기 데이터 로딩
      console.log('Step 5: Loading initial data...');
      const hasBooks = await loadInitialData(response.user, access);
      console.log('Step 5 Complete: Initial data loaded, hasBooks:', hasBooks);

      // 6. 네비게이션
      console.log('Step 6: Navigating to appropriate screen...');
      if (hasBooks) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(modals)/book-creation?mode=onboarding');
      }
      
      console.log('=== Apple Login Complete ===\n');
      return true;
    } catch (error: any) {
      console.error('=== Apple Login Failed ===');
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      set({ 
        isLoading: false,
        isCheckingAuth: false, // 🔒 실패 시 플래그 초기화
      });
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
        isCheckingAuth: false, // 🔒 플래그도 초기화
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
      const access = response.token;
      const refresh = response.refreshToken || null;
      
      set({
        user: response.user,
        token: access,
        refreshToken: refresh,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // 토큰 저장
      if (access) {
        await AsyncStorage.setItem('auth-token', access);
      }
      if (refresh) {
        await AsyncStorage.setItem('refreshToken', refresh);
      }
      
      // 사용자 정보도 저장 (오프라인 모드를 위해)
      if (response.user) {
        await AsyncStorage.setItem('user-data', JSON.stringify(response.user));
      }

      // 회원가입 성공 후 초기 데이터 로딩
      const hasBooks = await loadInitialData(response.user, response.token);

      // 가계부가 없으면 온보딩 화면으로, 있으면 메인 화면으로 이동
      if (hasBooks) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(modals)/book-creation?mode=onboarding');
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      set({ isLoading: false });
      
      // 서버 에러 메시지 추출
      let errorMessage = '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  checkAuthStatus: async () => {
    console.log('\n🔄 === AuthStore: checkAuthStatus 시작 ===');
    
    // 🔒 중복 실행 방지 - 이미 실행 중이면 즉시 리턴
    const currentState = get();
    if (currentState.isCheckingAuth) {
      console.log('checkAuthStatus 이미 실행 중 - 중복 실행 방지');
      return;
    }
    
    // 실행 시작 플래그 설정
    set({ isCheckingAuth: true, isLoading: true });
    
    try {
      const token = await AsyncStorage.getItem('auth-token');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      console.log('토큰 확인:', token ? '존재' : '없음');
      console.log('리프레시 토큰 확인:', refreshToken ? '존재' : '없음');
      
      if (token) {
        try {
          // 토큰이 있으면 사용자 정보 가져오기 (타임아웃 단축 및 재시도 로직 개선)
          console.log('프로필 조회 시작...');
          
          const profilePromise = apiService.getCurrentUser(token);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PROFILE_TIMEOUT')), 3000) // 3초로 단축
          );
          
          const response = await Promise.race([profilePromise, timeoutPromise]);
          console.log('✅ 프로필 조회 성공');
          const { user } = response as { user: User };
          console.log('👤 사용자 정보:', user.username, `(ID: ${user.userId})`);
          
          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            isCheckingAuth: false, // 🔒 완료 시 플래그 해제
          });

          // 가계부 존재 여부 확인 (에러 발생해도 계속 진행)
          try {
            const hasBooks = await loadInitialData(user, token);
            // 🔥 네비게이션 제거 - 호출한 곳에서 처리하도록 함
            console.log('가계부 존재 여부:', hasBooks);
          } catch (initError) {
            console.log('초기 데이터 로드 실패 (계속 진행):', initError);
          }
          return;
        } catch (error: any) {
          console.error('❌ 프로필 조회 또는 토큰 검증 실패:', error.message || error);
          
          // 401 에러가 아닌 경우 (네트워크 오류 등) 토큰 갱신 시도
          if (!error.message?.includes('401') && refreshToken && error.message !== 'AUTH_FAILED') {
            console.log('네트워크 오류로 인한 실패 - 토큰이 있으므로 재시도');
            try {
              // 토큰이 있으면 한 번 더 시도 (axios interceptor가 토큰 갱신을 처리)
              const retryPromise = apiService.getProfile(token);
              const retryTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('RETRY_TIMEOUT')), 3000)
              );
              
              const retryResponse = await Promise.race([retryPromise, retryTimeoutPromise]);
              
              if (retryResponse) {
                console.log('재시도 성공');
                const { user } = retryResponse as { user: User };
                set({
                  user,
                  token,
                  refreshToken,
                  isAuthenticated: true,
                  isLoading: false,
                  isCheckingAuth: false, // 🔒 완료 시 플래그 해제
                });
                
                // 초기 데이터 로드 시도 (실패해도 계속 진행)
                try {
                  const hasBooks = await loadInitialData(user, token);
                  // 🔥 네비게이션 제거
                  console.log('가계부 존재 여부:', hasBooks);
                } catch (initError) {
                  console.log('초기 데이터 로드 실패 (계속 진행):', initError);
                }
                return;
              }
            } catch (retryError: any) {
              console.error('재시도 실패:', retryError);
            }
          }
          
          // 모든 복구 시도 실패 시 완전 초기화
          console.log('모든 인증 복구 시도 실패 - 완전 초기화 실행');
          set({ isLoading: false, isCheckingAuth: false }); // 🔒 플래그 해제
          await get().performCompleteReset();
          return;
        }
      } else {
        // 토큰이 없으면 상태만 업데이트 (네비게이션 제거)
        console.log('🔓 토큰 없음 - 인증되지 않음');
        console.log('=== 인증 상태 확인 종료 ===\n');
        set({
          isAuthenticated: false,
          isLoading: false,
          isCheckingAuth: false, // 🔒 완료 시 플래그 해제
        });
        // 🔥 router.replace 제거 - 호출한 곳에서 처리
      }
    } catch (error: any) {
      console.error('인증 상태 확인 중 예상치 못한 오류:', error);
      // 모든 에러에 대해 완전 초기화 (isLoading과 isCheckingAuth 먼저 해제)
      set({ isLoading: false, isCheckingAuth: false });
      await get().performCompleteReset();
    } finally {
      // 🔒 안전장치: finally에서도 플래그 해제 보장
      const finalState = get();
      if (finalState.isCheckingAuth) {
        console.log('finally: isCheckingAuth 플래그 해제');
        set({ isCheckingAuth: false });
      }
    }
  },

  // 완전 초기화 함수 - 앱을 깨끗한 상태로 되돌림
  performCompleteReset: async () => {
    console.log('=== 완전 초기화 시작 ===');
    
    try {
      // 0. 먼저 상태를 초기화 (에러가 발생해도 상태는 초기화되도록)
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false, // 중요: isLoading을 false로 설정
        isCheckingAuth: false, // 🔒 중복 실행 방지 플래그도 초기화
      });
      
      // 1. 모든 AsyncStorage 데이터 삭제
      try {
        const keys = await AsyncStorage.getAllKeys();
        const authKeys = keys.filter(key => 
          key.includes('auth') || 
          key.includes('token') || 
          key.includes('user') ||
          key.includes('book') ||
          key.includes('category') ||
          key.includes('asset') ||
          key.includes('budget') ||
          key.includes('ledger') ||
          key.includes('sync')
        );
        
        if (authKeys.length > 0) {
          await AsyncStorage.multiRemove(authKeys);
          console.log('삭제된 키들:', authKeys);
        }
      } catch (storageError) {
        console.error('AsyncStorage 삭제 실패:', storageError);
        // 에러가 발생해도 계속 진행
      }

      // 2. 모든 스토어 데이터 초기화
      try {
        await clearAllStoreData();
        console.log('모든 스토어 데이터 초기화 완료');
      } catch (storeError) {
        console.error('스토어 데이터 초기화 실패:', storeError);
        // 에러가 발생해도 계속 진행
      }

      // 🔥 3. 네비게이션 제거 - 호출한 곳에서 처리하도록 함
      console.log('완전 초기화 완료 - 상태만 초기화');
      
      console.log('=== 완전 초기화 완료 ===');
    } catch (error) {
      console.error('완전 초기화 중 오류:', error);
      // 오류가 발생해도 최소한 상태만은 초기화
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        isCheckingAuth: false, // 🔒 플래그 초기화 보장
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
    
    // 각 스토어 초기화 (reset 메서드가 있는 경우에만 호출)
    const bookStore = useBookStore.getState();
    const categoryStore = useCategoryStore.getState();
    const assetStore = useAssetStore.getState();
    const budgetStore = useBudgetStore.getState();
    
    // 스토어별 초기화 메서드 호출 (타입 안전하게)
    if ('reset' in bookStore && typeof bookStore.reset === 'function') {
      (bookStore as any).reset();
    }
    if ('reset' in categoryStore && typeof categoryStore.reset === 'function') {
      (categoryStore as any).reset();
    }
    if ('reset' in assetStore && typeof assetStore.reset === 'function') {
      (assetStore as any).reset();
    }
    if ('reset' in budgetStore && typeof budgetStore.reset === 'function') {
      (budgetStore as any).reset();
    }
    
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

    console.log('=== 초기 데이터 로딩 시작 ===');
    console.log('User:', user);
    console.log('Token 존재:', !!token);

    // 1. 가계부 목록 로드
    let booksLoaded = false;
    try {
      booksLoaded = await bookStore.fetchBooks(token);
      console.log('가계부 로드 결과:', booksLoaded);
    } catch (error) {
      console.error('가계부 로드 실패:', error);
      // 인증 실패가 아닌 경우에만 계속 진행
      if (error instanceof Error && (error.message === 'AUTH_FAILED' || error.message.includes('401'))) {
        throw error; // 상위로 전파
      }
    }
    
    if (booksLoaded) {
      const currentBook = useBookStore.getState().currentBook;
      const books = useBookStore.getState().books;
      
      console.log('Books:', books.length, 'CurrentBook:', currentBook?.title);
      
      // 가계부가 없으면 false 반환
      if (!currentBook || books.length === 0) {
        console.log('가계부가 없음 - 온보딩 필요');
        return false;
      }
      
      // 2. 병렬로 데이터 로딩 (에러 발생해도 계속 진행)
      const loadPromises = [
        // 카테고리 및 결제수단 로드
        categoryStore.fetchCategoriesByBook(currentBook.id, token).catch(err => {
          console.error('카테고리 로드 실패:', err);
          return null;
        }),
        categoryStore.fetchPaymentsByBook(currentBook.id, token).catch(err => {
          console.error('결제수단 로드 실패:', err);
          return null;
        }),
        
        // 가계부 멤버 정보 로드
        bookStore.fetchBookMembers(currentBook.id, token).catch(err => {
          console.error('멤버 정보 로드 실패:', err);
          return null;
        }),
        
        // 자산 정보 로드
        assetStore.fetchAssetTypes(token).catch(err => {
          console.error('자산 타입 로드 실패:', err);
          return null;
        }),
        assetStore.fetchAssetsByBook(currentBook.id, token).catch(err => {
          console.error('자산 목록 로드 실패:', err);
          return null;
        }),
      ];
      
      await Promise.all(loadPromises);
      console.log('기본 데이터 로드 완료');

      // 3. 최근 거래 내역 로드
      try {
        await bookStore.fetchLedgers({
          bookId: currentBook.id,
          page: 0,
          size: 20
        }, token);
        console.log('거래 내역 로드 완료');
      } catch (error) {
        console.error('거래 내역 로드 실패:', error);
        // 거래 내역은 선택사항이므로 에러 무시
      }

      // 4. 예산 정보 로드 (선택사항)
      const currentMonth = new Date().toISOString().slice(0, 7);
      try {
        const result = await budgetStore.getBudgetSummary(currentBook.id, currentMonth, token);
        if (result.error === 'budget_not_found') {
          console.log('예산 정보 없음 (정상)');
        }
      } catch (error) {
        console.log('예산 정보 로드 실패 (계속 진행):', error);
      }

      // 5. 실시간 동기화 연결
      if (user.id) {
        try {
          await syncService.connect(user.id, currentBook.id, token);
        } catch (error) {
          console.error('동기화 연결 실패:', error);
        }
      }

      // 6. 알림 서비스 초기화 (Firebase FCM 포함) - 중복 방지
      try {
        console.log('🔔 알림 서비스 초기화 시작...');
        
        // FCM 토큰 생성 및 등록 함수 (내부 함수로 정의)
        const generateAndRegisterNewToken = async () => {
          try {
            // Firebase FCM 토큰 먼저 시도
            const fcmToken = await firebaseService.getCurrentToken();
            
            let pushToken = fcmToken;
            
            // FCM 토큰이 없으면 기본 알림 서비스 사용
            if (!pushToken) {
              console.log('FCM 토큰 없음, 기본 알림 서비스 사용');
              pushToken = await notification.registerForPushNotifications();
            }
            
            if (pushToken && user.id) {
              console.log('FCM 토큰 서버 등록 중...');
              try {
                await notification.updateFCMToken(pushToken);
                console.log('✅ FCM 토큰 등록 완료');
                
                // Firebase 주제 구독 (선택사항)
                if (fcmToken) {
                  await firebaseService.subscribeToTopic(`user_${user.id}`);
                  await firebaseService.subscribeToTopic(`book_${currentBook.id}`);
                  console.log('✅ Firebase 주제 구독 완료');
                }
              } catch (tokenError) {
                console.error('❌ FCM 토큰 서버 등록 실패:', tokenError);
                // 토큰 등록 실패해도 앱은 계속 진행
              }
            }
          } catch (error) {
            console.error('❌ FCM 토큰 생성 실패:', error);
            // FCM 토큰 생성 실패해도 앱은 계속 진행
          }
        };
        
        // 이미 등록된 토큰이 있는지 확인
        const existingToken = await AsyncStorage.getItem('fcmToken');
        if (existingToken) {
          console.log('기존 FCM 토큰 발견, 서버 등록 시도...');
          // 기존 토큰으로 서버 등록 시도
          try {
            await notification.updateFCMToken(existingToken);
            console.log('✅ 기존 토큰 서버 등록 성공');
          } catch (error) {
            console.log('기존 토큰 서버 등록 실패, 새 토큰 생성 시도');
            // 기존 토큰이 실패하면 새 토큰 생성 시도 (실패해도 계속 진행)
            try {
              await generateAndRegisterNewToken();
            } catch (newTokenError) {
              console.error('새 토큰 생성도 실패:', newTokenError);
              // 새 토큰 생성도 실패해도 앱은 계속 진행
            }
          }
        } else {
          // 새 토큰 생성
          console.log('새 FCM 토큰 생성 중...');
          try {
            await generateAndRegisterNewToken();
          } catch (error) {
            console.error('새 토큰 생성 실패:', error);
            // 새 토큰 생성 실패해도 앱은 계속 진행
          }
        }
        
        // 알림 리스너 등록
        notification.registerNotificationListeners();
        console.log('✅ 알림 리스너 등록 완료');
        
      } catch (error) {
        console.error('❌ 알림 초기화 실패:', error);
      }
      
      console.log('=== 초기 데이터 로딩 완료 ===');
      return true; // 가계부가 있고 데이터 로딩 완료
    }
    
    console.log('가계부 로드 실패 또는 가계부 없음');
    return false; // 가계부 로딩 실패
  } catch (error: any) {
    console.error('초기 데이터 로딩 실패:', error);
    
    // 인증 오류인 경우 상위로 전파
    if (error.message === 'AUTH_FAILED' || error.response?.status === 401) {
      throw error;
    }
    
    return false;
  }
};

 