import config from '@/config/config';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import googleService from '@/features/auth/services/googleService';

// 백엔드 서버 OAuth 설정
const BACKEND_BASE_URL = config.API_BASE_URL;

interface OAuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  provider?: 'google' | 'apple' | 'naver' | 'kakao';
  userInfo?: {
    id: string;
    email?: string;
    name?: string;
    profileImage?: string;
  };
}

class OAuthService {
  constructor() {
    // Google Sign-In 초기화는 googleService에서 처리
  }

  // Apple OAuth 로그인 (iOS 전용)
  async appleLogin(): Promise<OAuthResult> {
    try {
      if (Platform.OS !== 'ios') {
        return {
          success: false,
          error: 'Apple 로그인은 iOS에서만 지원됩니다.',
        };
      }

      // Apple ID 사용 가능 여부 확인
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Apple ID 로그인을 사용할 수 없습니다.',
        };
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken, email, fullName } = credential;

      if (identityToken) {
        return {
          success: true,
          accessToken: identityToken,
          provider: 'apple',
          userInfo: {
            id: credential.user,
            email: email || undefined,
            name: fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : undefined,
          },
        };
      } else {
        return {
          success: false,
          error: 'Apple ID 토큰을 받지 못했습니다.',
        };
      }
    } catch (error: any) {
      console.error('Apple OAuth 오류:', error);
      if (error.code === 'ERR_CANCELED') {
        return {
          success: false,
          error: 'Apple 로그인이 취소되었습니다.',
        };
      }
      return {
        success: false,
        error: 'Apple 로그인 중 오류가 발생했습니다.',
      };
    }
  }

  // Google OAuth 로그인 (네이티브)
  async googleLogin(): Promise<OAuthResult> {
    try {
      // Expo Go 환경 체크 (더 정확한 감지)
      const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
      console.log('Environment check:', {
        appOwnership: Constants.appOwnership,
        executionEnvironment: Constants.executionEnvironment,
        isExpoGo: isExpoGo
      });
      
      if (isExpoGo) {
        return {
          success: false,
          error: 'Expo Go에서는 Google 로그인을 사용할 수 없습니다. 개발 빌드를 사용해주세요.',
        };
      }
      
      // googleService를 통해 로그인
      const result = await googleService.loginWithOneTap();
      
      if (!result.idToken) {
        return {
          success: false,
          error: 'Google ID 토큰을 받지 못했습니다.',
        };
      }

      return {
        success: true,
        accessToken: result.idToken,
        refreshToken: result.serverAuthCode || undefined,
        provider: 'google',
        userInfo: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name || undefined,
          profileImage: result.user.photo || undefined,
        },
      };
    } catch (error: any) {
      console.error('Google OAuth 오류:', error);
      
      return {
        success: false,
        error: error.message || 'Google 로그인 중 오류가 발생했습니다.',
      };
    }
  }

  // Naver OAuth 로그인 (웹뷰를 통해)
  async naverLogin(): Promise<OAuthResult> {
    try {
      const oauthUrl = `${BACKEND_BASE_URL}/oauth2/authorization/naver`;
      
      // 웹 브라우저로 OAuth 엔드포인트 열기
      const result = await WebBrowser.openAuthSessionAsync(
        oauthUrl,
        'garabuapp2://oauth-callback'
      );

      if (result.type === 'success') {
        // 성공적으로 리다이렉트된 경우
        const url = result.url;
        
        // URL에서 토큰 파싱 (fragment 또는 query 파라미터 확인)
        const urlParts = url.split('#')[1] || url.split('?')[1];
        const urlParams = new URLSearchParams(urlParts);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        if (accessToken) {
          return {
            success: true,
            accessToken,
            refreshToken: refreshToken || undefined,
            provider: 'naver',
          };
        } else {
          return {
            success: false,
            error: '토큰을 받지 못했습니다.',
          };
        }
      } else {
        return {
          success: false,
          error: 'Naver 로그인이 취소되었습니다.',
        };
      }
    } catch (error) {
      console.error('Naver OAuth 오류:', error);
      return {
        success: false,
        error: 'Naver 로그인 중 오류가 발생했습니다.',
      };
    }
  }

  // Kakao OAuth 로그인 (웹뷰를 통해)
  async kakaoLogin(): Promise<OAuthResult> {
    try {
      const oauthUrl = `${BACKEND_BASE_URL}/oauth2/authorization/kakao`;
      
      // 웹 브라우저로 OAuth 엔드포인트 열기
      const result = await WebBrowser.openAuthSessionAsync(
        oauthUrl,
        'garabuapp2://oauth-callback'
      );

      if (result.type === 'success') {
        // 성공적으로 리다이렉트된 경우
        const url = result.url;
        
        // URL에서 토큰 파싱 (fragment 또는 query 파라미터 확인)
        const urlParts = url.split('#')[1] || url.split('?')[1];
        const urlParams = new URLSearchParams(urlParts);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        if (accessToken) {
          return {
            success: true,
            accessToken,
            refreshToken: refreshToken || undefined,
            provider: 'kakao',
          };
        } else {
          return {
            success: false,
            error: '토큰을 받지 못했습니다.',
          };
        }
      } else {
        return {
          success: false,
          error: 'Kakao 로그인이 취소되었습니다.',
        };
      }
    } catch (error) {
      console.error('Kakao OAuth 오류:', error);
      return {
        success: false,
        error: 'Kakao 로그인 중 오류가 발생했습니다.',
      };
    }
  }

  // 현재 로그인된 Google 계정 로그아웃
  async googleSignOut(): Promise<void> {
    try {
      await googleService.logout();
    } catch (error) {
      console.error('Google 로그아웃 실패:', error);
    }
  }

  // 현재 로그인된 Google 계정 정보 가져오기
  async getCurrentGoogleUser() {
    try {
      // googleService에는 signInSilently가 없으므로 null 반환
      return null;
    } catch (error) {
      console.error('현재 Google 사용자 정보 가져오기 실패:', error);
      return null;
    }
  }

  // OAuth 설정 초기화
  initializeOAuth() {
    if (Platform.OS === 'web') {
      WebBrowser.maybeCompleteAuthSession();
    }
  }

  // 플랫폼별 지원 OAuth 제공자 확인
  getSupportedProviders(): string[] {
    const providers = ['google', 'naver', 'kakao'];
    
    if (Platform.OS === 'ios') {
      providers.unshift('apple'); // iOS에서는 Apple 로그인을 맨 앞에
    }
    
    return providers;
  }

  // 통합 OAuth 로그인 메서드
  async login(provider: 'google' | 'apple' | 'naver' | 'kakao'): Promise<OAuthResult> {
    switch (provider) {
      case 'google':
        return this.googleLogin();
      case 'apple':
        return this.appleLogin();
      case 'naver':
        return this.naverLogin();
      case 'kakao':
        return this.kakaoLogin();
      default:
        return {
          success: false,
          error: '지원하지 않는 OAuth 제공자입니다.',
        };
    }
  }
}

// OAuth 서비스 인스턴스 생성 - 실제 서비스만 사용
const oauthService = new OAuthService();

export const oauth = oauthService; 