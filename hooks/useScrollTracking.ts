import { useCallback, useRef } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useAnalytics } from './useAnalytics';

interface ScrollTrackingOptions {
  screenName: string;
  threshold?: number; // 스크롤 깊이를 추적할 임계값 (0-100)
}

export const useScrollTracking = (options: ScrollTrackingOptions) => {
  const { screenName, threshold = 25 } = options;
  const { logEvent } = useAnalytics();
  
  const scrollDepthReached = useRef<Set<number>>(new Set());
  const maxScrollDepth = useRef(0);
  const scrollStartTime = useRef<Date>(new Date());

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    
    // 스크롤 가능한 전체 높이
    const scrollableHeight = contentSize.height - layoutMeasurement.height;
    
    if (scrollableHeight <= 0) return;
    
    // 현재 스크롤 퍼센트 계산
    const scrollPercentage = Math.round((contentOffset.y / scrollableHeight) * 100);
    
    // 최대 스크롤 깊이 업데이트
    if (scrollPercentage > maxScrollDepth.current) {
      maxScrollDepth.current = scrollPercentage;
    }
    
    // 임계값별 스크롤 깊이 추적 (25%, 50%, 75%, 100%)
    const depthMilestones = [25, 50, 75, 100];
    depthMilestones.forEach(milestone => {
      if (scrollPercentage >= milestone && !scrollDepthReached.current.has(milestone)) {
        scrollDepthReached.current.add(milestone);
        
        logEvent('scroll_depth_reached', {
          screen_name: screenName,
          depth_percentage: milestone,
          time_to_reach_seconds: Math.round((new Date().getTime() - scrollStartTime.current.getTime()) / 1000)
        });
      }
    });
  }, [screenName, logEvent]);

  const handleScrollEnd = useCallback(() => {
    if (maxScrollDepth.current > 0) {
      logEvent('scroll_summary', {
        screen_name: screenName,
        max_depth_percentage: maxScrollDepth.current,
        total_time_seconds: Math.round((new Date().getTime() - scrollStartTime.current.getTime()) / 1000),
        milestones_reached: Array.from(scrollDepthReached.current).sort()
      });
    }
  }, [screenName, logEvent]);

  const resetTracking = useCallback(() => {
    scrollDepthReached.current.clear();
    maxScrollDepth.current = 0;
    scrollStartTime.current = new Date();
  }, []);

  return {
    handleScroll,
    handleScrollEnd,
    resetTracking
  };
};