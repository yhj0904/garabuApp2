import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen from '@/components/SplashScreen';
import { subscribeToDeepLinks } from '@/config/deepLinks';
import { useColorScheme } from '@/hooks/useColorScheme';
import { processPendingDeepLinks, useNotificationObserver } from '@/hooks/useNotificationObserver';
import { firebaseService } from '@/services/firebaseService';
import googleService from '@/services/googleService';
import { notificationService } from '@/services/notificationService';
import oauthKeyService from '@/services/oauthKeyService';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAppReady, setIsAppReady] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
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
    if (loaded) {
      setIsAppReady(true);
      // OAuth 키 가져오기 및 SDK 초기화
      initializeOAuthServices();
      // Firebase 서비스 초기화
      initializeFirebase();
    }
  }, [loaded]);

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
      
      
      // 알림 서비스 초기화
      const listeners = notificationService.registerNotificationListeners();
      
      // Deep link 구독 설정
      const deepLinkSubscription = subscribeToDeepLinks();
      
      // 앱 종료 시 리스너 정리
      return () => {
        notificationService.removeNotificationListeners(listeners);
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
