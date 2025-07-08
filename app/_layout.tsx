import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/stores/authStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { initializeAuth, isLoading, isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // 앱 시작 시 인증 상태 초기화
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isLoading || !loaded) return;

    const currentRoute = segments[0];
    const isAuthRoute = currentRoute === 'login' || currentRoute === 'signup';

    if (!isAuthenticated && !isAuthRoute) {
      // 로그인되지 않은 상태에서 인증이 필요한 화면에 접근하려고 할 때
      router.replace('/login');
    } else if (isAuthenticated && isAuthRoute) {
      // 로그인된 상태에서 로그인/회원가입 화면에 접근하려고 할 때
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading, loaded, router]);

  if (!loaded || isLoading) {
    // 폰트 로딩 중이거나 인증 상태 초기화 중일 때
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
