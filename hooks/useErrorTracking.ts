import { useCallback } from 'react';
import { useAnalytics } from './useAnalytics';
import { AnalyticsEvents } from '@/utils/analytics';

interface ErrorTrackingOptions {
  errorType?: 'api' | 'runtime' | 'validation' | 'network' | 'unknown';
  context?: string;
  userId?: string | number;
  bookId?: number;
  additionalData?: Record<string, any>;
}

export const useErrorTracking = () => {
  const { logEvent } = useAnalytics();

  const trackError = useCallback((
    error: Error | unknown,
    options: ErrorTrackingOptions = {}
  ) => {
    const {
      errorType = 'unknown',
      context = 'unknown',
      userId,
      bookId,
      additionalData = {}
    } = options;

    // Error 정보 추출
    let errorMessage = 'Unknown error';
    let errorStack = '';
    let errorName = 'Error';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack || '';
      errorName = error.name;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    }

    // API 에러인 경우 더 상세한 정보 추출
    let statusCode: number | undefined;
    let apiEndpoint: string | undefined;
    
    if (errorType === 'api' && error && typeof error === 'object') {
      if ('status' in error) statusCode = Number(error.status);
      if ('config' in error && error.config && typeof error.config === 'object') {
        if ('url' in error.config) apiEndpoint = String(error.config.url);
      }
    }

    // Analytics 이벤트 로깅
    const eventName = errorType === 'api' ? AnalyticsEvents.API_ERROR : AnalyticsEvents.ERROR_OCCURRED;
    
    logEvent(eventName, {
      error_type: errorType,
      error_message: errorMessage,
      error_name: errorName,
      error_context: context,
      error_stack: errorStack.slice(0, 500), // 스택 트레이스 길이 제한
      status_code: statusCode,
      api_endpoint: apiEndpoint,
      user_id: userId,
      book_id: bookId,
      platform: 'mobile',
      ...additionalData
    });

    // 콘솔에도 에러 로깅 (개발 환경)
    if (__DEV__) {
      console.error(`[${errorType.toUpperCase()} ERROR in ${context}]:`, error);
    }
  }, [logEvent]);

  const trackApiError = useCallback((
    error: unknown,
    endpoint: string,
    context: string,
    additionalData?: Record<string, any>
  ) => {
    trackError(error, {
      errorType: 'api',
      context,
      additionalData: {
        ...additionalData,
        endpoint
      }
    });
  }, [trackError]);

  const trackPerformanceIssue = useCallback((
    operation: string,
    duration: number,
    threshold: number,
    additionalData?: Record<string, any>
  ) => {
    if (duration > threshold) {
      logEvent(AnalyticsEvents.SLOW_PERFORMANCE, {
        operation,
        duration_ms: Math.round(duration),
        threshold_ms: threshold,
        exceeded_by_ms: Math.round(duration - threshold),
        ...additionalData
      });
    }
  }, [logEvent]);

  return {
    trackError,
    trackApiError,
    trackPerformanceIssue
  };
};