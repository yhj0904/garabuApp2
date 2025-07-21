import { Platform } from 'react-native';
import oauthKeyService from '@/services/oauthKeyService';

// 조건부 import - Expo Go에서는 사용 불가능한 모듈
let GoogleSignin: any = null;
let statusCodes: any = null;
let GoogleOneTapSignIn: any = null;

try {
  const googleSignInModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSignInModule.GoogleSignin;
  statusCodes = googleSignInModule.statusCodes;
  GoogleOneTapSignIn = googleSignInModule.GoogleOneTapSignIn;
  console.log('Google Sign-In module loaded successfully');
} catch (error) {
  console.log('Google Sign-In module not available:', error);
}

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
    if (!GoogleSignin || !GoogleOneTapSignIn) {
      console.log('Google Sign-In module not available. Use development build for Google login.');
      return;
    }

    try {
      const webClientId = oauthKeyService.getGoogleWebClientId(); // Web Client ID for both platforms
      
      // Traditional Google Sign-In configuration
      GoogleSignin.configure({
        webClientId: 'autoDetect',
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });

      // Google One Tap configuration (Android only)
      if (Platform.OS === 'android') {
        GoogleOneTapSignIn.configure({
          webClientId: 'autoDetect', // Use the same web client ID
          autoSignIn: true, // Automatically prompt user
        });
      }
      
      this.isConfigured = true;
      console.log('Google Sign-In configured successfully with webClientId:', webClientId);
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
   * Google One Tap 로그인 수행 (Android only)
   */
  async loginWithOneTap(): Promise<GoogleLoginResponse> {
    // Google Sign-In 모듈 확인
    if (!GoogleSignin) {
      throw new Error('Google 로그인을 사용하려면 개발 빌드가 필요합니다. Expo Go에서는 Google 로그인이 지원되지 않습니다.');
    }
    
    // 설정 확인
    await this.ensureConfigured();
    
    // iOS에서는 바로 traditional login 사용
    if (Platform.OS === 'ios') {
      return this.login();
    }

    if (!GoogleOneTapSignIn) {
      console.warn('Google One Tap Sign-In not available, falling back to traditional sign-in');
      return this.login();
    }

    try {
      // Play Services 확인
      const hasPlayServices = await GoogleSignin.hasPlayServices();
      if (!hasPlayServices) {
        throw new Error('Play Services not available');
      }

      // One Tap Sign-In 시도
      const response = await GoogleOneTapSignIn.signIn();
      
      if (response.type === 'success') {
        const userInfo = response.data;
        console.log('Google One Tap sign-in success:', userInfo);
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
      } else if (response.type === 'noSavedCredentialFound') {
        // 저장된 계정이 없으면 계정 생성 흐름으로
        const createResponse = await GoogleOneTapSignIn.createAccount();
        if (createResponse.type === 'success') {
          const userInfo = createResponse.data;
          console.log('Google One Tap account creation success:', userInfo);
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
      }
      
      // One Tap이 실패하면 traditional login으로 fallback
      console.log('One Tap failed, falling back to traditional login');
      return this.login();
    } catch (error) {
      console.error('Google One Tap login error:', error);
      // Fallback to traditional login
      return this.login();
    }
  }

  /**
   * Traditional Google 로그인 수행
   */
  async login(): Promise<GoogleLoginResponse> {
    // Google Sign-In 모듈 확인
    if (!GoogleSignin) {
      console.error('GoogleSignin module is null. Module loaded:', {
        GoogleSignin: !!GoogleSignin,
        statusCodes: !!statusCodes,
        GoogleOneTapSignIn: !!GoogleOneTapSignIn
      });
      throw new Error('Google 로그인을 사용하려면 개발 빌드가 필요합니다. Expo Go에서는 Google 로그인이 지원되지 않습니다.');
    }
    
    // 설정 확인
    await this.ensureConfigured();

    try {
      // Configure가 제대로 되었는지 다시 확인
      const isSignedIn = await GoogleSignin.isSignedIn();
      console.log('Is already signed in:', isSignedIn);
      
      // Play Services 확인
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Sign In
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.data.idToken) {
        throw new Error('No ID token received from Google');
      }
      
      console.log('Google traditional login success:', userInfo);
      return {
        idToken: userInfo.data.idToken,
        serverAuthCode: userInfo.data.serverAuthCode || null,
        user: {
          email: userInfo.data.user.email,
          id: userInfo.data.user.id,
          givenName: userInfo.data.user.givenName || null,
          familyName: userInfo.data.user.familyName || null,
          photo: userInfo.data.user.photo || null,
          name: userInfo.data.user.name || null,
        }
      };
    } catch (error: any) {
      if (error.code === statusCodes?.SIGN_IN_CANCELLED) {
        throw new Error('User cancelled the login flow');
      } else if (error.code === statusCodes?.IN_PROGRESS) {
        throw new Error('Sign in is in progress already');
      } else if (error.code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Play services not available or outdated');
      } else {
        console.error('Google login failed:', error);
        throw error;
      }
    }
  }

  /**
   * Google 로그아웃
   */
  async logout(): Promise<void> {
    if (!GoogleSignin) {
      throw new Error('Google Sign-In not available. Please use a development build.');
    }

    try {
      await GoogleSignin.signOut();
      console.log('Google logout success');
    } catch (error) {
      console.error('Google logout failed:', error);
      throw error;
    }
  }

  /**
   * 현재 로그인 상태 확인
   */
  async isSignedIn(): Promise<boolean> {
    if (!GoogleSignin) {
      return false;
    }

    try {
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      console.error('Failed to check Google sign in status:', error);
      return false;
    }
  }

  /**
   * Google OAuth 토큰으로 백엔드 로그인
   */
  async loginWithBackend(idToken: string): Promise<any> {
    console.log('=== Backend Google Login Process Started ===');
    
    try {
      const config = require('../config/config').default;
      const url = `${config.API_BASE_URL}/api/${config.API_VERSION}/mobile-oauth/login`;
      console.log('Backend API URL:', url);
      console.log('Sending Google ID token to backend...');
      
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
      console.error('Backend Google login failed:', {
        message: error.message,
        url: error.config?.url,
        status: error.response?.status
      });
      throw error;
    }
  }
}

export default new GoogleService();