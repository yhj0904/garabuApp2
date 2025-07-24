import React, { useEffect } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { useScrollTracking } from '@/hooks/useScrollTracking';

interface TrackableScrollViewProps extends ScrollViewProps {
  screenName: string;
  children: React.ReactNode;
}

export const TrackableScrollView: React.FC<TrackableScrollViewProps> = ({
  screenName,
  onScroll,
  onMomentumScrollEnd,
  children,
  ...props
}) => {
  const { handleScroll, handleScrollEnd, resetTracking } = useScrollTracking({ screenName });

  useEffect(() => {
    // 컴포넌트 마운트 시 추적 리셋
    resetTracking();
  }, [resetTracking]);

  const handleScrollEvent = (event: any) => {
    handleScroll(event);
    if (onScroll) {
      onScroll(event);
    }
  };

  const handleMomentumScrollEndEvent = (event: any) => {
    handleScrollEnd();
    if (onMomentumScrollEnd) {
      onMomentumScrollEnd(event);
    }
  };

  return (
    <ScrollView
      {...props}
      onScroll={handleScrollEvent}
      onMomentumScrollEnd={handleMomentumScrollEndEvent}
      scrollEventThrottle={16}
    >
      {children}
    </ScrollView>
  );
};