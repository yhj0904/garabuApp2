import { useCallback } from 'react';
import { useAnalytics } from './useAnalytics';

interface ButtonTrackingOptions {
  screen?: string;
  section?: string;
  buttonType?: 'primary' | 'secondary' | 'icon' | 'text' | 'tab' | 'other';
  additionalParams?: Record<string, any>;
}

export const useButtonTracking = () => {
  const { logEvent } = useAnalytics();

  const trackButtonClick = useCallback((
    buttonName: string,
    options: ButtonTrackingOptions = {}
  ) => {
    const {
      screen,
      section,
      buttonType = 'other',
      additionalParams = {}
    } = options;

    logEvent('button_clicked', {
      button_name: buttonName,
      screen_name: screen,
      section_name: section,
      button_type: buttonType,
      timestamp: new Date().toISOString(),
      ...additionalParams
    });
  }, [logEvent]);

  // 자주 사용되는 버튼 추적 헬퍼
  const trackTabSwitch = useCallback((tabName: string, tabIndex: number, screenName: string) => {
    trackButtonClick(tabName, {
      screen: screenName,
      buttonType: 'tab',
      additionalParams: {
        tab_index: tabIndex
      }
    });
  }, [trackButtonClick]);

  const trackModalOpen = useCallback((modalName: string, triggerScreen: string) => {
    trackButtonClick(`open_${modalName}`, {
      screen: triggerScreen,
      section: 'modal_trigger',
      additionalParams: {
        modal_name: modalName
      }
    });
  }, [trackButtonClick]);

  const trackActionButton = useCallback((
    action: string,
    screen: string,
    additionalParams?: Record<string, any>
  ) => {
    trackButtonClick(action, {
      screen,
      buttonType: 'primary',
      additionalParams
    });
  }, [trackButtonClick]);

  return {
    trackButtonClick,
    trackTabSwitch,
    trackModalOpen,
    trackActionButton
  };
};