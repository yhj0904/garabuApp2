import { useAuthStore } from '@/stores/authStore';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

export default function AuthNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const currentRoute = segments[0];
    const isAuthRoute = currentRoute === 'login' || currentRoute === 'signup';

    if (!isAuthenticated && !isAuthRoute) {
      // 로그인되지 않은 상태에서 인증이 필요한 화면에 접근하려고 할 때
      router.replace('/login');
    } else if (isAuthenticated && isAuthRoute) {
      // 로그인된 상태에서 로그인/회원가입 화면에 접근하려고 할 때
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading, router]);

  return null; // 이 컴포넌트는 라우팅만 처리하므로 UI를 렌더링하지 않음
} 