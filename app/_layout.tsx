import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SimpleSplashScreen from '@/components/SimpleSplashScreen';
import { subscribeToDeepLinks } from '@/config/deepLinks';
import { useNotificationObserver } from '@/hooks/useNotificationObserver';
import { firebaseService } from '@/services/firebaseService';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useModuleLoader } from '@/hooks/useModuleLoader';

function RootLayoutContent() {
  
  // Theme from context
  const { isDarkMode } = useTheme();
  
  // Auth state
  const { isAuthenticated, user, isCheckingAuth } = useAuthStore();
  const { books } = useBookStore();
  
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // 모듈 로더 사용
  const { isLoading, isReady, modules, error } = useModuleLoader(fontsLoaded);

  // threads-clone 스타일 알림 observer 사용
  useNotificationObserver();

  // 테마 값을 메모이제이션하여 불필요한 리렌더링 방지
  const navigationTheme = useMemo(() => 
    isDarkMode ? DarkTheme : DefaultTheme, 
    [isDarkMode]
  );

  // Deep link 구독 설정
  useEffect(() => {
    const deepLinkSubscription = subscribeToDeepLinks();
    
    return () => {
      deepLinkSubscription.remove();
      firebaseService.cleanup();
    };
  }, []);

  // 모듈 로딩 상태 디버깅
  useEffect(() => {
    console.log('=== 모듈 로딩 상태 ===');
    console.log('폰트 로드됨:', fontsLoaded);
    console.log('모듈 상태:', modules);
    console.log('로딩 중:', isLoading);
    console.log('준비 완료:', isReady);
    console.log('에러:', error);
    console.log('플랫폼:', Platform.OS);
    console.log('=====================');
  }, [fontsLoaded, modules, isLoading, isReady, error]);

  // 라우팅은 app/index.tsx에서 처리하므로 여기서는 제거
  useEffect(() => {
    if (isReady && !isCheckingAuth) {
      console.log('\n=== 🚀 앱 준비 완료 ===');
      console.log('✅ 모듈 로딩 완료:', isReady);
      console.log('🔑 인증 상태:', isAuthenticated);
      console.log('👤 사용자 정보:', user ? `${user.username} (ID: ${user.userId})` : 'null');
      console.log('📚 가계부 수:', books.length);
      console.log('=== 앱 준비 완료 ===\n');
    }
  }, [isReady, isAuthenticated, isCheckingAuth, user, books.length]);


  // 로딩 중이거나 라우팅 준비 중일 때 스플래시 화면 표시
  if (!fontsLoaded || isLoading || !isReady) {
    return <SimpleSplashScreen onLoadingComplete={() => {}} />;
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <NavigationThemeProvider value={navigationTheme}>
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: Platform.OS === 'android' ? 'fade' : 'default',
            animationDuration: 200
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(modals)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      </NavigationThemeProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
