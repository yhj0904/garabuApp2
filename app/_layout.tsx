import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';

import SplashScreen from '@/components/SplashScreen';
import { subscribeToDeepLinks } from '@/config/deepLinks';
import { useColorScheme } from '@/hooks/useColorScheme';
import { processPendingDeepLinks, useNotificationObserver } from '@/hooks/useNotificationObserver';
import { firebaseService } from '@/services/firebaseService';
import googleService from '@/features/auth/services/googleService';
import { fcmNotificationService } from '@/core/notifications/fcm';
import oauthKeyService from '@/services/oauthKeyService';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAppReady, setIsAppReady] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const router = useRouter();
  
  // Auth state
  const { isAuthenticated, user } = useAuthStore();
  const { books } = useBookStore();
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // threads-clone 스타일 알림 observer 사용
  useNotificationObserver();

  // 테마 값을 메모이제이션하여 불필요한 리렌더링 방지
  const theme = useMemo(() => 
    colorScheme === 'dark' ? DarkTheme : DefaultTheme, 
    [colorScheme]
  );

  useEffect(() => {
    console.log('=== App Layout Initialization ===');
    console.log('Fonts loaded:', loaded);
    console.log('Is Expo Go:', Constants.appOwnership === 'expo');
    console.log('App Version:', Constants.expoConfig?.version);
    console.log('Runtime Version:', Constants.expoConfig?.runtimeVersion);
    console.log('================================');
    
    if (loaded) {
      // EAS Update 체크 (production 빌드에서만)
      checkForUpdates();
      setIsAppReady(true);
      // OAuth 키 가져오기 및 SDK 초기화
      initializeOAuthServices();
      // Firebase 서비스 초기화
      initializeFirebase();
    }
  }, [loaded]);

  // 스플래시 화면 완료 후 라우팅 처리
  useEffect(() => {
    if (dataLoaded && isAppReady) {
      console.log('=== 라우팅 결정 ===');
      console.log('인증 상태:', isAuthenticated);
      console.log('사용자:', user);
      console.log('가계부 수:', books.length);
      
      // 인증되지 않은 경우 로그인 화면으로
      if (!isAuthenticated || !user) {
        console.log('로그인 화면으로 이동');
        router.replace('/(auth)/login');
      } 
      // 인증되었지만 가계부가 없는 경우
      else if (books.length === 0) {
        console.log('온보딩 화면으로 이동');
        router.replace('/(modals)/book-creation?mode=onboarding');
      }
      // 인증되고 가계부가 있는 경우
      else {
        console.log('메인 화면으로 이동');
        router.replace('/(tabs)');
      }
    }
  }, [dataLoaded, isAppReady, isAuthenticated, user, books.length]);

  // EAS Update 체크 함수
  const checkForUpdates = async () => {
    try {
      // 개발 환경에서는 업데이트 체크 건너뛰기
      if (__DEV__) {
        console.log('개발 환경에서는 업데이트 체크를 건너뜁니다');
        return;
      }

      console.log('EAS Update 체크 시작...');
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        console.log('업데이트 발견 - 다운로드 시작...');
        
        await Updates.fetchUpdateAsync();
        console.log('업데이트 다운로드 완료 - 앱 재시작...');
        
        // 업데이트 후 앱 재시작
        await Updates.reloadAsync();
      } else {
        console.log('사용 가능한 업데이트가 없습니다');
      }
    } catch (error) {
      // 업데이트 체크 실패 시 앱은 계속 진행
      console.log('업데이트 체크 중 오류 발생:', error);
      console.log('앱은 정상적으로 계속 실행됩니다');
    }
  };

  // OAuth 서비스 초기화
  const initializeOAuthServices = async () => {
    try {
      // 개발 빌드인지 확인 - 더 정확한 방법 사용
      const isExpoGo = Constants.appOwnership === 'expo';
      const isDevelopmentBuild = !isExpoGo;
      
      console.log('App Environment:', {
        appOwnership: Constants.appOwnership,
        executionEnvironment: Constants.executionEnvironment,
        isExpoGo,
        isDevelopmentBuild
      });
        
      if (isExpoGo) {
        console.log('Expo Go 환경에서는 OAuth 서비스를 사용할 수 없습니다.');
        return;
      }
      
      // 서버에서 OAuth 키 가져오기
      const keys = await oauthKeyService.fetchKeys();
      
      // Kakao SDK 초기화 - 조건부로 처리
      try {
        const { getKeyHashAndroid, initializeKakaoSDK } = await import('@react-native-kakao/core');
        const kakaoKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY || '9232996cd9a91757d2e423adfb12254a';

        console.log('=== Kakao SDK Initialization ===');
        console.log('Platform:', Constants.platform);
        console.log('App ownership:', Constants.appOwnership);
        console.log('Execution environment:', Constants.executionEnvironment);
        console.log('Initializing Kakao SDK with key:', kakaoKey);
        
        await initializeKakaoSDK(kakaoKey);
        console.log('Kakao SDK initialized successfully');

        // Android 디버그 빌드에서만 키 해시 출력
        if (Constants.platform?.android) {
          try {
            const hash = await getKeyHashAndroid();
            console.log('Android KeyHash:', hash);
            console.log('Register this hash in Kakao console');
          } catch (e) {
            console.log('getKeyHashAndroid error', e);
          }
        } else if (Constants.platform?.ios) {
          console.log('iOS platform detected - no keyhash needed');
        }
        
        console.log('=================================');
      } catch (kakaoError: any) {
        console.error('=== Kakao SDK initialization failed ===');
        console.error('Error:', kakaoError);
        console.error('Error message:', kakaoError.message);
        console.error('Error code:', kakaoError.code);
        console.error('=======================================');
      }
      
      // Google Sign-In 설정
      await googleService.configure();
      
      console.log('OAuth 서비스 초기화 완료');
    } catch (error) {
      console.error('OAuth 서비스 초기화 실패:', error);
    }
  };

  // Firebase 초기화 함수
  const initializeFirebase = async () => {
    try {
      console.log('Firebase 서비스 초기화 시작');
      await firebaseService.initialize();
      
      
      // FCM 알림 서비스는 자체 리스너를 관리함
      // Deep link 구독 설정
      const deepLinkSubscription = subscribeToDeepLinks();
      
      // 앱 종료 시 리스너 정리
      return () => {
        deepLinkSubscription.remove();
        firebaseService.cleanup();
      };
    } catch (error) {
      console.error('Firebase 초기화 실패:', error);
    }
  };

  // 스플래시 화면에서 데이터 로딩 완료 시 호출
  const handleLoadingComplete = () => {
    setDataLoaded(true);
    // threads-clone 스타일: 대기 중인 deep link 처리
    processPendingDeepLinks();
  };

  // 폰트 로딩 중이거나 데이터 로딩 중일 때 스플래시 화면 표시
  if (!loaded || !isAppReady || !dataLoaded) {
    return <SplashScreen onLoadingComplete={handleLoadingComplete} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(modals)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor="transparent" translucent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
