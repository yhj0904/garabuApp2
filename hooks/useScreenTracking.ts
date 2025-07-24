import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { useAnalytics } from './useAnalytics';

export const useScreenTracking = () => {
  const pathname = usePathname();
  const { logScreenView, logEvent } = useAnalytics();
  const screenStartTime = useRef<Date | null>(null);
  const previousScreen = useRef<string | null>(null);

  useEffect(() => {
    if (pathname) {
      // 화면 이름을 더 읽기 쉽게 변환
      const screenName = pathname
        .replace(/^\//, '') // 앞의 슬래시 제거
        .replace(/\//g, '_') // 슬래시를 언더스코어로 변경
        .replace(/\(|\)/g, '') // 괄호 제거
        .replace(/_+/g, '_') // 중복 언더스코어 제거
        .replace(/^_|_$/g, '') // 앞뒤 언더스코어 제거
        || 'home';
      
      // 이전 화면의 체류 시간 계산
      if (screenStartTime.current && previousScreen.current) {
        const timeSpent = new Date().getTime() - screenStartTime.current.getTime();
        logEvent('screen_time_spent', {
          screen_name: previousScreen.current,
          time_spent_seconds: Math.round(timeSpent / 1000),
          next_screen: screenName
        });
      }
      
      // 새 화면 추적
      logScreenView(screenName);
      screenStartTime.current = new Date();
      previousScreen.current = screenName;
    }
    
    // 컴포넌트 언마운트 시 마지막 화면 체류 시간 기록
    return () => {
      if (screenStartTime.current && previousScreen.current) {
        const timeSpent = new Date().getTime() - screenStartTime.current.getTime();
        logEvent('screen_time_spent', {
          screen_name: previousScreen.current,
          time_spent_seconds: Math.round(timeSpent / 1000),
          next_screen: 'app_background_or_closed'
        });
      }
    };
  }, [pathname, logScreenView, logEvent]);
};