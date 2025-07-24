import { useCallback } from 'react';
import { firebaseService } from '../services/firebaseService';

export const useAnalytics = () => {
  const logEvent = useCallback(async (eventName: string, params?: Record<string, any>) => {
    await firebaseService.logEvent(eventName, params);
  }, []);

  const logScreenView = useCallback(async (screenName: string, screenClass?: string) => {
    await firebaseService.logScreenView(screenName, screenClass);
  }, []);

  const setUserId = useCallback(async (userId: string | null) => {
    await firebaseService.setUserId(userId);
  }, []);

  const setUserProperty = useCallback(async (name: string, value: string) => {
    await firebaseService.setUserProperty(name, value);
  }, []);

  return {
    logEvent,
    logScreenView,
    setUserId,
    setUserProperty
  };
};