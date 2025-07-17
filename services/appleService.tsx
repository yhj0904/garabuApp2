import { Platform } from 'react-native';

// 조건부 import - iOS에서만 사용 가능
let appleAuth: any = null;
let AppleButton: any = null;

try {
  if (Platform.OS === 'ios') {
    const expoAppleAuth = require('expo-apple-authentication');
    appleAuth = expoAppleAuth;
    AppleButton = expoAppleAuth.AppleAuthenticationButton;
  }
} catch (error) {
  console.log('Apple Authentication not available');
}

interface AppleAuthResult {
  identityToken: string | null;
  authorizationCode: string | null;
  user?: string | null;
  email?: string | null;
  fullName?: {
    givenName?: string | null;
    familyName?: string | null;
  } | null;
}

class AppleService {
  /**
   * Apple 로그인 가능 여부 확인
   */
  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios' || !appleAuth) {
      return false;
    }
    
    try {
      return await appleAuth.isAvailableAsync();
    } catch (error) {
      console.error('Apple Auth availability check failed:', error);
      return false;
    }
  }

  /**
   * Apple 로그인 수행
   */
  async login(): Promise<AppleAuthResult> {
    if (!appleAuth) {
      throw new Error('Apple Authentication not available');
    }

    try {
      const credential = await appleAuth.signInAsync({
        requestedScopes: [
          appleAuth.AppleAuthenticationScope.FULL_NAME,
          appleAuth.AppleAuthenticationScope.EMAIL,
        ],
      });

      return {
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode,
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
      };
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        throw new Error('Apple Sign-In was canceled');
      }
      console.error('Apple login failed:', error);
      throw error;
    }
  }

  /**
   * Apple OAuth 토큰으로 백엔드 로그인
   */
  async loginWithBackend(identityToken: string, authorizationCode?: string): Promise<any> {
    console.log('=== Backend Apple Login Process Started ===');
    
    try {
      const config = require('../config/config').default;
      const url = `${config.API_BASE_URL}/api/${config.API_VERSION}/mobile-oauth/login`;
      console.log('Backend API URL:', url);
      console.log('Sending Apple tokens to backend...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'apple',
          accessToken: identityToken,  // Apple의 identityToken을 accessToken으로 전송
          idToken: identityToken,       // idToken에도 동일하게 전송 (호환성)
          refreshToken: authorizationCode || null,  // authorizationCode를 refreshToken으로 전송
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
        hasAccessToken: !!data.accessToken,
        hasRefreshToken: !!data.refreshToken
      });
      
      return data;
    } catch (error: any) {
      console.error('Backend Apple login failed:', {
        message: error.message,
        url: error.config?.url,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Apple 로그인 버튼 렌더링
   */
  renderButton(props: {
    onPress: () => void;
    style?: any;
    buttonStyle?: any;
    buttonType?: any;
    cornerRadius?: number;
  }) {
    if (!AppleButton || Platform.OS !== 'ios') {
      return null;
    }

    const {
      onPress,
      style,
      buttonStyle = appleAuth?.AppleAuthenticationButtonStyle?.BLACK,
      buttonType = appleAuth?.AppleAuthenticationButtonType?.SIGN_IN,
      cornerRadius = 12,
    } = props;

    return (
      <AppleButton
        buttonStyle={buttonStyle}
        buttonType={buttonType}
        style={[{ height: 50 }, style]}
        onPress={onPress}
        cornerRadius={cornerRadius}
      />
    );
  }
}

export default new AppleService();