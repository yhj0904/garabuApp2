import { useEffect } from 'react';
import messaging, { getApp } from '@react-native-firebase/messaging';
import { onMessage, onNotificationOpenedApp, getInitialNotification } from '@react-native-firebase/messaging';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleDeepLink, navigateFromNotification } from '@/config/deepLinks';

/**
 * FCM 기반 알림 observer hook
 * 알림을 통한 네비게이션과 deep link 처리를 담당
 */
export function useFCMNotificationObserver() {
  useEffect(() => {
    let isMounted = true;

    // 알림을 통한 리다이렉션 처리
    function redirect(remoteMessage: any) {
      const data = remoteMessage.data;
      
      if (data) {
        // Deep link 또는 알림 데이터로 네비게이션
        navigateFromNotification(data);
      }
    }

    // 포그라운드에서 알림 수신 시 처리
    const unsubscribeOnMessage = onMessage(messaging(), async remoteMessage => {
      console.log('FCM notification received in foreground:', remoteMessage);
      // 포그라운드에서는 자동으로 리다이렉션하지 않음
      // 사용자가 알림을 탭했을 때만 처리
    });

    // 백그라운드 상태에서 알림 클릭 시 처리
    const unsubscribeOnNotificationOpenedApp = onNotificationOpenedApp(messaging(), remoteMessage => {
      console.log('Notification opened from background state:', remoteMessage);
      if (isMounted) {
        redirect(remoteMessage);
      }
    });

    // 앱이 종료된 상태에서 알림을 통해 앱을 시작한 경우
    getInitialNotification(messaging())
      .then(remoteMessage => {
        if (remoteMessage && isMounted) {
          console.log('App opened from notification:', remoteMessage);
          redirect(remoteMessage);
        }
      })
      .catch(error => {
        console.error('Error getting initial notification:', error);
      });

    return () => {
      isMounted = false;
      unsubscribeOnMessage();
      unsubscribeOnNotificationOpenedApp();
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