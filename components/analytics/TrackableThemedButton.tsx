import React from 'react';
import { GestureResponderEvent } from 'react-native';
import { ThemedButton, ThemedButtonProps } from '@/components/ThemedButton';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePathname } from 'expo-router';

interface TrackableThemedButtonProps extends ThemedButtonProps {
  trackingName?: string; // 추적할 버튼 이름 (기본값: title)
  trackingParams?: Record<string, any>; // 추가 추적 파라미터
}

export const TrackableThemedButton: React.FC<TrackableThemedButtonProps> = ({
  trackingName,
  trackingParams = {},
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  ...props
}) => {
  const { logEvent } = useAnalytics();
  const pathname = usePathname();

  const handlePress = (event: GestureResponderEvent) => {
    // 화면 이름 추출
    const screenName = pathname
      ?.replace(/^\//, '')
      .replace(/\//g, '_')
      .replace(/\(|\)/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      || 'unknown';

    // Analytics 이벤트 로깅
    logEvent('button_clicked', {
      button_name: trackingName || title,
      screen_name: screenName,
      button_variant: variant,
      button_size: size,
      timestamp: new Date().toISOString(),
      ...trackingParams
    });

    // 원래 onPress 핸들러 실행
    if (onPress) {
      onPress(event);
    }
  };

  return (
    <ThemedButton
      {...props}
      title={title}
      variant={variant}
      size={size}
      onPress={handlePress}
    />
  );
};