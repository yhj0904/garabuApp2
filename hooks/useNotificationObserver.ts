import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleDeepLink, navigateFromNotification } from '@/config/deepLinks';

/**
 * threads-clone 스타일의 알림 observer hook
 * 알림을 통한 네비게이션과 deep link 처리를 담당
 */
export function useNotificationObserver() {
  useEffect(() => {
    let isMounted = true;

    // 알림을 통한 리다이렉션 처리
    function redirect(notification: Notifications.Notification) {
      const data = notification.request.content.data;
      
      if (data) {
        // Deep link 또는 알림 데이터로 네비게이션
        navigateFromNotification(data);
      }
    }

    // 포그라운드에서 알림 수신 시 처리
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received in foreground:', notification);
        // 포그라운드에서는 자동으로 리다이렉션하지 않음
        // 사용자가 알림을 탭했을 때만 처리
      }
    );

    // 알림 응답 (탭) 시 처리
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response received:', response);
        if (isMounted) {
          redirect(response.notification);
        }
      }
    );

    // 앱이 종료된 상태에서 알림을 통해 앱을 시작한 경우
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response && isMounted) {
          console.log('App opened from notification:', response);
          redirect(response.notification);
        }
      })
      .catch((error) => {
        console.error('Error getting last notification response:', error);
      });

    return () => {
      isMounted = false;
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);
}

/**
 * 대기 중인 deep link 처리
 * 앱이 완전히 로드된 후 호출
 */
export async function processPendingDeepLinks() {
  try {
    const pendingDeepLink = await AsyncStorage.getItem('pendingDeepLink');
    if (pendingDeepLink) {
      console.log('Processing pending deep link:', pendingDeepLink);
      
      // 딜레이를 두어 앱이 완전히 로드되도록 함
      setTimeout(() => {
        handleDeepLink(pendingDeepLink);
      }, 1000);
      
      await AsyncStorage.removeItem('pendingDeepLink');
    }
  } catch (error) {
    console.error('Error processing pending deep links:', error);
  }
}