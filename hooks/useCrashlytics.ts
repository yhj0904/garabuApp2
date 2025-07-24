import { useCallback } from 'react';
import { firebaseService } from '@/services/firebaseService';

export const useCrashlytics = () => {
  const recordError = useCallback(async (error: Error, errorInfo?: any) => {
    // 콘솔에도 에러 출력
    console.error('Error caught by Crashlytics:', error);
    if (errorInfo) {
      console.error('Error info:', errorInfo);
    }

    // Crashlytics에 에러 기록
    await firebaseService.recordCrash(error);
    
    // 추가 정보가 있으면 로그로 기록
    if (errorInfo) {
      await firebaseService.addCrashlyticsLog(`Error info: ${JSON.stringify(errorInfo)}`);
    }
  }, []);

  const log = useCallback(async (message: string) => {
    await firebaseService.addCrashlyticsLog(message);
  }, []);

  const setAttribute = useCallback(async (key: string, value: string | number | boolean) => {
    await firebaseService.setCrashlyticsAttribute(key, value);
  }, []);

  const setAttributes = useCallback(async (attributes: Record<string, string | number | boolean>) => {
    await firebaseService.setCrashlyticsAttributes(attributes);
  }, []);

  const setUserId = useCallback(async (userId: string) => {
    await firebaseService.setCrashlyticsUserId(userId);
  }, []);

  return {
    recordError,
    log,
    setAttribute,
    setAttributes,
    setUserId
  };
};