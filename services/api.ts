import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, isAxiosError } from 'axios';
import config from '../config/config';

// API 기본 설정
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
  emoji?: string;
  isDefault?: boolean;
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
  date: string; // YYYY-MM-DD format, will be parsed to LocalDate by server
  amount: number; // Integer value for server validation
  description: string;
  memo?: string;
  amountType: 'INCOME' | 'EXPENSE'; // Server supports TRANSFER but mobile only uses INCOME/EXPENSE
  bookId: number; // 가계부 ID
  payment: string; // 결제 수단 name - server will look up by name
  category: string; // 카테고리 name - server will look up by name
  spender?: string;
}

// 가계부 기록 조회 요청
interface GetLedgerListRequest {
  bookId: number;
  page?: number;
  size?: number;
}

interface SearchLedgerRequest {
  bookId: number;
  startDate?: string;
  endDate?: string;
  amountType?: 'INCOME' | 'EXPENSE';
  category?: string;
  payment?: string;
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
  private axiosInstance: AxiosInstance;
  private authAxiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor(baseURL: string) {
    // 인증이 필요 없는 요청용 인스턴스
    this.authAxiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 인증이 필요한 요청용 인스턴스
    this.axiosInstance = axios.create({
      baseURL: `${baseURL}/api/${config.API_VERSION}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor - 토큰 추가
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          const token = await AsyncStorage.getItem('auth-token');
          console.log('=== Request Interceptor ===');
          console.log('URL:', config.url);
          console.log('토큰 존재:', token ? '있음' : '없음');
          
          if (token) {
            // Authorization Bearer 형식으로 토큰 설정
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log('Authorization 헤더 설정 완료');
          } else {
            console.log('토큰이 없어서 헤더 설정 건너뜀');
          }
          
          // Let Axios handle JSON serialization automatically
          // Only set Content-Type if not already set
          if (config.data && ['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
            if (!config.headers['Content-Type']) {
              config.headers['Content-Type'] = 'application/json';
            }
          }
          
          // 디버깅: 요청 정보 로그
          console.log('=== Axios Request Debug ===');
          console.log('URL:', config.url);
          console.log('Method:', config.method);
          console.log('Headers:', JSON.stringify(config.headers, null, 2));
          console.log('Data type:', typeof config.data);
          console.log('Data (raw):', config.data);
          if (config.data && typeof config.data === 'object') {
            console.log('Data (stringified):', JSON.stringify(config.data));
          }
          console.log('Content-Type:', config.headers['Content-Type']);
          console.log('Authorization:', config.headers['Authorization'] ? '설정됨' : '없음');
          console.log('==========================');
        } catch (error) {
          console.error('Request interceptor 에러:', error);
        }
        
        return config;
      },
      (error) => {
        console.error('Request interceptor 에러:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - 토큰 갱신
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // HTML 응답이 온 경우 (로그인 페이지로 리다이렉트된 경우)
        if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
          console.log('HTML 응답 감지 - 인증 실패로 간주');
          const error = new Error('AUTH_FAILED') as any;
          error.response = { ...response, status: 401 };
          return Promise.reject(error);
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // 401 에러 또는 AUTH_FAILED 에러인 경우 토큰 갱신 시도
        if ((error.response?.status === 401 || error.message === 'AUTH_FAILED') && !originalRequest._retry) {
          if (this.isRefreshing) {
            // 이미 토큰 갱신 중이면 대기
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.axiosInstance(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            // 토큰 재발급 - 쿠키 사용
            const response = await this.authAxiosInstance.post('/reissue', {}, {
              withCredentials: true,
              headers: {
                'Cookie': `refresh=${refreshToken}`
              }
            });

            // 헤더에서 토큰 확인
            const newAccessToken = response.headers['access'];
            const newRefreshToken = response.headers['refresh'];
            
            // Response body에서도 토큰 확인 (fallback)
            const bodyTokens = response.data as { accessToken?: string; refreshToken?: string };
            
            const finalAccessToken = newAccessToken || bodyTokens?.accessToken;
            const finalRefreshToken = newRefreshToken || bodyTokens?.refreshToken;
            
            if (finalAccessToken) {
              await AsyncStorage.setItem('auth-token', finalAccessToken);
              
              // 새로운 refresh token도 저장
              if (finalRefreshToken) {
                await AsyncStorage.setItem('refreshToken', finalRefreshToken);
              }
              
              // 대기 중인 요청들 처리
              this.processQueue(null);
              
              // 원래 요청 재시도
              originalRequest.headers!['Authorization'] = `Bearer ${finalAccessToken}`;
              return this.axiosInstance(originalRequest);
            } else {
              throw new Error('No access token in response');
            }
          } catch (refreshError: any) {
            console.error('Token refresh failed:', refreshError);
            this.processQueue(refreshError);
            
            // 토큰 재발급 실패시 로그아웃 처리
            await AsyncStorage.removeItem('auth-token');
            await AsyncStorage.removeItem('refreshToken');
            
            // 재사용 감지 또는 보안 침해인 경우
            if (refreshError.response?.data?.message?.includes('security breach')) {
              console.error('Security breach detected - all tokens revoked');
              // 사용자에게 알림 표시 (필요시 구현)
            }
            
            // 만료된 refresh token인 경우 로그인 화면으로 이동
            if (refreshError.response?.data?.message?.includes('expired') || 
                refreshError.response?.status === 400) {
              console.log('Refresh token expired, need to re-login');
            }
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve();
      }
    });
    this.failedQueue = [];
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('=== Login API 호출 ===');
    const response = await this.authAxiosInstance.post('/login', {
      username: credentials.email, // Spring Security는 username 필드 사용
      password: credentials.password,
    });

    const accessToken = response.headers['access'];
    const refreshToken = response.headers['refresh'];

    console.log('로그인 응답 헤더:', {
      access: accessToken ? '있음' : '없음',
      refresh: refreshToken ? '있음' : '없음'
    });

    if (!accessToken) {
      throw new Error('No access token received');
    }

    // 토큰 저장
    await AsyncStorage.setItem('auth-token', accessToken);
    if (refreshToken) {
      await AsyncStorage.setItem('refreshToken', refreshToken);
    }

    // 토큰이 저장되었는지 확인
    const savedToken = await AsyncStorage.getItem('auth-token');
    console.log('저장된 토큰 확인:', savedToken === accessToken ? '일치' : '불일치');

    // 사용자 정보 가져오기 - 토큰을 명시적으로 헤더에 설정
    console.log('사용자 정보 요청 시작');
    const userResponse = await this.axiosInstance.get<{
      id: number;
      username: string;
      email: string;
      role: string;
    }>('/user/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}` // Bearer 형식으로 토큰 전달
      }
    });

    console.log('사용자 정보 응답:', userResponse.data);

    return {
      user: {
        id: userResponse.data.id,
        username: userResponse.data.username,
        email: userResponse.data.email,
        name: userResponse.data.username,
        role: userResponse.data.role ? userResponse.data.role.replace('ROLE_', '') : 'USER',
      },
      token: accessToken,
      refreshToken: refreshToken || undefined,
    };
  }

  async signup(userData: SignupRequest): Promise<SignupResponse> {
    const response = await this.axiosInstance.post<{ id: number }>('/join', {
      email: userData.email,
      username: userData.name, // 서버는 username만 받으므로 name을 username으로 전송
      password: userData.password,
    });

    console.log('Signup successful, member ID:', response.data.id);

    // 회원가입 후 자동 로그인
    return this.login({
      email: userData.email,
      password: userData.password,
    });
  }

  async oauthLogin(oauthData: OAuthRequest): Promise<OAuthResponse> {
    const response = await this.axiosInstance.post<OAuthResponse>('/oauth2/token', oauthData);
    return response.data;
  }

  async getProfile(token: string): Promise<{ user: Member }> {
    const response = await this.axiosInstance.get<{
      id: number;
      username: string;
      email: string;
      role: string;
    }>('/user/me');

    return {
      user: {
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        name: response.data.username,
        role: response.data.role ? response.data.role.replace('ROLE_', '') : 'USER',
      },
    };
  }

  async logout(token: string): Promise<void> {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    try {
      // refresh token을 Authorization 헤더로 전송
      await this.authAxiosInstance.post('/logout', {}, {
        headers: refreshToken ? {
          'Authorization': `Bearer ${refreshToken}`
        } : undefined
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
      // 서버 호출 실패해도 로컬 토큰은 삭제
    }
    
    await AsyncStorage.removeItem('auth-token');
    await AsyncStorage.removeItem('refreshToken');
  }

  // Member endpoints
  async getMembers(token: string): Promise<Member[]> {
    const response = await this.axiosInstance.get<{ data: Member[] }>('/members');
    return response.data.data;
  }

  // Book endpoints
  async createBook(data: CreateBookRequest, token: string): Promise<Book> {
    const response = await this.axiosInstance.post<{ id: number; title: string }>('/book', data);
    
    return {
      id: response.data.id,
      title: response.data.title,
      ownerId: 0, // 서버에서 자동 설정
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getMyBooks(token: string): Promise<Book[]> {
    console.log('API: getMyBooks 호출');
    const response = await this.axiosInstance.get<any>('/book/mybooks');
    
    // HTML 응답 체크 (로그인 페이지로 리다이렉트된 경우)
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      console.error('API: 인증 실패 - 로그인 페이지로 리다이렉트됨');
      throw new Error('AUTH_FAILED');
    }
    
    console.log('API: getMyBooks 원본 응답:', response.data);
    
    // 서버가 ["java.util.ImmutableCollections$ListN", [실제 데이터]] 형식으로 응답하는 경우 처리
    let books: Book[] = [];
    
    if (Array.isArray(response.data)) {
      // 첫 번째 요소가 Java 클래스 이름인 경우
      if (response.data.length === 2 && typeof response.data[0] === 'string' && response.data[0].includes('java.util')) {
        books = response.data[1] || [];
      } else {
        books = response.data;
      }
    } else {
      console.error('API: 잘못된 응답 형식:', typeof response.data);
      throw new Error('INVALID_RESPONSE');
    }
    
    // Book 객체 형식으로 변환 (서버의 응답에서 필요한 필드만 추출)
    const formattedBooks = books.map((book: any) => ({
      id: book.id,
      title: book.title,
      ownerId: book.owner?.id || book.ownerId || 0,
      createdAt: book.createdAt || new Date().toISOString(),
      updatedAt: book.updatedAt || new Date().toISOString(),
    }));
    
    console.log('API: getMyBooks 파싱된 결과:', formattedBooks);
    return formattedBooks;
  }

  async getBookOwners(bookId: number, token: string): Promise<Member[]> {
    const response = await this.axiosInstance.get<{
      owners: Array<{ memberId: number; username: string; email: string }>;
    }>(`/book/${bookId}/owners`);

    return response.data.owners.map(owner => ({
      id: owner.memberId,
      username: owner.username,
      email: owner.email,
      name: owner.username,
      role: 'USER',
    }));
  }

  // Ledger endpoints
  async createLedger(data: CreateLedgerRequest, token: string): Promise<Ledger> {
    console.log('=== createLedger API 호출 ===');
    console.log('전송 데이터:', JSON.stringify(data, null, 2));
    console.log('데이터 타입:', typeof data);
    console.log('데이터 키:', Object.keys(data));
    console.log('baseURL:', this.axiosInstance.defaults.baseURL);
    console.log('요청 URL:', `${this.axiosInstance.defaults.baseURL}/ledger/ledgers`);
    
    // 데이터 유효성 검증
    if (!data.date || !data.amount || !data.description || !data.amountType || 
        !data.bookId || !data.payment || !data.category) {
      console.error('필수 필드 누락:', {
        date: data.date,
        amount: data.amount,
        description: data.description,
        amountType: data.amountType,
        bookId: data.bookId,
        payment: data.payment,
        category: data.category
      });
      throw new Error('필수 필드가 누락되었습니다.');
    }
    
    try {
      const response = await this.axiosInstance.post<{
        id: number;
        date: string;
        amount: number;
        description: string;
        amountType: string;
        category: string;
        payment: string;
      }>('/ledger/ledgers', data, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('=== createLedger 응답 ===');
      console.log('응답:', response.data);

      return {
        id: response.data.id,
        date: data.date,
        amount: data.amount,
        description: data.description,
        memo: data.memo,
        amountType: data.amountType,
        spender: data.spender,
        memberId: 0,
        bookId: data.bookId,
        categoryId: 0,
        paymentId: 0,
      };
    } catch (error) {
      console.error('=== createLedger 에러 ===');
      if (isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        console.error('Response headers:', error.response?.headers);
        console.error('Request config:', {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data,
        });
      }
      throw error;
    }
  }

  // 기본 가계부 목록 조회
  async getLedgerList(params: GetLedgerListRequest, token: string): Promise<Ledger[]> {
    const response = await this.axiosInstance.get<{
      dtoList: Array<{
        id: number;
        date: string;
        amount: number;
        description: string;
        memo?: string;
        amountType: 'INCOME' | 'EXPENSE';
        spender?: string;
        titleId: number;
        memberId: number;
        categoryId: number;
        paymentId: number;
      }>;
      totalElements: number;
    }>(`/ledger/${params.bookId}`, {
      params: {
        page: params.page,
        size: params.size,
      },
    });

    if (!response.data.dtoList) {
      return [];
    }

    return response.data.dtoList.map(ledger => ({
      id: ledger.id,
      date: ledger.date,
      amount: ledger.amount,
      description: ledger.description,
      memo: ledger.memo,
      amountType: ledger.amountType,
      spender: ledger.spender,
      memberId: ledger.memberId,
      bookId: ledger.titleId,
      categoryId: ledger.categoryId,
      paymentId: ledger.paymentId,
    }));
  }

  // 검색 조건이 있는 가계부 기록 검색
  async searchLedgers(params: SearchLedgerRequest, token: string): Promise<Ledger[]> {
    const response = await this.axiosInstance.get<{
      dtoList: Array<{
        id: number;
        date: string;
        amount: number;
        description: string;
        memo?: string;
        amountType: 'INCOME' | 'EXPENSE';
        spender?: string;
        titleId: number;
        memberId: number;
        categoryId: number;
        paymentId: number;
      }>;
      totalElements: number;
    }>(`/ledger/${params.bookId}/search`, {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        amountType: params.amountType,
        category: params.category,
        payment: params.payment,
        page: params.page,
        size: params.size,
      },
    });

    return response.data.dtoList.map(ledger => ({
      id: ledger.id,
      date: ledger.date,
      amount: ledger.amount,
      description: ledger.description,
      memo: ledger.memo,
      amountType: ledger.amountType,
      spender: ledger.spender,
      memberId: ledger.memberId,
      bookId: ledger.titleId,
      categoryId: ledger.categoryId,
      paymentId: ledger.paymentId,
    }));
  }

  // Category endpoints
  async createCategory(data: CreateCategoryRequest, token: string): Promise<Category> {
    const response = await this.axiosInstance.post<{ id: number }>('/category', data);
    
    return {
      id: response.data.id,
      category: data.category,
    };
  }

  async getCategoryList(token: string): Promise<Category[]> {
    try {
      const response = await this.axiosInstance.get<any>('/category/list');
      
      // HTML 응답 체크
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.error('API: 인증 실패 - 로그인 페이지로 리다이렉트됨');
        throw new Error('AUTH_FAILED');
      }
      
      console.log('카테고리 목록 원본 응답:', response.data);
      
      // 응답 데이터 파싱
      if (typeof response.data === 'object' && 'categories' in response.data) {
        return response.data.categories || [];
      }
      
      // 서버가 특이한 형식으로 응답하는 경우 처리
      if (Array.isArray(response.data) && response.data.length === 2 && typeof response.data[0] === 'string') {
        return response.data[1] || [];
      }
      
      return [];
    } catch (error) {
      console.error('카테고리 목록 조회 실패:', error);
      return []; // 에러 시 빈 배열 반환
    }
  }

  async getCategoryListByBook(bookId: number, token: string): Promise<Category[]> {
    const response = await this.axiosInstance.get<{
      categories: Array<{ id: number; category: string }>;
    }>(`/category/book/${bookId}`);
    return response.data.categories;
  }

  async createCategoryForBook(bookId: number, data: CreateCategoryRequest, token: string): Promise<Category> {
    const response = await this.axiosInstance.post<{ id: number; category: string }>(
      `/category/book/${bookId}`,
      data
    );
    
    return {
      id: response.data.id,
      category: response.data.category,
    };
  }

  // Payment endpoints
  async createPayment(data: CreatePaymentRequest, token: string): Promise<PaymentMethod> {
    const response = await this.axiosInstance.post<{ id: number }>('/payment', data);
    
    return {
      id: response.data.id,
      payment: data.payment,
    };
  }

  async getPaymentList(token: string): Promise<PaymentMethod[]> {
    try {
      const response = await this.axiosInstance.get<any>('/payment/list');
      
      // HTML 응답 체크
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.error('API: 인증 실패 - 로그인 페이지로 리다이렉트됨');
        throw new Error('AUTH_FAILED');
      }
      
      console.log('결제 수단 목록 원본 응답:', response.data);
      
      // 응답 데이터 파싱
      if (typeof response.data === 'object' && 'payments' in response.data) {
        return response.data.payments || [];
      }
      
      // 서버가 특이한 형식으로 응답하는 경우 처리
      if (Array.isArray(response.data) && response.data.length === 2 && typeof response.data[0] === 'string') {
        return response.data[1] || [];
      }
      
      return [];
    } catch (error) {
      console.error('결제 수단 목록 조회 실패:', error);
      return []; // 에러 시 빈 배열 반환
    }
  }

  async getPaymentListByBook(bookId: number, token: string): Promise<PaymentMethod[]> {
    const response = await this.axiosInstance.get<{
      payments: Array<{ id: number; payment: string }>;
    }>(`/payment/book/${bookId}`);
    return response.data.payments;
  }

  async createPaymentForBook(bookId: number, data: CreatePaymentRequest, token: string): Promise<PaymentMethod> {
    const response = await this.axiosInstance.post<{ id: number; payment: string }>(
      `/payment/book/${bookId}`,
      data
    );
    
    return {
      id: response.data.id,
      payment: response.data.payment,
    };
  }

  // UserBook endpoints
  async inviteUser(bookId: number, data: InviteUserRequest, token: string): Promise<InviteUserResponse> {
    const response = await this.axiosInstance.post<InviteUserResponse>(
      `/book/${bookId}/invite`,
      data
    );
    return response.data;
  }

  async removeMember(bookId: number, memberId: number, token: string): Promise<RemoveMemberResponse> {
    const response = await this.axiosInstance.delete<RemoveMemberResponse>(
      `/book/${bookId}/members/${memberId}`
    );
    return response.data;
  }

  async changeRole(bookId: number, memberId: number, data: ChangeRoleRequest, token: string): Promise<ChangeRoleResponse> {
    const response = await this.axiosInstance.put<ChangeRoleResponse>(
      `/book/${bookId}/members/${memberId}/role`,
      data
    );
    return response.data;
  }

  async leaveBook(bookId: number, token: string): Promise<LeaveBookResponse> {
    const response = await this.axiosInstance.post<LeaveBookResponse>(
      `/book/${bookId}/leave`
    );
    return response.data;
  }

  async getBookMembersWithRoles(bookId: number, token: string): Promise<BookMember[]> {
    try {
      const response = await this.axiosInstance.get<any>(`/book/${bookId}/owners`);
      
      console.log('가계부 멤버 조회 원본 응답:', JSON.stringify(response.data, null, 2));
      
      // 응답 데이터 파싱
      let owners: any[] = [];
      
      // 서버가 {"@class": "...", "owners": ["java.util.ArrayList", [[{...}]]]} 형식으로 응답
      if (response.data?.owners) {
        // owners가 ["java.util.ArrayList", [{...}]] 형식인 경우
        if (Array.isArray(response.data.owners) && response.data.owners.length === 2) {
          const ownerData = response.data.owners[1];
          // 중첩 배열 처리: [[{...}]] 또는 [{...}]
          if (Array.isArray(ownerData) && ownerData.length > 0) {
            // 첫 번째 요소가 또 배열인 경우
            if (Array.isArray(ownerData[0])) {
              owners = ownerData[0];
            } else {
              owners = ownerData;
            }
          }
        } else if (Array.isArray(response.data.owners)) {
          owners = response.data.owners;
        }
      } else if (Array.isArray(response.data)) {
        // 서버가 특이한 형식으로 응답하는 경우 처리
        if (response.data.length === 2 && typeof response.data[0] === 'string' && response.data[0].includes('java.util')) {
          owners = response.data[1] || [];
        } else {
          owners = response.data;
        }
      }
      
      console.log('파싱된 owners:', JSON.stringify(owners, null, 2));
      
      // OwnerDto 구조에 맞게 매핑
      return owners.map((owner, index) => {
        // owner 객체가 문자열로 직렬화된 경우 처리
        let ownerData = owner;
        if (typeof owner === 'string') {
          try {
            ownerData = JSON.parse(owner);
          } catch (e) {
            console.error('Owner 데이터 파싱 실패:', owner);
          }
        }
        
        return {
          memberId: ownerData.memberId || ownerData.member_id || ownerData.id || index,
          username: ownerData.username || ownerData.name || `사용자${index + 1}`,
          email: ownerData.email || '이메일 없음',
          role: ownerData.role || ownerData.bookRole || (index === 0 ? 'OWNER' as const : 'EDITOR' as const),
        };
      });
    } catch (error) {
      console.error('가계부 멤버 조회 실패:', error);
      return [];
    }
  }

  // Book Invite endpoints
  async createBookInviteCode(bookId: number, role: string): Promise<{ code: string; ttlSeconds: number }> {
    const response = await this.axiosInstance.post(`/book/invite/${bookId}/code`, { role });
    return response.data;
  }

  async createUserIdCode(): Promise<{ code: string; ttlSeconds: number }> {
    const response = await this.axiosInstance.post('/book/invite/user/code');
    return response.data;
  }

  async requestJoinBook(inviteCode: string): Promise<any> {
    const response = await this.axiosInstance.post('/book/invite/join', { inviteCode });
    return response.data;
  }

  async acceptJoinRequest(requestId: number): Promise<void> {
    await this.axiosInstance.put(`/book/invite/request/${requestId}/accept`);
  }

  async rejectJoinRequest(requestId: number): Promise<void> {
    await this.axiosInstance.put(`/book/invite/request/${requestId}/reject`);
  }

  async getBookJoinRequests(bookId: number): Promise<any[]> {
    const response = await this.axiosInstance.get(`/book/invite/${bookId}/requests`);
    return response.data;
  }

  async getMyJoinRequests(): Promise<any[]> {
    const response = await this.axiosInstance.get('/book/invite/my-requests');
    return response.data;
  }

  async createGroup(bookId: number, groupName: string, description?: string): Promise<any> {
    const response = await this.axiosInstance.post(`/book/invite/${bookId}/group`, { groupName, description });
    return response.data;
  }

  async addMemberToGroup(groupId: number, userBookId: number): Promise<void> {
    await this.axiosInstance.post(`/book/invite/group/${groupId}/member`, { userBookId });
  }

  async getBookGroups(bookId: number): Promise<any[]> {
    const response = await this.axiosInstance.get(`/book/invite/${bookId}/groups`);
    return response.data;
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
  OAuthResponse, PaymentMethod, RemoveMemberResponse, SearchLedgerRequest, SignupRequest,
  SignupResponse, UserBook
};

