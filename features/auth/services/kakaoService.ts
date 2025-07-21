// 조건부 import - 개발 빌드에서만 사용 가능
import { login, logout, me } from "@react-native-kakao/user";


// try {  
//   const result = await login();
//     console.log(result);
//     const user = await me();
//     console.log(user);
//   console.log('Kakao SDK loaded successfully', { login, logout, me });
// } catch (error) {
//   console.log('Kakao SDK not available. Use development build for Kakao login.12312312312', error);
// }

interface KakaoLoginResponse {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  accessTokenExpiresAt: number; // SDK 는 number (epoch millis) 반환
  refreshTokenExpiresAt?: number;
  scopes?: string[];
}

interface KakaoProfile {
  id: number; // SDK 는 number 반환
  email?: string | null;
  name?: string | null;
  nickname?: string | null;
  profileImageUrl?: string | null;
  thumbnailImageUrl?: string | null;
}

class KakaoService {
  /**
   * Kakao 로그인 수행
   */
  async login(): Promise<KakaoLoginResponse> {
    console.log('=== Kakao Login Process Started ===');
    console.log('Current date:', new Date().toISOString());
    
    if (!login) {
      console.error('Kakao SDK not available');
      throw new Error('Kakao SDK not available. Please use a development build.');
    }

    try {
      console.log('Calling Kakao login()...');
      console.log('SDK Login function:', typeof login);
      
      // 공식 문서: login() 은 Promise<KakaoLoginResponse> 반환
      const result = await login();
      
      console.log('=== Kakao login raw response ===');
      console.log(JSON.stringify(result, null, 2));
      console.log('================================');
      
      console.log('Kakao login response received:', {
        hasAccessToken: !!result.accessToken,
        accessTokenLength: result.accessToken?.length,
        expiresAt: new Date(result.accessTokenExpiresAt).toISOString(),
        scopes: result.scopes
      });
      return result;
    } catch (error: any) {
      console.error('=== Kakao login error detail ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      
      // 카카오 SDK 특별 에러 코드 처리
      if (error.code === 'E_CANCELLED_OPERATION') {
        console.error('User cancelled Kakao login');
      } else if (error.code === 'E_INVALID_PARAMETER') {
        console.error('Invalid Kakao SDK parameters');
      } else if (error.code === 'E_SDK_NOT_INITIALIZED') {
        console.error('Kakao SDK not initialized properly');
      }
      
      console.error('Error object:', JSON.stringify(error, null, 2));
      console.error('================================');
      throw error;
    }
  }

  /**
   * Kakao 로그아웃
   */
  async logout(): Promise<void> {
    if (!logout) {
      throw new Error('Kakao SDK not available. Please use a development build.');
    }

    try {
      // 공식 문서: logout() 은 Promise<void> 반환
      await logout();
      console.log('Kakao logout success');
    } catch (error) {
      console.error('Kakao logout failed:', error);
      throw error;
    }
  }

  /**
   * Kakao 프로필 조회
   */
  async getProfile(): Promise<KakaoProfile> {
    console.log('=== Fetching Kakao Profile ===');
    
    if (!me) {
      console.error('Kakao me() function not available');
      throw new Error('Kakao SDK not available. Please use a development build.');
    }

    try {
      console.log('Calling Kakao me()...');
      // 공식 문서: me() 은 Promise<KakaoProfile> 반환
      const profile = await me();
      console.log('Kakao profile received:', {
        id: profile.id,
        hasEmail: !!profile.email,
        hasName: !!profile.name,
        hasNickname: !!profile.nickname,
        hasProfileImage: !!profile.profileImageUrl
      });
      return profile;
    } catch (error: any) {
      console.error('Failed to get Kakao profile:', {
        message: error.message,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Kakao OAuth 토큰으로 백엔드 로그인
   */
  async loginWithBackend(accessToken: string): Promise<any> {
    console.log('=== Backend Login Process Started ===');
    
    try {
      const config = require('../config/config').default;
      const url = `${config.API_BASE_URL}/api/${config.API_VERSION}/mobile-oauth/login`;
      console.log('Backend API URL:', url);
      console.log('Sending access token to backend...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'kakao',
          accessToken: accessToken, // 백엔드 DTO는 'accessToken' 필드를 사용
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
      console.error('Backend Kakao login failed:', {
        message: error.message,
        url: error.config?.url,
        status: error.response?.status
      });
      throw error;
    }
  }
}

export default new KakaoService();