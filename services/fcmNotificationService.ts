import messaging from '@react-native-firebase/messaging';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './api';
import Constants from 'expo-constants';

// FCM 토큰 관련 인터페이스
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

class FCMNotificationService {
  private pushToken: string | null = null;
  private appStateSubscription: any = null;
  private unsubscribeOnMessage: any = null;
  private unsubscribeOnTokenRefresh: any = null;
  private lastNotificationId: string | null = null;
  private isRegistering: boolean = false; // 토큰 등록 중복 방지 플래그

  constructor() {
    // 즉시 초기화하지 않고 명시적으로 호출하도록 변경
  }

  // 서비스 초기화
  async initialize() {
    try {
      // 앱 상태 변경 리스너
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
      
      // FCM 초기화
      await this.setupFCM();
      
      console.log('FCMNotificationService initialized');
    } catch (error) {
      console.error('FCMNotificationService initialization error:', error);
    }
  }

  // FCM 설정
  private async setupFCM() {
    // 권한 확인
    const authStatus = await messaging().hasPermission();
    const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
                   authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('FCM authorization status:', authStatus);
    }

    // 메시지 리스너 설정
    this.unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      console.log('FCM 메시지 수신:', remoteMessage);
      
      // 포그라운드에서 알림 수신 시 처리
      if (remoteMessage.notification) {
        // 로컬 알림으로 표시하거나 인앱 알림으로 처리
        this.handleForegroundNotification(remoteMessage);
      }
    });

    // 토큰 새로고침 리스너
    this.unsubscribeOnTokenRefresh = messaging().onTokenRefresh(token => {
      console.log('FCM 토큰 새로고침:', token);
      this.pushToken = token;
      const deviceId = Device.deviceName || Device.modelId || 'unknown';
      this.registerTokenWithServer(deviceId, token);
    });

    // 백그라운드 메시지 핸들러 설정
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('백그라운드 FCM 메시지:', remoteMessage);
    });
  }

  // 알림 권한 요청
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('푸시 알림은 실제 기기에서만 작동합니다');
      return false;
    }

    try {
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('FCM 권한 승인됨');
        return true;
      } else {
        console.log('FCM 권한 거부됨');
        return false;
      }
    } catch (error) {
      console.error('FCM 권한 요청 오류:', error);
      return false;
    }
  }

  // FCM 토큰 등록
  async registerForPushNotifications(): Promise<string | null> {
    try {
      console.log('📱 FCM 토큰 등록 시작...');
      
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('❌ 알림 권한이 없습니다');
        return null;
      }

      // FCM 토큰 생성
      const fcmToken = await this.generateFCMToken();
      if (fcmToken) {
        console.log('✅ FCM 토큰 생성됨:', fcmToken);
        this.pushToken = fcmToken;
        const deviceId = Device.deviceName || Device.modelId || 'unknown';
        await this.registerTokenWithServer(deviceId, fcmToken);
        return fcmToken;
      }

      console.log('❌ FCM 토큰 생성 실패');
      return null;
    } catch (error) {
      console.error('❌ 푸시 알림 등록 오류:', error);
      return null;
    }
  }

  // FCM 토큰 생성
  private async generateFCMToken(): Promise<string | null> {
    try {
      // iOS에서는 먼저 registerDeviceForRemoteMessages 호출 필요
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
      }
      
      const fcmToken = await messaging().getToken();
      console.log('FCM 토큰 생성 성공:', fcmToken);
      return fcmToken;
    } catch (error) {
      console.error('FCM 토큰 생성 오류:', error);
      return null;
    }
  }

  // 서버에 토큰 등록
  async registerTokenWithServer(userId: string, token: string) {
    try {
      // 이미 등록 중인지 확인
      if (this.isRegistering) {
        console.log('FCM 토큰 등록 중... 기다려주세요.');
        return;
      }
      
      this.isRegistering = true;
      
      const deviceId = Device.deviceName || Device.modelId || 'unknown';
      const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
      
      const request: FCMTokenRequest = {
        token,
        deviceId,
        deviceType,
        appVersion: Constants.expoConfig?.version || '1.0.0',
        osVersion: Platform.Version.toString(),
      };

      console.log('FCM 토큰 서버 등록 요청:', JSON.stringify(request, null, 2));
      await apiService.registerFCMToken(request);
      await AsyncStorage.setItem('fcmToken', token);
      console.log('✅ FCM 토큰 서버 등록 성공');
    } catch (error: any) {
      console.error('❌ 토큰 서버 등록 실패:', error);
      console.error('에러 상세:', error.response?.data || error.message);
      // 실패 시 저장된 토큰 삭제
      await AsyncStorage.removeItem('fcmToken');
      throw error; // 에러를 다시 던져서 호출자가 처리할 수 있도록 함
    } finally {
      this.isRegistering = false;
    }
  }

  // 토큰 업데이트
  async updateFCMToken(token: string) {
    this.pushToken = token;
    const deviceId = Device.deviceName || Device.modelId || 'unknown';
    await this.registerTokenWithServer(deviceId, token);
  }

  // 포그라운드 알림 처리
  private handleForegroundNotification(remoteMessage: any) {
    // 중복 알림 방지
    if (remoteMessage.messageId === this.lastNotificationId) {
      return;
    }
    this.lastNotificationId = remoteMessage.messageId;

    console.log('포그라운드 알림 수신:', {
      notification: remoteMessage.notification,
      data: remoteMessage.data,
      messageId: remoteMessage.messageId
    });

    const { data } = remoteMessage;
    if (data) {
      this.processNotificationData(data as NotificationData);
    }
  }

  // 알림 데이터 처리
  private processNotificationData(data: NotificationData) {
    console.log('알림 데이터 처리:', data);
    
    // action 필드로 타입 판단 (서버에서 보내는 형식에 맞춤)
    if (data.action) {
      const [type, ...params] = data.action.split(':');
      
      switch (type) {
        case 'transaction':
          const [bookId, ledgerId] = params;
          console.log('새로운 거래 알림:', { bookId, ledgerId });
          data.type = 'transaction';
          data.bookId = bookId;
          data.ledgerId = ledgerId;
          break;
        case 'open_book_detail':
          console.log('가계부 상세 열기');
          data.type = 'book_share';
          break;
        default:
          console.log('알 수 없는 액션:', data.action);
      }
    }
    
    // 기존 type 필드 처리 (하위 호환성)
    switch (data.type) {
      case 'transaction':
        console.log('새로운 거래:', data.ledgerId);
        break;
      case 'budget':
        console.log('예산 알림:', data.bookId);
        break;
      case 'book_share':
        console.log('가계부 공유 요청:', data.bookId);
        break;
      case 'friend_request':
        console.log('친구 요청:', data.friendshipId);
        break;
      case 'message':
        console.log('새 메시지:', data.messageId);
        break;
    }
  }

  // 초기 알림 확인 (앱 시작 시)
  async checkInitialNotification() {
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      console.log('앱이 알림으로 시작됨:', initialNotification);
      this.handleNotificationOpen(initialNotification);
    }
  }

  // 알림 오픈 처리
  private handleNotificationOpen(remoteMessage: any) {
    const { data } = remoteMessage;
    if (data) {
      // 라우팅 처리는 App.tsx에서 navigation 준비 후 수행
      AsyncStorage.setItem('pendingNotificationAction', JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    }
  }

  // 토픽 구독
  async subscribeToTopic(topic: string) {
    await messaging().subscribeToTopic(topic);
    console.log(`토픽 구독: ${topic}`);
  }

  // 토픽 구독 해제
  async unsubscribeFromTopic(topic: string) {
    await messaging().unsubscribeFromTopic(topic);
    console.log(`토픽 구독 해제: ${topic}`);
  }

  // 앱 상태 변경 처리
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // 앱이 포그라운드로 돌아왔을 때
      this.checkPendingNotifications();
    }
  };

  // 대기 중인 알림 확인
  private async checkPendingNotifications() {
    try {
      const pendingAction = await AsyncStorage.getItem('pendingNotificationAction');
      if (pendingAction) {
        const action = JSON.parse(pendingAction);
        // 5분 이내의 알림만 처리
        if (Date.now() - action.timestamp < 5 * 60 * 1000) {
          // 여기서 실제 네비게이션 처리
          this.processNotificationData(action.data);
        }
        await AsyncStorage.removeItem('pendingNotificationAction');
      }
    } catch (error) {
      console.error('대기 중인 알림 확인 오류:', error);
    }
  }

  // 알림 권한 상태 확인
  async getNotificationStatus() {
    const authStatus = await messaging().hasPermission();
    return {
      granted: authStatus === messaging.AuthorizationStatus.AUTHORIZED,
      provisional: authStatus === messaging.AuthorizationStatus.PROVISIONAL,
    };
  }

  // 서비스 정리
  cleanup() {
    // 리스너 제거
    if (this.unsubscribeOnMessage) {
      this.unsubscribeOnMessage();
    }
    if (this.unsubscribeOnTokenRefresh) {
      this.unsubscribeOnTokenRefresh();
    }

    // 앱 상태 리스너 제거
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }

  // 알림 데이터 처리 (외부에서 호출 가능)
  handleNotificationData(data: any) {
    this.processNotificationData(data);
  }

  // Legacy support methods
  registerNotificationListeners() {
    // FCM은 자동으로 리스너를 설정하므로 빈 배열 반환
    return [];
  }
}

// 싱글톤 인스턴스
export const fcmNotificationService = new FCMNotificationService();

// notification 에일리어스 (legacy support)
export const notification = fcmNotificationService;

// 기본 내보내기
export default fcmNotificationService;