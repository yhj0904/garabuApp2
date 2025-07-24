import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAnalytics } from './useAnalytics';
import { useAuthStore } from '@/stores/authStore';

const RETENTION_KEYS = {
  FIRST_OPEN: 'retention_first_open',
  LAST_ACTIVE: 'retention_last_active',
  TOTAL_DAYS_ACTIVE: 'retention_total_days_active',
  CONSECUTIVE_DAYS: 'retention_consecutive_days',
  LAST_ACTIVE_DATE: 'retention_last_active_date'
};

export const useRetentionTracking = () => {
  const { logEvent, setUserProperty } = useAnalytics();
  const { user, isAuthenticated } = useAuthStore();

  // 일일 활성 사용자 (DAU) 추적
  const trackDailyActive = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    const today = new Date().toISOString().split('T')[0];
    const lastActiveDate = await AsyncStorage.getItem(RETENTION_KEYS.LAST_ACTIVE_DATE);

    if (lastActiveDate !== today) {
      // 오늘 처음 활성화
      logEvent('daily_active_user', {
        date: today,
        user_id: user.userId
      });

      // 연속 사용일 계산
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split('T')[0];

      let consecutiveDays = 1;
      if (lastActiveDate === yesterday) {
        const savedConsecutive = await AsyncStorage.getItem(RETENTION_KEYS.CONSECUTIVE_DAYS);
        consecutiveDays = (parseInt(savedConsecutive || '0') || 0) + 1;
      }

      await AsyncStorage.setItem(RETENTION_KEYS.CONSECUTIVE_DAYS, consecutiveDays.toString());
      await AsyncStorage.setItem(RETENTION_KEYS.LAST_ACTIVE_DATE, today);

      // 연속 사용 마일스톤
      if ([7, 14, 30, 60, 90, 180, 365].includes(consecutiveDays)) {
        logEvent('retention_milestone', {
          milestone_days: consecutiveDays,
          milestone_type: 'consecutive_days'
        });
      }

      // 사용자 속성 업데이트
      setUserProperty('consecutive_days_active', consecutiveDays.toString());
    }
  }, [isAuthenticated, user, logEvent, setUserProperty]);

  // 주간 활성 사용자 (WAU) 추적
  const trackWeeklyActive = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    const currentWeek = getWeekNumber(new Date());
    const lastWeekTracked = await AsyncStorage.getItem('retention_last_week_tracked');

    if (lastWeekTracked !== currentWeek) {
      logEvent('weekly_active_user', {
        week: currentWeek,
        user_id: user.userId
      });
      await AsyncStorage.setItem('retention_last_week_tracked', currentWeek);
    }
  }, [isAuthenticated, user, logEvent]);

  // 월간 활성 사용자 (MAU) 추적
  const trackMonthlyActive = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastMonthTracked = await AsyncStorage.getItem('retention_last_month_tracked');

    if (lastMonthTracked !== currentMonth) {
      logEvent('monthly_active_user', {
        month: currentMonth,
        user_id: user.userId
      });
      await AsyncStorage.setItem('retention_last_month_tracked', currentMonth);
    }
  }, [isAuthenticated, user, logEvent]);

  // 복귀 사용자 추적
  const trackReturningUser = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    const lastActiveStr = await AsyncStorage.getItem(RETENTION_KEYS.LAST_ACTIVE);
    if (lastActiveStr) {
      const lastActive = new Date(lastActiveStr);
      const daysSinceLastActive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastActive > 0) {
        let returnType = 'next_day';
        if (daysSinceLastActive >= 30) {
          returnType = 'reactivated'; // 30일 이상 비활성 후 복귀
        } else if (daysSinceLastActive >= 7) {
          returnType = 'weekly_return';
        } else if (daysSinceLastActive >= 3) {
          returnType = 'multi_day_return';
        }

        logEvent('user_returned', {
          days_since_last_active: daysSinceLastActive,
          return_type: returnType,
          user_id: user.userId
        });
      }
    }

    await AsyncStorage.setItem(RETENTION_KEYS.LAST_ACTIVE, new Date().toISOString());
  }, [isAuthenticated, user, logEvent]);

  // 사용자 수명 주기 추적
  const trackUserLifecycle = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    const firstOpenStr = await AsyncStorage.getItem(RETENTION_KEYS.FIRST_OPEN);
    if (!firstOpenStr) {
      // 첫 실행
      await AsyncStorage.setItem(RETENTION_KEYS.FIRST_OPEN, new Date().toISOString());
      logEvent('user_lifecycle_start', {
        user_id: user.userId
      });
    } else {
      const firstOpen = new Date(firstOpenStr);
      const daysSinceFirstOpen = Math.floor((Date.now() - firstOpen.getTime()) / (1000 * 60 * 60 * 24));

      // 특정 기간 후 리텐션 추적
      if ([1, 3, 7, 14, 30, 60, 90, 180, 365].includes(daysSinceFirstOpen)) {
        logEvent('retention_checkpoint', {
          days_since_install: daysSinceFirstOpen,
          user_id: user.userId
        });
      }

      // 사용자 수명 주기 단계
      let lifecycleStage = 'new_user';
      if (daysSinceFirstOpen > 90) {
        lifecycleStage = 'loyal_user';
      } else if (daysSinceFirstOpen > 30) {
        lifecycleStage = 'regular_user';
      } else if (daysSinceFirstOpen > 7) {
        lifecycleStage = 'engaged_user';
      }

      setUserProperty('lifecycle_stage', lifecycleStage);
    }
  }, [isAuthenticated, user, logEvent, setUserProperty]);

  // 앱 시작 시 모든 리텐션 추적
  useEffect(() => {
    if (isAuthenticated && user) {
      trackDailyActive();
      trackWeeklyActive();
      trackMonthlyActive();
      trackReturningUser();
      trackUserLifecycle();
    }
  }, [isAuthenticated, user, trackDailyActive, trackWeeklyActive, trackMonthlyActive, trackReturningUser, trackUserLifecycle]);

  // 앱 상태 변경 감지
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAuthenticated && user) {
        trackDailyActive();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated, user, trackDailyActive]);

  return {
    trackDailyActive,
    trackWeeklyActive,
    trackMonthlyActive,
    trackReturningUser
  };
};

// 주 번호 계산 헬퍼 함수
function getWeekNumber(date: Date): string {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}