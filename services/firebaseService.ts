// 순환 참조 방지를 위해 직접 import 제거
import { Platform } from 'react-native';

// 조건부 import - Expo Go에서는 사용 불가능한 모듈
let messaging: any = null;
let analytics: any = null;
let getAnalytics: any = null;
let logEvent: any = null;
let setUserId: any = null;
let setUserProperties: any = null;
let logScreenView: any = null;
let crashlytics: any = null;
let recordError: any = null;
let log: any = null;
let setAttribute: any = null;
let setAttributes: any = null;

try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (error) {
  console.log('Firebase Messaging not available in Expo Go');
}

try {
  // v22+ modular SDK 방식
  const analyticsModule = require('@react-native-firebase/analytics');
  analytics = analyticsModule.default;
  getAnalytics = analyticsModule.getAnalytics;
  logEvent = analyticsModule.logEvent;
  setUserId = analyticsModule.setUserId;
  setUserProperties = analyticsModule.setUserProperties;
  logScreenView = analyticsModule.logScreenView;
} catch (error) {
  console.log('Firebase Analytics not available in Expo Go');
}

try {
  // Crashlytics v22+ modular SDK 방식
  const crashlyticsModule = require('@react-native-firebase/crashlytics');
  crashlytics = crashlyticsModule.default;
  recordError = crashlyticsModule.recordError;
  log = crashlyticsModule.log;
  setAttribute = crashlyticsModule.setAttribute;
  setAttributes = crashlyticsModule.setAttributes;
} catch (error) {
  console.log('Firebase Crashlytics not available in Expo Go');
}

/**
 * Firebase 서비스 초기화 및 관리
 */
class FirebaseService {
  private currentToken: string | null = null;
  private isInitializing: boolean = false;
  private isRegistering: boolean = false;

  /**
   * Firebase 초기화
   */
  async initialize(): Promise<boolean> {
    if (this.isInitializing) {
      console.log('Firebase 초기화 중... 기다려주세요.');
      return false;
    }
    
    this.isInitializing = true;
    
    try {
      if (!messaging) {
        console.log('Firebase Messaging not available');
        return false;
      }

      // 권한 요청
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
      console.error('Firebase 초기화 실패:', error);
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * FCM 권한 요청
   */
  private async requestPermissions() {
    if (!messaging) return;
    
    try {
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === 1 || authStatus === 2; // AUTHORIZED = 1, PROVISIONAL = 2
      if (enabled) {
        console.log('FCM 권한 획득 성공');
      } else {
        console.log('FCM 권한 거부됨');
      }
    } catch (error) {
      console.error('FCM 권한 요청 실패:', error);
    }
  }

  /**
   * FCM 토큰 가져오기
   */
  async getFCMToken(): Promise<string | null> {
    if (!messaging) {
      console.log('Firebase Messaging not available');
      return null;
    }
    
    try {
      // iOS에서는 먼저 registerDeviceForRemoteMessages 호출 필요
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
      }
      
      const token = await messaging().getToken();
      console.log('FCM 토큰 생성 성공');
      return token;
    } catch (error) {
      console.error('FCM 토큰 가져오기 실패:', error);
      return null;
    }
  }

  // getCurrentToken alias for compatibility
  async getCurrentToken(): Promise<string | null> {
    if (this.isRegistering) {
      console.log('FCM 토큰 등록 중... 기다려주세요.');
      return this.currentToken;
    }
    
    if (this.currentToken) {
      return this.currentToken;
    }
    
    this.isRegistering = true;
    
    try {
      const token = await this.getFCMToken();
      if (token) {
        this.currentToken = token;
        console.log('FCM 토큰 생성 성공:', token);
      }
      return token;
    } catch (error) {
      console.error('FCM 토큰 생성 오류:', error);
      return null;
    } finally {
      this.isRegistering = false;
    }
  }


  /**
   * 특정 토픽 구독
   */
  async subscribeToTopic(topic: string) {
    if (!messaging) return;
    
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`토픽 구독 성공: ${topic}`);
    } catch (error) {
      console.error(`토픽 구독 실패: ${topic}`, error);
    }
  }

  /**
   * 특정 토픽 구독 해제
   */
  async unsubscribeFromTopic(topic: string) {
    if (!messaging) return;
    
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`토픽 구독 해제 성공: ${topic}`);
    } catch (error) {
      console.error(`토픽 구독 해제 실패: ${topic}`, error);
    }
  }

  /**
   * 서비스 정리
   */
  cleanup() {
    // 필요한 정리 작업
  }

  /**
   * Crashlytics: 에러 기록
   */
  async recordCrash(error: Error) {
    if (!recordError) {
      console.log('Firebase Crashlytics not available');
      return;
    }

    try {
      const crashlyticsInstance = crashlytics();
      await recordError(crashlyticsInstance, error);
      console.log('Error recorded to Crashlytics:', error.message);
    } catch (err) {
      console.error('Failed to record error to Crashlytics:', err);
    }
  }

  /**
   * Crashlytics: 로그 메시지 추가
   */
  async addCrashlyticsLog(message: string) {
    if (!log) {
      console.log('Firebase Crashlytics not available');
      return;
    }

    try {
      const crashlyticsInstance = crashlytics();
      log(crashlyticsInstance, message);
    } catch (error) {
      console.error('Failed to add Crashlytics log:', error);
    }
  }

  /**
   * Crashlytics: 커스텀 속성 설정
   */
  async setCrashlyticsAttribute(key: string, value: string | number | boolean) {
    if (!setAttribute) {
      console.log('Firebase Crashlytics not available');
      return;
    }

    try {
      const crashlyticsInstance = crashlytics();
      setAttribute(crashlyticsInstance, key, value.toString());
    } catch (error) {
      console.error('Failed to set Crashlytics attribute:', error);
    }
  }

  /**
   * Crashlytics: 여러 속성 한번에 설정
   */
  async setCrashlyticsAttributes(attributes: Record<string, string | number | boolean>) {
    if (!setAttributes) {
      console.log('Firebase Crashlytics not available');
      return;
    }

    try {
      const crashlyticsInstance = crashlytics();
      const stringAttributes: Record<string, string> = {};
      Object.entries(attributes).forEach(([key, value]) => {
        stringAttributes[key] = value.toString();
      });
      setAttributes(crashlyticsInstance, stringAttributes);
    } catch (error) {
      console.error('Failed to set Crashlytics attributes:', error);
    }
  }

  /**
   * Crashlytics: 사용자 ID 설정
   */
  async setCrashlyticsUserId(userId: string) {
    if (!crashlytics) {
      console.log('Firebase Crashlytics not available');
      return;
    }

    try {
      const crashlyticsInstance = crashlytics();
      await crashlyticsInstance.setUserId(userId);
    } catch (error) {
      console.error('Failed to set Crashlytics user ID:', error);
    }
  }

  /**
   * Analytics 이벤트 로깅
   */
  async logEvent(eventName: string, params?: Record<string, any>) {
    if (!analytics || !logEvent) {
      console.log('Firebase Analytics not available');
      return;
    }

    try {
      // v22+ modular SDK 방식
      await logEvent(analytics(), eventName, params);
      console.log(`Analytics event logged: ${eventName}`, params);
    } catch (error) {
      console.error('Failed to log analytics event:', error);
    }
  }

  /**
   * 사용자 속성 설정
   */
  async setUserProperty(name: string, value: string) {
    if (!analytics || !setUserProperties) {
      console.log('Firebase Analytics not available');
      return;
    }

    try {
      await setUserProperties(analytics(), { [name]: value });
      console.log(`User property set: ${name} = ${value}`);
    } catch (error) {
      console.error('Failed to set user property:', error);
    }
  }

  /**
   * 사용자 ID 설정
   */
  async setUserId(userId: string | null) {
    if (!analytics || !setUserId) {
      console.log('Firebase Analytics not available');
      return;
    }

    try {
      await setUserId(analytics(), userId);
      console.log(`User ID set: ${userId}`);
    } catch (error) {
      console.error('Failed to set user ID:', error);
    }
  }

  /**
   * 화면 추적
   */
  async logScreenView(screenName: string, screenClass?: string) {
    if (!analytics || !logEvent) {
      console.log('Firebase Analytics not available');
      return;
    }

    try {
      await logEvent(analytics(), 'screen_view', {
        screen_name: screenName,
        screen_class: screenClass || screenName
      });
      console.log(`Screen view logged: ${screenName}`);
    } catch (error) {
      console.error('Failed to log screen view:', error);
    }
  }
}

export const firebaseService = new FirebaseService();