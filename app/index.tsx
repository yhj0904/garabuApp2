import { useAuthStore } from '@/stores/authStore';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isAuthenticated, isCheckingAuth } = useAuthStore();
  
  // 인증 확인 중이면 로딩 표시
  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  // 인증 상태에 따라 적절한 화면으로 리다이렉트
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
} 