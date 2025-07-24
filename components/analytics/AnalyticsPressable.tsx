import React from 'react';
import { Pressable, PressableProps, GestureResponderEvent } from 'react-native';
import { useAnalytics } from '@/hooks/useAnalytics';

interface AnalyticsPressableProps extends PressableProps {
  eventName: string;
  eventParams?: Record<string, any>;
  children: React.ReactNode;
}

export const AnalyticsPressable: React.FC<AnalyticsPressableProps> = ({
  eventName,
  eventParams = {},
  onPress,
  children,
  ...props
}) => {
  const { logEvent } = useAnalytics();

  const handlePress = (event: GestureResponderEvent) => {
    // Analytics 이벤트 로깅
    logEvent(eventName, {
      ...eventParams,
      timestamp: new Date().toISOString(),
    });

    // 원래 onPress 핸들러 실행
    if (onPress) {
      onPress(event);
    }
  };

  return (
    <Pressable {...props} onPress={handlePress}>
      {children}
    </Pressable>
  );
};