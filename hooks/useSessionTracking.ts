import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAnalytics } from './useAnalytics';
import { AnalyticsEvents } from '@/utils/analytics';

export const useSessionTracking = () => {
  const { logEvent } = useAnalytics();
  const sessionStartTime = useRef<Date | null>(null);
  const lastActiveTime = useRef<Date>(new Date());
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // 세션 시작
    sessionStartTime.current = new Date();
    logEvent(AnalyticsEvents.SESSION_START, {
      timestamp: sessionStartTime.current.toISOString()
    });

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // 앱이 다시 활성화됨
        const inactiveTime = new Date().getTime() - lastActiveTime.current.getTime();
        
        // 30분 이상 비활성 상태였다면 새로운 세션으로 간주
        if (inactiveTime > 30 * 60 * 1000) {
          // 이전 세션 종료
          if (sessionStartTime.current) {
            const sessionDuration = lastActiveTime.current.getTime() - sessionStartTime.current.getTime();
            logEvent(AnalyticsEvents.SESSION_END, {
              duration_seconds: Math.round(sessionDuration / 1000),
              timestamp: lastActiveTime.current.toISOString()
            });
          }
          
          // 새 세션 시작
          sessionStartTime.current = new Date();
          logEvent(AnalyticsEvents.SESSION_START, {
            timestamp: sessionStartTime.current.toISOString()
          });
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // 앱이 백그라운드로 감
        lastActiveTime.current = new Date();
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // 컴포넌트 언마운트 시 세션 종료
      if (sessionStartTime.current) {
        const sessionDuration = new Date().getTime() - sessionStartTime.current.getTime();
        logEvent(AnalyticsEvents.SESSION_END, {
          duration_seconds: Math.round(sessionDuration / 1000),
          timestamp: new Date().toISOString()
        });
      }
      
      subscription.remove();
    };
  }, [logEvent]);
};