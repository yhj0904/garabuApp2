import { useAuthStore } from '@/stores/authStore';

// API 기본 설정
const API_BASE_URL = 'http://localhost:8080'; // 실제 API 서버 URL

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string;
  };
  token: string;
}

interface SignupRequest {
  email: string;
  username: string;
  password: string;
}

interface SignupResponse {
  user: {
    id: string;
    username: string;
    email: string;
  };
  token: string;
}

interface OAuthRequest {
  provider: 'google' | 'naver';
  accessToken: string;
  refreshToken?: string;
}

interface OAuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
  };
  token: string;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // 기본 헤더 설정
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // JWT 토큰이 있으면 헤더에 추가
    const token = useAuthStore.getState().token;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API 요청 실패:', error);
      throw error;
    }
  }

  // 로그인 API (Spring Security 기본 엔드포인트)
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // 회원가입 API
  async signup(userData: SignupRequest): Promise<SignupResponse> {
    return this.request<SignupResponse>('/api/v2/join', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // OAuth2 소셜 로그인
  async oauthLogin(oauthData: OAuthRequest): Promise<OAuthResponse> {
    return this.request<OAuthResponse>('/api/v2/oauth/login', {
      method: 'POST',
      body: JSON.stringify(oauthData),
    });
  }

  // 사용자 정보 조회 API
  async getProfile(): Promise<{ user: LoginResponse['user'] }> {
    return this.request<{ user: LoginResponse['user'] }>('/api/v2/profile');
  }

  // 로그아웃 API
  async logout(): Promise<void> {
    return this.request<void>('/api/v2/logout', {
      method: 'POST',
    });
  }
}

// API 서비스 인스턴스 생성
export const apiService = new ApiService(API_BASE_URL);

// 개발용 Mock API (실제 API가 없을 때 사용)
export class MockApiService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // 실제 API 호출을 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === 'test@example.com' && credentials.password === 'password') {
      return {
        user: {
          id: '1',
          username: '테스트 사용자',
          email: credentials.email,
        },
        token: 'mock-jwt-token-' + Date.now(),
      };
    }
    
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  async signup(userData: SignupRequest): Promise<SignupResponse> {
    // 실제 API 호출을 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      user: {
        id: Date.now().toString(),
        username: userData.username,
        email: userData.email,
      },
      token: 'mock-jwt-token-' + Date.now(),
    };
  }

  async oauthLogin(oauthData: OAuthRequest): Promise<OAuthResponse> {
    // 실제 API 호출을 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      user: {
        id: Date.now().toString(),
        username: `${oauthData.provider} 사용자`,
        email: `user@${oauthData.provider}.com`,
      },
      token: 'mock-jwt-token-' + Date.now(),
    };
  }

  async getProfile(): Promise<{ user: LoginResponse['user'] }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      user: {
        id: '1',
        username: '테스트 사용자',
        email: 'test@example.com',
      },
    };
  }

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// 개발 환경에서는 Mock API 사용, 프로덕션에서는 실제 API 사용
export const api = process.env.NODE_ENV === 'development' 
  ? new MockApiService() 
  : apiService; 