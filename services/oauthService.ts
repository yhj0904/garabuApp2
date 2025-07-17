import config from '@/config/config';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

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
    this.initializeGoogleSignIn();
  }

  // Google Sign-In 초기화
  private async initializeGoogleSignIn() {
    try {
      await GoogleSignin.configure({
        webClientId: config.GOOGLE_WEB_CLIENT_ID, // 백엔드 서버용 클라이언트 ID
        iosClientId: config.GOOGLE_IOS_CLIENT_ID, // iOS용 클라이언트 ID
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
      });
    } catch (error) {
      console.error('Google Sign-In 초기화 실패:', error);
    }
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
      // 기존 로그인 체크
      await GoogleSignin.hasPlayServices();
      
      // 로그인 시도
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      // 토큰 유효성 확인
      if (!tokens.accessToken) {
        return {
          success: false,
          error: 'Google 액세스 토큰을 받지 못했습니다.',
        };
      }

      return {
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        provider: 'google',
        userInfo: {
          id: userInfo.user.id,
          email: userInfo.user.email,
          name: userInfo.user.name || undefined,
          profileImage: userInfo.user.photo || undefined,
        },
      };
    } catch (error: any) {
      console.error('Google OAuth 오류:', error);
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        return {
          success: false,
          error: 'Google 로그인이 취소되었습니다.',
        };
      } else if (error.code === 'IN_PROGRESS') {
        return {
          success: false,
          error: '로그인이 진행 중입니다.',
        };
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        return {
          success: false,
          error: 'Google Play Services를 사용할 수 없습니다.',
        };
      }
      
      return {
        success: false,
        error: 'Google 로그인 중 오류가 발생했습니다.',
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
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google 로그아웃 실패:', error);
    }
  }

  // 현재 로그인된 Google 계정 정보 가져오기
  async getCurrentGoogleUser() {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      return userInfo;
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