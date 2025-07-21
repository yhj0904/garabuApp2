// 순환 참조 방지를 위해 직접 import 제거

// 조건부 import - Expo Go에서는 사용 불가능한 모듈
let messaging: any = null;

try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (error) {
  console.log('Firebase Messaging not available in Expo Go');
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
      console.error('FCM 토큰 생성 실패:', error);
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
}

export const firebaseService = new FirebaseService();