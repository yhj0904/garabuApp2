import { useCallback, useRef } from 'react';
import { useAnalytics } from './useAnalytics';
import { AnalyticsEvents } from '@/utils/analytics';

interface PerformanceMetric {
  name: string;
  startTime: number;
  metadata?: Record<string, any>;
}

export const usePerformanceTracking = () => {
  const { logEvent } = useAnalytics();
  const activeMetrics = useRef<Map<string, PerformanceMetric>>(new Map());

  // 성능 측정 시작
  const startTracking = useCallback((
    metricName: string,
    metadata?: Record<string, any>
  ) => {
    activeMetrics.current.set(metricName, {
      name: metricName,
      startTime: Date.now(),
      metadata
    });
  }, []);

  // 성능 측정 종료
  const endTracking = useCallback((
    metricName: string,
    additionalData?: Record<string, any>
  ) => {
    const metric = activeMetrics.current.get(metricName);
    if (!metric) {
      console.warn(`No active metric found for: ${metricName}`);
      return;
    }

    const duration = Date.now() - metric.startTime;
    activeMetrics.current.delete(metricName);

    // 성능 이벤트 로깅
    logEvent('performance_metric', {
      metric_name: metricName,
      duration_ms: duration,
      duration_seconds: parseFloat((duration / 1000).toFixed(2)),
      ...metric.metadata,
      ...additionalData
    });

    // 3초 이상 걸린 작업은 별도로 추적
    if (duration > 3000) {
      logEvent(AnalyticsEvents.SLOW_PERFORMANCE, {
        operation: metricName,
        duration_ms: duration,
        threshold_ms: 3000,
        exceeded_by_ms: duration - 3000,
        ...metric.metadata,
        ...additionalData
      });
    }

    return duration;
  }, [logEvent]);

  // API 호출 성능 추적
  const trackApiCall = useCallback(async <T,>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    startTracking(`api_${apiName}`, { api_name: apiName });
    
    try {
      const result = await apiCall();
      endTracking(`api_${apiName}`, { status: 'success' });
      return result;
    } catch (error) {
      endTracking(`api_${apiName}`, { 
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, [startTracking, endTracking]);

  // 화면 로딩 성능 추적
  const trackScreenLoad = useCallback((screenName: string) => {
    const trackingName = `screen_load_${screenName}`;
    
    // 시작
    startTracking(trackingName, { screen: screenName });

    // 종료 함수 반환
    return () => {
      endTracking(trackingName);
    };
  }, [startTracking, endTracking]);

  // 데이터 처리 성능 추적
  const trackDataProcessing = useCallback(<T,>(
    processName: string,
    processFunction: () => T,
    metadata?: Record<string, any>
  ): T => {
    startTracking(`process_${processName}`, { 
      process: processName,
      ...metadata 
    });
    
    try {
      const result = processFunction();
      endTracking(`process_${processName}`, { status: 'success' });
      return result;
    } catch (error) {
      endTracking(`process_${processName}`, { 
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, [startTracking, endTracking]);

  // 리스트 렌더링 성능 추적
  const trackListRender = useCallback((
    listName: string,
    itemCount: number
  ) => {
    const trackingName = `list_render_${listName}`;
    
    startTracking(trackingName, {
      list_name: listName,
      item_count: itemCount
    });

    return () => {
      const duration = endTracking(trackingName);
      
      // 100개 이상 아이템에서 1초 이상 걸리면 성능 이슈로 간주
      if (itemCount > 100 && duration && duration > 1000) {
        logEvent('list_render_performance_issue', {
          list_name: listName,
          item_count: itemCount,
          duration_ms: duration,
          avg_per_item_ms: parseFloat((duration / itemCount).toFixed(2))
        });
      }
    };
  }, [startTracking, endTracking, logEvent]);

  return {
    startTracking,
    endTracking,
    trackApiCall,
    trackScreenLoad,
    trackDataProcessing,
    trackListRender
  };
};