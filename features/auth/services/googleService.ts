import { Platform } from 'react-native';
import oauthKeyService from '@/services/oauthKeyService';
import { 
  GoogleSignin, 
  statusCodes,
  GoogleOneTapSignIn,
  isSuccessResponse,
  isNoSavedCredentialFoundResponse
} from '@react-native-google-signin/google-signin';

interface GoogleLoginResponse {
  idToken: string | null;
  serverAuthCode: string | null;
  user: {
    email: string;
    id: string;
    givenName: string | null;
    familyName: string | null;
    photo: string | null;
    name: string | null;
  };
}

class GoogleService {
  private isConfigured = false;
  
  /**
   * Google Sign-In 설정
   */
  async configure() {
    try {
      const webClientId = oauthKeyService.getGoogleWebClientId();
      
      // Traditional Google Sign-In configuration
      GoogleSignin.configure({
        webClientId: webClientId,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });

      // Google One Tap configuration (if available)
      if (GoogleOneTapSignIn) {
        GoogleOneTapSignIn.configure({
          webClientId: webClientId,
        });
      }
      
      this.isConfigured = true;
      console.log('Google Sign-In configured successfully');
    } catch (error) {
      console.error('Google Sign-In configuration failed:', error);
      this.isConfigured = false;
    }
  }
  
  /**
   * 설정이 되었는지 확인하고 필요시 설정
   */
  private async ensureConfigured() {
    if (!this.isConfigured) {
      console.log('Google Sign-In not configured yet, configuring now...');
      await this.configure();
    }
  }

  /**
   * Google One Tap 로그인 수행
   * @returns GoogleLoginResponse | null (null은 사용자가 취소한 경우)
   */
  async loginWithOneTap(): Promise<GoogleLoginResponse | null> {
    await this.ensureConfigured();

    // GoogleOneTapSignIn이 없으면 바로 traditional 로그인 사용
    if (!GoogleOneTapSignIn) {
      console.log('One Tap not available, using traditional sign-in');
      return await this.fallbackToTraditionalSignIn();
    }

    try {
      // Play Services 확인 (Android만)
      if (Platform.OS === 'android') {
        await GoogleOneTapSignIn.checkPlayServices();
      }

      // 1. 먼저 자동 로그인 시도
      console.log('Attempting automatic Google sign-in...');
      const signInResponse = await GoogleOneTapSignIn.signIn();
      
      if (isSuccessResponse(signInResponse)) {
        console.log('Automatic sign-in successful');
        return this.processSignInResponse(signInResponse);
      }
      
      // 2. 저장된 계정이 없으면 계정 생성/선택 플로우
      if (isNoSavedCredentialFoundResponse(signInResponse)) {
        console.log('No saved credentials, starting account selection...');
        const createResponse = await GoogleOneTapSignIn.createAccount();
        
        if (isSuccessResponse(createResponse)) {
          console.log('Account selection successful');
          return this.processSignInResponse(createResponse);
        }
      }
      
      // 3. 그래도 실패하면 명시적 로그인 (폴백)
      console.log('Falling back to explicit sign-in...');
      return await this.fallbackToTraditionalSignIn();
      
    } catch (error: any) {
      console.error('Google One Tap login error:', error);
      
      // 사용자가 취소한 경우 - 에러로 처리하지 않고 정상적인 흐름으로 처리
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled Google sign-in');
        return null; // null을 반환하여 취소를 나타냄
      }
      
      // Play Services 문제
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play 서비스를 사용할 수 없습니다.');
      }
      
      // 기타 에러는 traditional login으로 폴백
      console.log('Error occurred, falling back to traditional sign-in');
      return await this.fallbackToTraditionalSignIn();
    }
  }

  /**
   * Traditional Google Sign-In으로 폴백
   * @returns GoogleLoginResponse | null (null은 사용자가 취소한 경우)
   */
  private async fallbackToTraditionalSignIn(): Promise<GoogleLoginResponse | null> {
    try {
      // Play Services 확인 (Android에서만)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const userInfo = await GoogleSignin.signIn();
      
      // Response structure handling - some versions return data in different formats
      const idToken = userInfo.data?.idToken || userInfo.idToken;
      const serverAuthCode = userInfo.data?.serverAuthCode || userInfo.serverAuthCode;
      const user = userInfo.data?.user || userInfo.user;
      
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }
      
      return {
        idToken: idToken,
        serverAuthCode: serverAuthCode || null,
        user: {
          email: user.email,
          id: user.id,
          givenName: user.givenName || null,
          familyName: user.familyName || null,
          photo: user.photo || null,
          name: user.name || null,
        }
      };
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled Google sign-in');
        return null; // 취소 시 null 반환
      }
      throw error;
    }
  }

  /**
   * 로그인 응답 처리
   */
  private processSignInResponse(response: any): GoogleLoginResponse {
    const userInfo = response.data;
    
    return {
      idToken: userInfo.idToken,
      serverAuthCode: userInfo.serverAuthCode || null,
      user: {
        email: userInfo.user.email,
        id: userInfo.user.id,
        givenName: userInfo.user.givenName,
        familyName: userInfo.user.familyName,
        photo: userInfo.user.photo,
        name: userInfo.user.name,
      }
    };
  }

  /**
   * Google 로그아웃
   */
  async logout(): Promise<void> {
    try {
      if (GoogleOneTapSignIn?.signOut) {
        await GoogleOneTapSignIn.signOut();
      } else if (GoogleSignin?.signOut) {
        await GoogleSignin.signOut();
      }
      console.log('Google logout success');
    } catch (error) {
      console.error('Google logout failed:', error);
      // 로그아웃 실패는 무시하고 계속 진행
    }
  }

  /**
   * Google OAuth 토큰으로 백엔드 로그인
   */
  async loginWithBackend(idToken: string): Promise<any> {
    console.log('=== Backend Google Login Process Started ===');
    
    try {
      const config = require('../../../config/config').default;
      const url = `${config.API_BASE_URL}/api/${config.API_VERSION}/mobile-oauth/login`;
      console.log('Backend API URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'google',
          accessToken: idToken,
        }),
      });

      console.log('Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`Backend login failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Backend login success:', {
        hasUser: !!data.user,
        hasAccessToken: !!data.accessToken || !!data.token,
        hasRefreshToken: !!data.refreshToken
      });
      
      // 백엔드가 'token' 필드로 반환하는 경우 처리
      if (!data.accessToken && data.token) {
        data.accessToken = data.token;
      }
      
      return data;
    } catch (error: any) {
      console.error('Backend Google login failed:', error);
      throw error;
    }
  }
}

export default new GoogleService();