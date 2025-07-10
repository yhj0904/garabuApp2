import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/config';

// API 기본 설정
const API_BASE_URL = config.API_BASE_URL; // config에서 가져오도록 수정
// const API_BASE_URL = 'http://localhost:8080'; // 실제 API 서버 URL
// const API_BASE_URL = 'http://192.168.1.100:8080'; // 모바일 디바이스에서 사용할 경우

// 가계부 관련 인터페이스
interface Member {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  providerId?: string;
}

interface Book {
  id: number;
  title: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

interface Ledger {
  id: number;
  date: string;
  amount: number;
  description: string;
  memo?: string;
  amountType: 'INCOME' | 'EXPENSE';
  spender?: string;
  memberId: number;
  bookId: number;
  categoryId: number;
  paymentId: number;
}

interface Category {
  id: number;
  category: string;
}

interface PaymentMethod {
  id: number;
  payment: string;
}

interface UserBook {
  id: number;
  memberId: number;
  bookId: number;
  userRole: 'OWNER' | 'EDITOR' | 'VIEWER';
}

// 요청/응답 인터페이스
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: Member;
  token: string;
  refreshToken?: string;
}

interface SignupRequest {
  email: string;
  username: string;
  password: string;
  name: string;
}

interface SignupResponse {
  user: Member;
  token: string;
  refreshToken?: string;
}

interface OAuthRequest {
  provider: 'google' | 'naver';
  accessToken: string;
  refreshToken?: string;
}

interface OAuthResponse {
  user: Member;
  token: string;
}

// 가계부 생성 요청
interface CreateBookRequest {
  title: string;
}

// 가계부 기록 생성 요청
interface CreateLedgerRequest {
  date: string;
  amount: number;
  description: string;
  memo?: string;
  amountType: 'INCOME' | 'EXPENSE';
  title: string; // 가계부 제목
  payment: string; // 결제 수단
  category: string; // 카테고리
  spender?: string;
}

// 가계부 기록 조회 요청
interface GetLedgerListRequest {
  startDate?: string;
  endDate?: string;
  amountType?: 'INCOME' | 'EXPENSE';
  category?: string;
  page?: number;
  size?: number;
}

// 카테고리 생성 요청
interface CreateCategoryRequest {
  category: string;
}

// 결제 수단 생성 요청
interface CreatePaymentRequest {
  payment: string;
}

// 가계부 공유 관련 인터페이스
interface InviteUserRequest {
  email: string;
  role: 'EDITOR' | 'VIEWER';
}

interface InviteUserResponse {
  message: string;
}

interface RemoveMemberResponse {
  message: string;
}

interface ChangeRoleRequest {
  role: 'EDITOR' | 'VIEWER';
}

interface ChangeRoleResponse {
  message: string;
}

interface LeaveBookResponse {
  message: string;
}

// 가계부 멤버 정보 (소유자 목록에서 확장)
interface BookMember {
  memberId: number;
  username: string;
  email: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const url = `${this.baseURL}/api${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // JWT 토큰 추가
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // 토큰 갱신 처리
      if (response.status === 401) {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          // 토큰 재발급 시도
          const reissueResponse = await fetch(`${this.baseURL}/reissue`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': `refresh=${refreshToken}`,
            },
          });

          if (reissueResponse.ok) {
            const newAccessToken = reissueResponse.headers.get('access');
            
            // 새로운 refresh token도 쿠키에서 확인
            const newSetCookieHeader = reissueResponse.headers.get('set-cookie');
            if (newSetCookieHeader) {
              const newRefreshMatch = newSetCookieHeader.match(/refresh=([^;]+)/);
              if (newRefreshMatch) {
                await AsyncStorage.setItem('refreshToken', newRefreshMatch[1]);
              }
            }
            
            if (newAccessToken) {
              await AsyncStorage.setItem('token', newAccessToken);
              // 원래 요청 재시도
              headers['Authorization'] = `Bearer ${newAccessToken}`;
              const retryResponse = await fetch(url, {
                ...options,
                headers,
              });
              if (!retryResponse.ok) {
                throw new Error(`HTTP error! status: ${retryResponse.status}`);
              }
              return retryResponse.json();
            }
          }
        }
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorData;
        if (contentType && contentType.indexOf("application/json") !== -1) {
          errorData = await response.json();
        } else {
          errorData = await response.text();
        }
        console.error(`HTTP error! status: ${response.status}, url: ${url}, message:`, errorData);
        throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
      }

      // 응답 처리
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        throw new Error('Expected JSON response but received: ' + text.substring(0, 100));
      }
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Spring Security 로그인 엔드포인트 사용
    const response = await fetch(`${this.baseURL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: credentials.email, // Spring Security는 username 필드 사용
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    // JWT 토큰은 헤더에서 추출
    const accessToken = response.headers.get('access');
    
    // Refresh token은 쿠키에서 추출
    let refreshToken = null;
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const refreshMatch = setCookieHeader.match(/refresh=([^;]+)/);
      if (refreshMatch) {
        refreshToken = refreshMatch[1];
      }
    }

    if (!accessToken) {
      throw new Error('No access token received');
    }

    // 토큰 저장
    await AsyncStorage.setItem('token', accessToken);
    if (refreshToken) {
      await AsyncStorage.setItem('refreshToken', refreshToken);
    }

    // 사용자 정보 가져오기
    const userResponse = await this.request<{ 
      id: number;
      username: string;
      email: string;
      role: string;
    }>('/user/me', {}, accessToken);
    
    console.log('User info from /user/me:', userResponse);
    
    return {
      user: {
        id: userResponse.id,
        username: userResponse.username,
        email: userResponse.email,
        name: userResponse.username, // username을 name으로도 사용
        role: userResponse.role ? userResponse.role.replace('ROLE_', '') : 'USER', // role이 null일 때 기본값 처리
      },
      token: accessToken,
      refreshToken: refreshToken || undefined,
    };
  }

  async signup(userData: SignupRequest): Promise<SignupResponse> {
    try {
      // 서버의 /api/v2/join 엔드포인트 호출
      const response = await this.request<{ id: number }>('/join', {
        method: 'POST',
        body: JSON.stringify({
          email: userData.email,
          username: userData.name, // 서버는 username만 받으므로 name을 username으로 전송
          password: userData.password,
          // name 필드는 서버에서 받지 않으므로 제거
        }),
      });

      console.log('Signup successful, member ID:', response.id);

      // 회원가입 후 자동 로그인
      return this.login({
        email: userData.email,
        password: userData.password,
      });
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async oauthLogin(oauthData: OAuthRequest): Promise<OAuthResponse> {
    // OAuth2 로그인은 웹뷰를 통해 처리되므로 토큰 교환만 수행
    const response = await this.request<OAuthResponse>('/oauth2/token', {
      method: 'POST',
      body: JSON.stringify(oauthData),
    });
    return response;
  }

  async getProfile(token: string): Promise<{ user: Member }> {
    const response = await this.request<{ 
      id: number;
      username: string;
      email: string;
      role: string;
    }>('/user/me', {}, token);
    
    return {
      user: {
        id: response.id,
        username: response.username,
        email: response.email,
        name: response.username, // username을 name으로도 사용
        role: response.role ? response.role.replace('ROLE_', '') : 'USER', // role이 null일 때 기본값 처리
      },
    };
  }

  async logout(token: string): Promise<void> {
    await this.request('/logout', {
      method: 'POST',
    }, token);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');
  }

  // Member endpoints
  async getMembers(token: string): Promise<Member[]> {
    const response = await this.request<{ data: Member[] }>('/members', {}, token);
    return response.data;
  }

  // Book endpoints
  async createBook(data: CreateBookRequest, token: string): Promise<Book> {
    const response = await this.request<{ id: number }>('/book', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
    
    return {
      id: response.id,
      title: data.title,
      ownerId: 0, // 서버에서 자동 설정
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getMyBooks(token: string): Promise<Book[]> {
    return this.request<Book[]>('/book/mybooks', {}, token);
  }

  async getBookOwners(bookId: number, token: string): Promise<Member[]> {
    const response = await this.request<{ owners: Array<{ memberId: number; username: string; email: string }> }>(
      `/book/${bookId}/owners`,
      {},
      token
    );
    
    return response.owners.map(owner => ({
      id: owner.memberId,
      username: owner.username,
      email: owner.email,
      name: owner.username,
      role: 'USER',
    }));
  }

  // Ledger endpoints
  async createLedger(data: CreateLedgerRequest, token: string): Promise<Ledger> {
    const response = await this.request<{ id: number }>('/ledger', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
    
    return {
      id: response.id,
      date: data.date,
      amount: data.amount,
      description: data.description,
      memo: data.memo,
      amountType: data.amountType,
      spender: data.spender,
      memberId: 0,
      bookId: 0,
      categoryId: 0,
      paymentId: 0,
    };
  }

  async getLedgerList(params: GetLedgerListRequest, token: string): Promise<Ledger[]> {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.amountType) queryParams.append('amountType', params.amountType);
    if (params.category) queryParams.append('category', params.category);
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());

    const response = await this.request<{ ledgers: Array<{
      id: number;
      date: string;
      amount: number;
      category: string;
      amountType: 'INCOME' | 'EXPENSE';
    }> }>(`/ledger/list?${queryParams.toString()}`, {}, token);
    
    return response.ledgers.map(ledger => ({
      id: ledger.id,
      date: ledger.date,
      amount: ledger.amount,
      description: ledger.category,
      amountType: ledger.amountType,
      memberId: 0,
      bookId: 0,
      categoryId: 0,
      paymentId: 0,
    }));
  }

  // Category endpoints
  async createCategory(data: CreateCategoryRequest, token: string): Promise<Category> {
    const response = await this.request<{ id: number }>('/category', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
    
    return {
      id: response.id,
      category: data.category,
    };
  }

  async getCategoryList(token: string): Promise<Category[]> {
    const response = await this.request<{ categories: Array<{ id: number; category: string }> }>('/category/list', {}, token);
    return response.categories;
  }

  // Payment endpoints
  async createPayment(data: CreatePaymentRequest, token: string): Promise<PaymentMethod> {
    const response = await this.request<{ id: number }>('/payment', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
    
    return {
      id: response.id,
      payment: data.payment,
    };
  }

  async getPaymentList(token: string): Promise<PaymentMethod[]> {
    const response = await this.request<{ payments: Array<{ id: number; payment: string }> }>('/payment/list', {}, token);
    return response.payments;
  }

  // UserBook endpoints
  async inviteUser(bookId: number, data: InviteUserRequest, token: string): Promise<InviteUserResponse> {
    return this.request<InviteUserResponse>(`/book/${bookId}/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async removeMember(bookId: number, memberId: number, token: string): Promise<RemoveMemberResponse> {
    return this.request<RemoveMemberResponse>(`/book/${bookId}/members/${memberId}`, {
      method: 'DELETE',
    }, token);
  }

  async changeRole(bookId: number, memberId: number, data: ChangeRoleRequest, token: string): Promise<ChangeRoleResponse> {
    return this.request<ChangeRoleResponse>(`/book/${bookId}/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  }

  async leaveBook(bookId: number, token: string): Promise<LeaveBookResponse> {
    return this.request<LeaveBookResponse>(`/book/${bookId}/leave`, {
      method: 'POST',
    }, token);
  }

  async getBookMembersWithRoles(bookId: number, token: string): Promise<BookMember[]> {
    const response = await this.request<{ owners: Array<{
      memberId: number;
      username: string;
      email: string;
    }> }>(`/book/${bookId}/owners`, {}, token);
    
    // 서버 API가 role 정보를 제공하지 않으므로 임시로 첫 번째를 OWNER로 설정
    return response.owners.map((owner, index) => ({
      memberId: owner.memberId,
      username: owner.username,
      email: owner.email,
      role: index === 0 ? 'OWNER' as const : 'EDITOR' as const,
    }));
  }
}

// API 서비스 인스턴스 생성 - 실제 서버 API만 사용
const apiService = new ApiService(config.API_BASE_URL);

export default apiService;
export { ApiService };
export type {
  Book, BookMember, Category, ChangeRoleRequest,
  ChangeRoleResponse, CreateBookRequest, CreateCategoryRequest, CreateLedgerRequest, CreatePaymentRequest, GetLedgerListRequest, InviteUserRequest,
  InviteUserResponse, LeaveBookResponse, Ledger, LoginRequest,
  LoginResponse, Member, OAuthRequest,
  OAuthResponse, PaymentMethod, RemoveMemberResponse, SignupRequest,
  SignupResponse, UserBook
};

