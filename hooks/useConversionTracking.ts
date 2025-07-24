import { useCallback, useEffect, useRef } from 'react';
import { useAnalytics } from './useAnalytics';
import { ConversionEvents } from '@/utils/analytics';
import { useBookStore } from '@/stores/bookStore';
import { useAuthStore } from '@/stores/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONVERSION_STORAGE_KEY = 'conversion_events_tracked';

export const useConversionTracking = () => {
  const { logEvent } = useAnalytics();
  const { books, ledgers } = useBookStore();
  const { user } = useAuthStore();
  const trackedEvents = useRef<Set<string>>(new Set());

  // 저장된 추적 이벤트 로드
  useEffect(() => {
    const loadTrackedEvents = async () => {
      try {
        const saved = await AsyncStorage.getItem(CONVERSION_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          trackedEvents.current = new Set(parsed);
        }
      } catch (error) {
        console.log('Failed to load tracked conversion events');
      }
    };
    loadTrackedEvents();
  }, []);

  // 전환 이벤트 추적
  const trackConversion = useCallback(async (event: string, params?: Record<string, any>) => {
    if (trackedEvents.current.has(event)) {
      return; // 이미 추적된 이벤트
    }

    logEvent(event, {
      user_id: user?.userId,
      timestamp: new Date().toISOString(),
      ...params
    });

    // 추적된 이벤트로 표시
    trackedEvents.current.add(event);
    
    // 저장
    try {
      await AsyncStorage.setItem(
        CONVERSION_STORAGE_KEY,
        JSON.stringify(Array.from(trackedEvents.current))
      );
    } catch (error) {
      console.log('Failed to save conversion tracking state');
    }
  }, [logEvent, user]);

  // 첫 거래 추적
  useEffect(() => {
    if (ledgers.length === 1 && !trackedEvents.current.has(ConversionEvents.FIRST_TRANSACTION)) {
      trackConversion(ConversionEvents.FIRST_TRANSACTION, {
        transaction_type: ledgers[0].amountType,
        amount: ledgers[0].amount
      });
    }
  }, [ledgers.length, trackConversion]);

  // 10개, 100개 거래 도달
  useEffect(() => {
    if (ledgers.length >= 10 && !trackedEvents.current.has(ConversionEvents.REACHED_10_TRANSACTIONS)) {
      trackConversion(ConversionEvents.REACHED_10_TRANSACTIONS);
    }
    if (ledgers.length >= 100 && !trackedEvents.current.has(ConversionEvents.REACHED_100_TRANSACTIONS)) {
      trackConversion(ConversionEvents.REACHED_100_TRANSACTIONS);
    }
  }, [ledgers.length, trackConversion]);

  // 첫 가계부 생성 추적
  useEffect(() => {
    if (books.length === 1 && !trackedEvents.current.has(ConversionEvents.FIRST_BOOK_CREATED)) {
      trackConversion(ConversionEvents.FIRST_BOOK_CREATED, {
        book_title: books[0].title
      });
    }
  }, [books.length, trackConversion]);

  // 가계부 공유 추적
  useEffect(() => {
    const hasSharedBook = books.some(book => book.members && book.members.length > 1);
    if (hasSharedBook && !trackedEvents.current.has(ConversionEvents.FIRST_BOOK_SHARED)) {
      trackConversion(ConversionEvents.FIRST_BOOK_SHARED);
    }
  }, [books, trackConversion]);

  // 수동 전환 이벤트 추적 함수들
  const trackFirstBudgetSet = useCallback(() => {
    trackConversion(ConversionEvents.FIRST_BUDGET_SET);
  }, [trackConversion]);

  const trackFirstAssetAdded = useCallback(() => {
    trackConversion(ConversionEvents.FIRST_ASSET_ADDED);
  }, [trackConversion]);

  const trackOnboardingComplete = useCallback(() => {
    trackConversion(ConversionEvents.COMPLETED_ONBOARDING);
  }, [trackConversion]);

  const trackNotificationActivated = useCallback(() => {
    trackConversion(ConversionEvents.ACTIVATED_NOTIFICATIONS);
  }, [trackConversion]);

  const trackFriendInvited = useCallback(() => {
    trackConversion(ConversionEvents.INVITED_FRIEND);
  }, [trackConversion]);

  return {
    trackFirstBudgetSet,
    trackFirstAssetAdded,
    trackOnboardingComplete,
    trackNotificationActivated,
    trackFriendInvited,
    trackConversion
  };
};