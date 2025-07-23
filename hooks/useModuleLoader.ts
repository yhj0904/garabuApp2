import { useState, useEffect, useCallback } from 'react';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { firebaseService } from '@/services/firebaseService';
import googleService from '@/features/auth/services/googleService';
import oauthKeyService from '@/services/oauthKeyService';
import { useAuthStore } from '@/stores/authStore';
import { processPendingDeepLinks } from '@/hooks/useNotificationObserver';

interface ModuleStatus {
  fonts: boolean;
  oauthKeys: boolean;
  kakaoSDK: boolean;
  googleSignIn: boolean;
  firebase: boolean;
  auth: boolean;
  deepLinks: boolean;
}

interface LoadingResult {
  isLoading: boolean;
  isReady: boolean;
  modules: ModuleStatus;
  error: string | null;
}

const isExpoGo = Constants.appOwnership === 'expo';

export function useModuleLoader(fontsLoaded: boolean): LoadingResult {
  const [modules, setModules] = useState<ModuleStatus>({
    fonts: false,
    oauthKeys: false,
    kakaoSDK: false,
    googleSignIn: false,
    firebase: false,
    auth: false,
    deepLinks: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { checkAuthStatus, isAuthenticated } = useAuthStore();

  const updateModule = useCallback((module: keyof ModuleStatus, status: boolean) => {
    setModules(prev => ({ ...prev, [module]: status }));
  }, []);

  // 폰트 로딩 상태 업데이트
  useEffect(() => {
    updateModule('fonts', fontsLoaded);
  }, [fontsLoaded, updateModule]);

  // EAS 업데이트 체크 (프로덕션 빌드에서만)
  const checkForUpdates = useCallback(async () => {
    if (__DEV__) {
      console.log('개발 환경에서는 업데이트 체크를 건너뜁니다');
      return;
    }

    try {
      console.log('EAS Update 체크 시작...');
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        console.log('업데이트 발견 - 다운로드 시작...');
        await Updates.fetchUpdateAsync();
        console.log('업데이트 다운로드 완료 - 앱 재시작...');
        await Updates.reloadAsync();
      } else {
        console.log('사용 가능한 업데이트가 없습니다');
      }
    } catch (error) {
      console.log('업데이트 체크 중 오류 발생:', error);
    }
  }, []);

  // OAuth 키 로드
  const loadOAuthKeys = useCallback(async () => {
    try {
      if (isExpoGo) {
        console.log('Expo Go 환경에서는 OAuth 키 로드를 건너뜁니다');
        updateModule('oauthKeys', true);
        return;
      }

      const keys = await oauthKeyService.fetchKeys();
      console.log('OAuth 키 로드 성공');
      updateModule('oauthKeys', true);
    } catch (error) {
      console.warn('OAuth 키 로드 실패:', error);
      updateModule('oauthKeys', false);
    }
  }, [updateModule]);

  // Kakao SDK 초기화
  const initializeKakaoSDK = useCallback(async () => {
    if (isExpoGo) {
      console.log('Expo Go 환경에서는 Kakao SDK를 사용할 수 없습니다');
      updateModule('kakaoSDK', true); // Skip but mark as "loaded"
      return;
    }

    try {
      const { getKeyHashAndroid, initializeKakaoSDK } = await import('@react-native-kakao/core');
      const kakaoKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY || '9232996cd9a91757d2e423adfb12254a';

      console.log('Kakao SDK 초기화 시작...');
      await initializeKakaoSDK(kakaoKey);
      console.log('Kakao SDK 초기화 성공');

      if (Constants.platform?.android) {
        try {
          const hash = await getKeyHashAndroid();
          console.log('Android KeyHash:', hash);
        } catch (e) {
          console.log('KeyHash 가져오기 실패:', e);
        }
      }

      updateModule('kakaoSDK', true);
    } catch (error) {
      console.error('Kakao SDK 초기화 실패:', error);
      updateModule('kakaoSDK', false);
    }
  }, [updateModule]);

  // Google Sign-In 초기화
  const initializeGoogleSignIn = useCallback(async () => {
    try {
      await googleService.configure();
      console.log('Google Sign-In 초기화 성공');
      updateModule('googleSignIn', true);
    } catch (error) {
      console.warn('Google Sign-In 초기화 실패:', error);
      updateModule('googleSignIn', false);
    }
  }, [updateModule]);

  // Firebase 초기화
  const initializeFirebase = useCallback(async () => {
    try {
      console.log('Firebase 초기화 시작...');
      await firebaseService.initialize();
      console.log('Firebase 초기화 성공');
      updateModule('firebase', true);
    } catch (error) {
      console.error('Firebase 초기화 실패:', error);
      updateModule('firebase', false);
    }
  }, [updateModule]);

  // 인증 상태 확인
  const checkAuth = useCallback(async () => {
    try {
      const authPromise = checkAuthStatus();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 3000)
      );
      
      await Promise.race([authPromise, timeoutPromise]);
      // 인증 상태는 authStore에서 관리하므로 여기서는 성공 여부만 표시
      updateModule('auth', true);
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
      updateModule('auth', true); // 실패해도 모듈은 로드된 것으로 처리
    }
  }, [checkAuthStatus, updateModule]);

  // Deep Links 초기화
  const initializeDeepLinks = useCallback(async () => {
    try {
      processPendingDeepLinks();
      updateModule('deepLinks', true);
    } catch (error) {
      console.error('Deep Links 초기화 실패:', error);
      updateModule('deepLinks', false);
    }
  }, [updateModule]);

  // 초기화 상태 추가
  const [hasInitialized, setHasInitialized] = useState(false);

  // 모든 모듈 초기화
  useEffect(() => {
    const initializeAllModules = async () => {
      if (!fontsLoaded || hasInitialized) return;

      console.log('=== 모듈 초기화 시작 ===');
      setIsLoading(true);
      setError(null);
      setHasInitialized(true);

      try {
        // 순차적으로 모듈 로드
        await checkForUpdates();
        await loadOAuthKeys();
        await initializeKakaoSDK();
        await initializeGoogleSignIn();
        await initializeFirebase();
        await checkAuth();
        await initializeDeepLinks();

        console.log('=== 모든 모듈 초기화 완료 ===');
      } catch (error) {
        console.error('모듈 초기화 중 오류:', error);
        setError(error instanceof Error ? error.message : '알 수 없는 오류');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAllModules();
  }, [fontsLoaded, hasInitialized]); // 의존성 단순화

  // 필수 모듈이 모두 로드되었는지 확인
  const isReady = modules.fonts && !isLoading;

  return {
    isLoading,
    isReady,
    modules,
    error,
  };
}