import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// 백엔드 서버 OAuth 설정
const BACKEND_BASE_URL = 'http://localhost:8080';

interface OAuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

class OAuthService {
  // Google OAuth 로그인 (백엔드 서버를 통해)
  async googleLogin(): Promise<OAuthResult> {
    try {
      const oauthUrl = `${BACKEND_BASE_URL}/oauth2/authorization/google`;
      
      // 웹 브라우저로 OAuth 엔드포인트 열기
      const result = await WebBrowser.openAuthSessionAsync(
        oauthUrl,
        'garabuapp2://oauth-callback'
      );

      if (result.type === 'success') {
        // 성공적으로 리다이렉트된 경우
        // URL에서 토큰 정보를 파싱하거나, 서버에서 토큰을 받아옴
        const url = result.url;
        
        // URL에서 토큰 파싱 (예: garabuapp2://oauth-callback?access_token=xxx&refresh_token=yyy)
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        if (accessToken) {
          return {
            success: true,
            accessToken,
            refreshToken: refreshToken || undefined,
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
          error: 'Google 로그인이 취소되었습니다.',
        };
      }
    } catch (error) {
      console.error('Google OAuth 오류:', error);
      return {
        success: false,
        error: 'Google 로그인 중 오류가 발생했습니다.',
      };
    }
  }

  // Naver OAuth 로그인 (백엔드 서버를 통해)
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
        
        // URL에서 토큰 파싱
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        if (accessToken) {
          return {
            success: true,
            accessToken,
            refreshToken: refreshToken || undefined,
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

  // OAuth 설정 초기화
  initializeOAuth() {
    if (Platform.OS === 'web') {
      WebBrowser.maybeCompleteAuthSession();
    }
  }
}

export const oauthService = new OAuthService();

// 개발용 Mock OAuth 서비스
export class MockOAuthService {
  async googleLogin(): Promise<OAuthResult> {
    console.log('Mock Google OAuth 시작');
    
    // Mock 지연
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Mock Google OAuth 완료');
    
    return {
      success: true,
      accessToken: `mock-google-access-token-${Date.now()}`,
      refreshToken: `mock-google-refresh-token-${Date.now()}`,
    };
  }

  async naverLogin(): Promise<OAuthResult> {
    console.log('Mock Naver OAuth 시작');
    
    // Mock 지연
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Mock Naver OAuth 완료');
    
    return {
      success: true,
      accessToken: `mock-naver-access-token-${Date.now()}`,
      refreshToken: `mock-naver-refresh-token-${Date.now()}`,
    };
  }

  initializeOAuth() {
    console.log('Mock OAuth 초기화');
  }
}

// 개발 환경에서는 Mock 서비스 사용
// 현재는 강제로 Mock 서비스 사용
console.log('OAuth 서비스: Mock 서비스 사용');

export const oauth = new MockOAuthService(); 