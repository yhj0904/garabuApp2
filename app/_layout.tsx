import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import SplashScreen from '@/components/SplashScreen';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/stores/authStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAppReady, setIsAppReady] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // 테마 값을 메모이제이션하여 불필요한 리렌더링 방지
  const theme = useMemo(() => 
    colorScheme === 'dark' ? DarkTheme : DefaultTheme, 
    [colorScheme]
  );

  useEffect(() => {
    if (loaded) {
      setIsAppReady(true);
    }
  }, [loaded]);

  // 스플래시 화면에서 데이터 로딩 완료 시 호출
  const handleLoadingComplete = () => {
    setDataLoaded(true);
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
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor="transparent" translucent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
