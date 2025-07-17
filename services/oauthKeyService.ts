import config from '../config/config';

interface OAuthKeys {
  kakao: {
    nativeAppKey: string;
    restApiKey?: string;
    javascriptKey?: string;
  };
  google: {
    androidClientId: string;
    iosClientId: string;
    webClientId?: string;
  };
  apple: {
    teamId?: string;
    clientId?: string;
    keyId?: string;
  };
}

class OAuthKeyService {
  private keys: OAuthKeys | null = null;

  /**
   * 서버에서 OAuth 키 가져오기
   */
  async fetchKeys(): Promise<OAuthKeys> {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/${config.API_VERSION}/oauth-keys/mobile`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.warn(`OAuth keys endpoint returned ${response.status}, using default keys`);
        return this.getDefaultKeys();
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('OAuth keys endpoint returned non-JSON response, using default keys');
        return this.getDefaultKeys();
      }

      this.keys = await response.json();
      return this.keys;
    } catch (error) {
      console.warn('OAuth 키 가져오기 실패, 기본값 사용:', error);
      // 기본값 반환 (하드코딩된 키)
      return this.getDefaultKeys();
    }
  }

  /**
   * 캐시된 키 가져오기
   */
  getKeys(): OAuthKeys {
    if (!this.keys) {
      return this.getDefaultKeys();
    }
    return this.keys;
  }

  /**
   * 기본 키 값 (서버에서 가져오기 실패 시 사용)
   */
  private getDefaultKeys(): OAuthKeys {
    return {
      kakao: {
        nativeAppKey: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY || '9232996cd9a91757d2e423adfb12254a',
      },
      google: {
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '392078217032-lsgofa1o9vqss83dlnjhro4o2jppvkq3.apps.googleusercontent.com',
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '392078217032-rhofbdds2f1a1i41umvd6q39igjvjech.apps.googleusercontent.com',
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '392078217032-7l8rpg6cjnhkv6d4o3kf0a6fqvhc2v3p.apps.googleusercontent.com',
      },
      apple: {},
    };
  }

  /**
   * Kakao 네이티브 앱 키 가져오기
   */
  getKakaoNativeAppKey(): string {
    return this.getKeys().kakao.nativeAppKey;
  }

  /**
   * Google 클라이언트 ID 가져오기 (플랫폼별)
   */
  getGoogleClientId(platform: 'android' | 'ios'): string {
    const keys = this.getKeys();
    return platform === 'android' ? keys.google.androidClientId : keys.google.iosClientId;
  }

  /**
   * Google Web Client ID 가져오기 (One-Tap 로그인용)
   */
  getGoogleWebClientId(): string {
    const keys = this.getKeys();
    return keys.google.webClientId || keys.google.androidClientId; // Fallback to Android Client ID
  }
}

export default new OAuthKeyService();