import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, AppState, AppStateStatus } from 'react-native';
import Constants from 'expo-constants';
import { firebaseConfig, fcmConfig, notificationCategories } from '../firebase.config';
import { firebaseService } from './firebaseService';
import apiService from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 조건부 import - Expo Go에서는 사용 불가능한 모듈
let messaging: any = null;
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (error) {
  console.log('Firebase Messaging not available in Expo Go');
}

// FCM 토큰 관련 인터페이스
interface FCMToken {
  id: number;
  appId: string;
  userId: string;
  deviceId: string;
  fcmToken: string;
  regDt: string;
  useAt: string;
  deviceType?: 'ios' | 'android' | 'web';
}

interface FCMTokenRequest {
  token: string;
  deviceId: string;
  deviceType: 'ios' | 'android' | 'web';
  appVersion?: string;
  osVersion?: string;
}

// 알림 데이터 인터페이스
interface NotificationData {
  type?: 'transaction' | 'budget' | 'book_share' | 'friend_request' | 'message';
  bookId?: string;
  ledgerId?: string;
  friendshipId?: string;
  messageId?: string;
  action?: string;
}

// 알림 설정 (threads-clone 스타일 개선)
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // 알림 표시 여부를 동적으로 결정
    const appState = AppState.currentState;
    const shouldShow = appState === 'active' ? fcmConfig.ios.foregroundPresentationOptions : true;
    
    return {
      shouldShowAlert: shouldShow.alert || true,
      shouldPlaySound: shouldShow.sound || true,
      shouldSetBadge: shouldShow.badge || false,
      shouldShowBanner: shouldShow.banner || true,
      shouldShowList: shouldShow.list || true,
    };
  },
  handleSuccess(notificationId) {
    console.log('Notification handled successfully:', notificationId);
  },
  handleError(notificationId, error) {
    console.error('Notification handling error:', notificationId, error);
  },
});

class NotificationService {
  private pushToken: string | null = null;
  private appStateSubscription: any = null;
  private notificationListeners: any[] = [];
  private lastNotificationId: string | null = null;

  constructor() {
    this.initialize();
  }

  // 서비스 초기화
  async initialize() {
    try {
      // 앱 상태 변경 리스너
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
      
      // 알림 카테고리 설정 (iOS)
      if (Platform.OS === 'ios') {
        await this.setNotificationCategories();
      }

      // 알림 리스너 설정
      this.setupNotificationListeners();
      
      // Firebase 서비스 초기화
      await firebaseService.initialize();
      
      console.log('NotificationService initialized');
    } catch (error) {
      console.error('NotificationService initialization error:', error);
    }
  }

  // 알림 권한 요청 (threads-clone 스타일 개선)
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('푸시 알림은 실제 기기에서만 작동합니다');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
            allowCriticalAlerts: false,
            provideAppNotificationSettings: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('알림 권한이 거부되었습니다');
        // threads-clone 스타일: 설정으로 이동하도록 안내
        if (Platform.OS === 'ios') {
          const { Linking } = require('react-native');
          return Linking.openSettings();
        }
        return false;
      }

      // Android 채널 설정
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      return true;
    } catch (error) {
      console.error('권한 요청 오류:', error);
      return false;
    }
  }

  // Android 알림 채널 설정
  private async setupAndroidChannels() {
    const { android } = fcmConfig;
    
    await Notifications.setNotificationChannelAsync(android.channelId, {
      name: android.channelName,
      description: android.channelDescription,
      importance: Notifications.AndroidImportance[android.importance.toUpperCase()],
      vibrationPattern: android.vibrationPattern,
      lightColor: android.lightColor,
      sound: android.sound === 'default' ? 'default' : android.sound,
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });

    // 추가 채널들 (거래, 예산, 공유 등)
    const channels = [
      { id: 'transaction', name: '거래 알림', description: '새로운 거래가 추가되었을 때 알림' },
      { id: 'budget', name: '예산 알림', description: '예산 초과 및 목표 달성 알림' },
      { id: 'book_share', name: '가계부 공유', description: '가계부 공유 요청 및 승인 알림' },
      { id: 'friend', name: '친구 알림', description: '친구 요청 및 메시지 알림' },
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        description: channel.description,
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }
  }

  // iOS 알림 카테고리 설정
  private async setNotificationCategories() {
    try {
      // Expo SDK 50+에서는 setNotificationCategoriesAsync가 제거됨
      // 대신 각 알림에서 categoryIdentifier를 설정하여 사용
      console.log('iOS notification categories configured (handled per notification)');
      
      // 카테고리 정보를 저장해두고 나중에 사용
      await AsyncStorage.setItem('notificationCategories', JSON.stringify(notificationCategories));
    } catch (error) {
      console.warn('Failed to set notification categories:', error);
    }
  }

  // FCM 토큰 등록
  async registerForPushNotifications(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // 개발 빌드에서 FCM 토큰 생성
      if (messaging) {
        const fcmToken = await this.generateFCMToken();
        if (fcmToken) {
          this.pushToken = fcmToken;
          await this.registerTokenWithServer(fcmToken);
          return fcmToken;
        }
      }

      // Expo Go 또는 FCM 실패 시 Expo Push Token 사용
      if (__DEV__ || !messaging) {
        console.log('개발 환경: Expo Push Token 사용');
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
        
        const token = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        
        this.pushToken = token.data;
        await this.registerTokenWithServer(token.data, true); // isExpoPushToken = true
        return token.data;
      }

      return null;
    } catch (error) {
      console.error('푸시 알림 등록 오류:', error);
      return null;
    }
  }

  // FCM 토큰 생성
  private async generateFCMToken(): Promise<string | null> {
    if (!messaging) return null;

    try {
      // FCM 권한 확인
      const authStatus = await messaging().hasPermission();
      const enabled = authStatus === 1 || authStatus === 2; // AUTHORIZED = 1, PROVISIONAL = 2

      if (!enabled) {
        // 권한 요청
        const requestStatus = await messaging().requestPermission();
        if (requestStatus !== 1) { // AUTHORIZED = 1
          console.log('FCM 권한이 거부되었습니다');
          return null;
        }
      }

      // FCM 토큰 가져오기
      const fcmToken = await messaging().getToken();
      console.log('FCM 토큰 생성 성공:', fcmToken);
      
      // 토큰 새로고침 리스너
      messaging().onTokenRefresh((token: string) => {
        console.log('FCM 토큰 새로고침:', token);
        this.pushToken = token;
        this.registerTokenWithServer(token);
      });

      return fcmToken;
    } catch (error) {
      console.error('FCM 토큰 생성 오류:', error);
      return null;
    }
  }

  // 서버에 토큰 등록
  private async registerTokenWithServer(token: string, isExpoPushToken = false) {
    try {
      const deviceId = Device.deviceName || Device.modelId || 'unknown';
      const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
      
      if (isExpoPushToken) {
        // Expo Push Token 등록
        const expoRequest = {
          expoPushToken: token,
          deviceId: `expo_${deviceId}`,
          platform: deviceType,
          appVersion: Constants.expoConfig?.version || '1.0.0',
        };
        
        await apiService.registerExpoPushToken(expoRequest);
        await AsyncStorage.setItem('expoPushToken', token);
        console.log('Expo Push Token 서버 등록 성공');
      } else {
        // FCM 토큰 등록
        const request: FCMTokenRequest = {
          token,
          deviceId,
          deviceType,
          appVersion: Constants.expoConfig?.version || '1.0.0',
          osVersion: Platform.Version.toString(),
        };

        await apiService.registerFCMToken(request);
        await AsyncStorage.setItem('fcmToken', token);
        console.log('FCM 토큰 서버 등록 성공');
      }
    } catch (error) {
      console.error('토큰 서버 등록 실패:', error);
    }
  }

  // 토큰 업데이트
  async updateFCMToken(token: string) {
    this.pushToken = token;
    await this.registerTokenWithServer(token);
  }

  // 알림 리스너 설정
  private setupNotificationListeners() {
    // 포그라운드 알림 수신
    this.notificationListeners.push(
      Notifications.addNotificationReceivedListener(notification => {
        console.log('포그라운드 알림 수신:', notification);
        this.handleNotificationReceived(notification);
      })
    );

    // 알림 클릭 이벤트 (threads-clone 스타일 추가)
    this.notificationListeners.push(
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log('알림 클릭:', response);
        this.handleNotificationResponse(response);
        
        // threads-clone 스타일 URL 리다이렉션 처리
        const url = response.notification.request.content.data?.url as string;
        if (url) {
          this.handleDeepLinkNavigation(url);
        }
      })
    );

    // Firebase 메시지 리스너 (개발 빌드용)
    if (messaging) {
      messaging().onMessage(async (remoteMessage: any) => {
        console.log('FCM 메시지 수신:', remoteMessage);
        await this.scheduleLocalNotification({
          title: remoteMessage.notification?.title || '알림',
          body: remoteMessage.notification?.body || '',
          data: remoteMessage.data,
          categoryIdentifier: remoteMessage.data?.type,
        });
      });

      messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
        console.log('백그라운드 FCM 메시지:', remoteMessage);
      });
    }
  }

  // 알림 수신 처리
  private handleNotificationReceived(notification: Notifications.Notification) {
    // 중복 알림 방지
    if (notification.request.identifier === this.lastNotificationId) {
      return;
    }
    this.lastNotificationId = notification.request.identifier;

    const { data } = notification.request.content;
    if (data) {
      this.processNotificationData(data as NotificationData);
    }
  }

  // 알림 응답 처리
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const { data } = response.notification.request.content;
    const { actionIdentifier } = response;

    if (data) {
      this.handleNotificationAction(data as NotificationData, actionIdentifier);
    }
  }

  // 알림 데이터 처리
  private processNotificationData(data: NotificationData) {
    switch (data.type) {
      case 'transaction':
        // 거래 알림 처리
        console.log('새로운 거래:', data.ledgerId);
        break;
      case 'budget':
        // 예산 알림 처리
        console.log('예산 알림:', data.bookId);
        break;
      case 'book_share':
        // 가계부 공유 알림 처리
        console.log('가계부 공유 요청:', data.bookId);
        break;
      case 'friend_request':
        // 친구 요청 알림 처리
        console.log('친구 요청:', data.friendshipId);
        break;
      case 'message':
        // 메시지 알림 처리
        console.log('새 메시지:', data.messageId);
        break;
    }
  }

  // 알림 액션 처리
  private handleNotificationAction(data: NotificationData, actionId: string) {
    // 라우팅 처리는 App.tsx에서 navigation 준비 후 수행
    if (data.type && data.action) {
      // 임시로 AsyncStorage에 저장
      AsyncStorage.setItem('pendingNotificationAction', JSON.stringify({
        data,
        actionId,
        timestamp: Date.now(),
      }));
    }
  }

  // 로컬 알림 예약
  async scheduleLocalNotification(content: {
    title: string;
    body: string;
    data?: any;
    categoryIdentifier?: string;
    badge?: number;
    sound?: string;
  }) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          data: content.data,
          categoryIdentifier: content.categoryIdentifier,
          badge: content.badge,
          sound: content.sound || 'default',
        },
        trigger: null, // 즉시 표시
      });

      return notificationId;
    } catch (error) {
      console.error('로컬 알림 예약 오류:', error);
      return null;
    }
  }

  // 알림 권한 상태 확인
  async getNotificationStatus() {
    const settings = await Notifications.getPermissionsAsync();
    return {
      granted: settings.granted,
      ios: settings.ios,
      android: settings.android,
    };
  }

  // 배지 카운트 설정
  async setBadgeCount(count: number) {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(count);
    }
  }

  // 배지 카운트 초기화
  async clearBadgeCount() {
    await this.setBadgeCount(0);
  }

  // 토픽 구독
  async subscribeToTopic(topic: string) {
    if (messaging) {
      await messaging().subscribeToTopic(topic);
      console.log(`토픽 구독: ${topic}`);
    }
  }

  // 토픽 구독 해제
  async unsubscribeFromTopic(topic: string) {
    if (messaging) {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`토픽 구독 해제: ${topic}`);
    }
  }

  // 앱 상태 변경 처리
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // 앱이 포그라운드로 돌아왔을 때
      this.clearBadgeCount();
      this.checkPendingNotifications();
    }
  };

  // 대기 중인 알림 확인 (threads-clone 스타일 deep link 지원 추가)
  private async checkPendingNotifications() {
    try {
      // 대기 중인 알림 액션 확인
      const pendingAction = await AsyncStorage.getItem('pendingNotificationAction');
      if (pendingAction) {
        const action = JSON.parse(pendingAction);
        // 5분 이내의 알림만 처리
        if (Date.now() - action.timestamp < 5 * 60 * 1000) {
          this.handleNotificationAction(action.data, action.actionId);
        }
        await AsyncStorage.removeItem('pendingNotificationAction');
      }

      // threads-clone 스타일: 대기 중인 deep link 확인
      const pendingDeepLink = await AsyncStorage.getItem('pendingDeepLink');
      if (pendingDeepLink) {
        console.log('Processing pending deep link:', pendingDeepLink);
        // 여기서 실제 네비게이션 로직을 구현하거나 이벤트를 발생시킬 수 있습니다
        // 예: 라우터나 네비게이션 서비스로 전달
        await AsyncStorage.removeItem('pendingDeepLink');
      }
    } catch (error) {
      console.error('대기 중인 알림 확인 오류:', error);
    }
  }

  // 특정 유형의 알림 전송 헬퍼 메서드들
  async sendTransactionNotification(userId: string, amount: number, description: string) {
    await this.scheduleLocalNotification({
      title: '새로운 거래',
      body: `${description}: ${amount.toLocaleString()}원`,
      data: { type: 'transaction', userId },
      categoryIdentifier: 'transaction',
    });
  }

  async sendBudgetAlert(userId: string, currentExpense: number, budgetLimit: number) {
    const percentage = Math.round((currentExpense / budgetLimit) * 100);
    await this.scheduleLocalNotification({
      title: '예산 초과 경고',
      body: `이번 달 예산의 ${percentage}%를 사용했습니다.`,
      data: { type: 'budget', userId, currentExpense, budgetLimit },
      categoryIdentifier: 'budget',
    });
  }

  async sendBookShareRequest(bookId: string, bookName: string, senderName: string) {
    await this.scheduleLocalNotification({
      title: '가계부 공유 요청',
      body: `${senderName}님이 '${bookName}' 가계부를 공유하려고 합니다.`,
      data: { type: 'book_share', bookId },
      categoryIdentifier: 'book_share',
    });
  }

  // Deep link 네비게이션 처리 (threads-clone 스타일)
  private handleDeepLinkNavigation(url: string) {
    try {
      console.log('Deep link navigation:', url);
      // AsyncStorage에 저장하여 앱이 완전히 로드된 후 처리
      AsyncStorage.setItem('pendingDeepLink', url);
      
      // expo-linking을 사용하여 즉시 처리 시도
      const { Linking } = require('expo-linking');
      Linking.openURL(url).catch((err: any) => {
        console.error('Deep link open error:', err);
      });
    } catch (error) {
      console.error('Deep link navigation error:', error);
    }
  }

  // Expo Push 알림 전송 (threads-clone 스타일)
  async sendExpoPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Push notification failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Expo push notification sent:', result);
      return result;
    } catch (error) {
      console.error('Expo push notification error:', error);
      throw error;
    }
  }

  // 리스너 등록 및 반환 (threads-clone 스타일)
  registerNotificationListeners() {
    this.setupNotificationListeners();
    return this.notificationListeners;
  }

  // 리스너 제거 (threads-clone 스타일)
  removeNotificationListeners(listeners: any[]) {
    listeners.forEach(listener => {
      if (listener && typeof listener.remove === 'function') {
        listener.remove();
      }
    });
  }

  // 서비스 정리
  cleanup() {
    // 리스너 제거
    this.notificationListeners.forEach(listener => listener.remove());
    this.notificationListeners = [];

    // 앱 상태 리스너 제거
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }

  // 알림 데이터 처리 (외부에서 호출 가능)
  handleNotificationData(data: any) {
    this.processNotificationData(data);
  }
}

// 싱글톤 인스턴스
export const notificationService = new NotificationService();

// 기본 내보내기
export default notificationService;