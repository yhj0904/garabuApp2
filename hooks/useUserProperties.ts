import { useEffect } from 'react';
import { useAnalytics } from './useAnalytics';
import { UserProperties } from '@/utils/analytics';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useUserProperties = () => {
  const { setUserProperty } = useAnalytics();
  const { user, isAuthenticated } = useAuthStore();
  const { books, ledgers } = useBookStore();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // 사용자 속성 업데이트
    const updateUserProperties = async () => {
      // 가계부 수
      setUserProperty(UserProperties.BOOKS_COUNT, books.length.toString());

      // 테마 설정
      setUserProperty(UserProperties.THEME_PREFERENCE, isDarkMode ? 'dark' : 'light');

      // 인증 제공자
      if (user.providerId) {
        setUserProperty(UserProperties.AUTH_PROVIDER, user.providerId);
      }

      // 총 거래 수
      setUserProperty(UserProperties.TOTAL_TRANSACTIONS, ledgers.length.toString());

      // 공유 가계부 여부
      const hasSharedBook = books.some(book => {
        // 멤버가 2명 이상이면 공유 중
        return book.members && book.members.length > 1;
      });
      setUserProperty(UserProperties.HAS_SHARED_BOOK, hasSharedBook ? 'true' : 'false');

      // 계정 생성일로부터 경과일
      if (user.createdAt) {
        const accountAge = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        setUserProperty(UserProperties.ACCOUNT_AGE_DAYS, accountAge.toString());
      }

      // 사용자 타입 분류
      let userType = 'new_user';
      if (ledgers.length > 100) {
        userType = 'power_user';
      } else if (ledgers.length > 10) {
        userType = 'active_user';
      }
      setUserProperty(UserProperties.USER_TYPE, userType);

      // 알림 설정 상태
      try {
        const notificationEnabled = await AsyncStorage.getItem('notificationEnabled');
        setUserProperty(UserProperties.NOTIFICATION_ENABLED, notificationEnabled === 'true' ? 'true' : 'false');
      } catch (error) {
        console.log('Failed to get notification status');
      }

      // 기본 통화
      try {
        const defaultCurrency = await AsyncStorage.getItem('defaultCurrency');
        setUserProperty(UserProperties.DEFAULT_CURRENCY, defaultCurrency || 'KRW');
      } catch (error) {
        console.log('Failed to get default currency');
      }
    };

    updateUserProperties();
  }, [isAuthenticated, user, books.length, ledgers.length, isDarkMode, setUserProperty]);
};