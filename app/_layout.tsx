import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import SplashScreen from '@/components/SplashScreen';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAppReady, setIsAppReady] = useState(false);
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // 테마 값을 메모이제이션하여 불필요한 리렌더링 방지
  const theme = useMemo(() => 
    colorScheme === 'dark' ? DarkTheme : DefaultTheme, 
    [colorScheme]
  );

  useEffect(() => {
    // 간단한 앱 초기화
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 2000); // 스플래시 화면과 동일한 시간으로 설정

    return () => clearTimeout(timer);
  }, []);

  // 폰트 로딩 중이거나 앱 초기화 중일 때 스플래시 화면 표시
  if (!loaded || !isAppReady) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(modals)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor="transparent" translucent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
