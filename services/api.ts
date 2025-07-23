import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, isAxiosError } from 'axios';
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
  transactionDate: string; // 호환성을 위해 추가
  amount: number;
  description: string;
  memo?: string;
  amountType: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  spender?: string;
  memberId: number;
  bookId: number;
  categoryId: number;
  paymentId: number;}

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

// 자산 관련 인터페이스
interface Asset {
  id: number;
  name: string;
  assetType: 'CASH' | 'SAVINGS_ACCOUNT' | 'CHECKING_ACCOUNT' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'INVESTMENT' | 'REAL_ESTATE' | 'OTHER';
  balance: number;
  description?: string;
  accountNumber?: string;
  bankName?: string;
  cardType?: string;
  isActive: boolean;
  bookId: number;
  createdAt: string;
  updatedAt: string;
}

interface AssetType {
  type: 'CASH' | 'SAVINGS_ACCOUNT' | 'CHECKING_ACCOUNT' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'INVESTMENT' | 'REAL_ESTATE' | 'OTHER';
  name: string;
  icon: string;
  color: string;
}

interface UserBook {
  id: number;
  memberId: number;
  bookId: number;
  userRole: 'OWNER' | 'EDITOR' | 'VIEWER';
}

// 반복거래 관련 인터페이스
interface RecurringTransaction {
  id: number;
  name: string;
  description?: string;
  amountType: 'INCOME' | 'EXPENSE';
  amount: number;
  categoryId?: number;
  categoryName?: string;
  paymentMethodId?: number;
  paymentMethodName?: string;
  assetId?: number;
  recurrenceType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  recurrenceInterval: number;
  recurrenceDay?: string;
  startDate: string;
  endDate?: string;
  nextExecutionDate?: string;
  lastExecutionDate?: string;
  isActive: boolean;
  executionCount: number;
  maxExecutions?: number;
  autoCreate: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface CreateRecurringTransactionRequest {
  name: string;
  description?: string;
  amountType: 'INCOME' | 'EXPENSE';
  amount: number;
  categoryId?: number;
  paymentMethodId?: number;
  assetId?: number;
  recurrenceType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  recurrenceInterval?: number;
  recurrenceDay?: string;
  startDate: string;
  endDate?: string;
  maxExecutions?: number;
  autoCreate?: boolean;
}

interface UpdateRecurringTransactionRequest {
  name?: string;
  description?: string;
  amount?: number;
  recurrenceInterval?: number;
  endDate?: string;
  autoCreate?: boolean;
}

interface UpcomingTransaction {
  id: number;
  name: string;
  amountType: 'INCOME' | 'EXPENSE';
  amount: number;
  categoryName?: string;
  executionDate: string;
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
  provider: 'google' | 'apple' | 'naver' | 'kakao';
  accessToken: string;
  refreshToken?: string;
}

interface OAuthResponse {
  user: Member;
  token: string;
}

// FCM 토큰 관련 인터페이스
interface FCMTokenRequest {
  token: string;
  deviceId: string;
  deviceType: 'ios' | 'android' | 'web';
  appVersion?: string;
  osVersion?: string;
}

interface FCMTokenResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

// 친구 관련 인터페이스
interface Friend {
  friendshipId: number;
  friendId: number;
  username: string;
  name: string;
  alias?: string;
  status: string;
  acceptedAt?: string;
  lastInteractionAt?: string;
}

interface FriendRequest {
  friendshipId: number;
  requesterId: number;
  requesterUsername: string;
  requesterName: string;
  addresseeId: number;
  addresseeUsername: string;
  addresseeName: string;
  requesterAlias?: string;
  status: string;
  requestedAt: string;
}

interface FriendGroup {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface SendFriendRequestRequest {
  addresseeId: number;
  alias?: string;
}

interface AcceptFriendRequestRequest {
  alias?: string;
}

interface SetFriendAliasRequest {
  alias: string;
}

interface CreateFriendGroupRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

// 메시지 관련 인터페이스
interface Message {
  id: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  content: string;
  messageType: string;
  status: string;
  sentAt: string;
  readAt?: string;
}

interface SendMessageRequest {
  receiverId: number;
  content: string;
}

// 댓글 관련 인터페이스
interface Comment {
  id: number;
  authorId: number;
  authorName: string;
  content: string;
  commentType: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

interface CreateCommentRequest {
  content: string;
}

// 메모 관련 인터페이스
interface Memo {
  id: number;
  bookId: number;
  title?: string;
  content: string;
  important: boolean;
  color?: string;
  authorId: number;
  authorName: string;
  lastEditorId?: number;
  lastEditorName?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateMemoRequest {
  title?: string;
  content: string;
  important?: boolean;
  color?: string;
}

// 알림 관련 인터페이스
interface NotificationRequest {
  title: string;
  body: string;
  data?: any;
  type: string;
}

// 반복거래 관련 인터페이스
interface RecurringTransaction {
  id: number;
  bookId: number;
  categoryId: number;
  paymentMethodId: number;
  description: string;
  amount: number;
  amountType: 'INCOME' | 'EXPENSE';
  dayOfMonth: number;
  isActive: boolean;
  lastExecutedDate?: string;
  nextExecutionDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateRecurringTransactionRequest {
  categoryId: number;
  paymentMethodId: number;
  description: string;
  amount: number;
  amountType: 'INCOME' | 'EXPENSE';
  dayOfMonth: number;
  isActive?: boolean;
}

interface UpdateRecurringTransactionRequest {
  categoryId?: number;
  paymentMethodId?: number;
  description?: string;
  amount?: number;
  amountType?: 'INCOME' | 'EXPENSE';
  dayOfMonth?: number;
  isActive?: boolean;
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
  amountType: 'INCOME' | 'EXPENSE' | 'TRANSFER';
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
  emoji?: string;
}

// 결제 수단 생성 요청
interface CreatePaymentRequest {
  payment: string;
}

// 자산 생성/수정 요청
interface CreateAssetRequest {
  name: string;
  assetType: 'CASH' | 'SAVINGS_ACCOUNT' | 'CHECKING_ACCOUNT' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'INVESTMENT' | 'REAL_ESTATE' | 'OTHER';
  balance: number;
  description?: string;
  accountNumber?: string;
  bankName?: string;
  cardType?: string;
}

interface UpdateAssetRequest {
  name?: string;
  balance?: number;
  description?: string;
  accountNumber?: string;
  bankName?: string;
  cardType?: string;
  isActive?: boolean;
}

// 이체 요청
interface CreateTransferRequest {
  date: string; // YYYY-MM-DD format
  amount: number;
  description: string;
  memo?: string;
  bookId: number;
  fromAssetId: number;
  toAssetId: number;
  transferer?: string;
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

// 예산 관련 인터페이스
interface Budget {
  id: number;
  bookId: number;
  budgetMonth: string;
  incomeBudget?: number;
  expenseBudget?: number;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

interface BudgetRequest {
  budgetMonth: string;
  incomeBudget?: number;
  expenseBudget?: number;
  memo?: string;
}

interface BudgetSummary {
  id: number;
  bookId: number;
  budgetMonth: string;
  incomeBudget?: number;
  expenseBudget?: number;
  actualIncome: number;
  actualExpense: number;
  incomeAchievementRate: number;
  expenseAchievementRate: number;
  incomeDifference: number;
  expenseDifference: number;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

// 가계부 멤버 정보 (소유자 목록에서 확장)
interface BookMember {
  memberId: number;
  username: string;
  email: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
}

class ApiService {
  public axiosInstance: AxiosInstance;
  private authAxiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor(baseURL: string) {
    // 인증 관련 요청용 인스턴스 (로그인, 로그아웃, 토큰 재발급 등 - API 버전 없음)
    this.authAxiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 비즈니스 로직 API 요청용 인스턴스 (API 버전 포함)
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

            // 토큰 재발급 - Authorization 헤더로 refresh token 전송
            const response = await this.authAxiosInstance.post('/reissue', {}, {
              headers: {
                'Authorization': `Bearer ${refreshToken}`
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
    const response = await this.axiosInstance.post<OAuthResponse>('/mobile-oauth/login', oauthData);
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

  async updateBook(bookId: number, data: { title: string }, token: string): Promise<Book> {
    const response = await this.axiosInstance.put<{ id: number; title: string }>(`/book/${bookId}`, data);
    
    return {
      id: response.data.id,
      title: response.data.title,
      ownerId: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteBook(bookId: number, token: string): Promise<void> {
    await this.axiosInstance.delete(`/book/${bookId}`);
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
  async updateLedger(ledgerId: number, data: CreateLedgerRequest, token: string): Promise<Ledger> {
    console.log('=== updateLedger API 호출 ===');
    console.log('업데이트 데이터:', JSON.stringify(data, null, 2));
    
    try {
      const response = await this.axiosInstance.put<{
        id: number;
        date: string;
        amount: number;
        description: string;
        amountType: string;
        category: string;
        payment: string;
      }>(`/ledger/ledgers/${ledgerId}`, data);

      console.log('=== updateLedger 응답 ===');
      console.log('응답:', response.data);

      return {
        id: response.data.id,
        date: data.date,
        transactionDate: data.date, // 호환성을 위해 추가
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
      console.error('=== updateLedger 에러 ===');
      if (isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      throw error;
    }
  }

  async deleteLedger(ledgerId: number, token: string): Promise<void> {
    console.log('=== deleteLedger API 호출 ===');
    console.log('삭제할 ledger ID:', ledgerId);
    
    try {
      await this.axiosInstance.delete(`/ledger/ledgers/${ledgerId}`);
      console.log('=== deleteLedger 성공 ===');
    } catch (error) {
      console.error('=== deleteLedger 에러 ===');
      if (isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      throw error;
    }
  }

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
      }>('/ledger/ledgers', data);

      console.log('=== createLedger 응답 ===');
      console.log('응답:', response.data);

      return {
        id: response.data.id,
        date: data.date,
        transactionDate: data.date, // 호환성을 위해 추가
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
    console.log('=== getLedgerList API 호출 ===');
    console.log('bookId:', params.bookId);
    console.log('page:', params.page);
    console.log('size:', params.size);
    
    try {
      const response = await this.axiosInstance.get<{
        ledgers: Array<{
          id: number;
          date: string;
          amount: number;
          description: string;
          memo?: string;
          amountType: 'INCOME' | 'EXPENSE';
          spender?: string;
          bookId: number;
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

      console.log('=== getLedgerList 응답 ===');
      console.log('응답 데이터:', response.data);

      if (!response.data.ledgers) {
        console.log('ledgers 필드가 없음, 빈 배열 반환');
        return [];
      }

      const mappedLedgers = response.data.ledgers.map(ledger => ({
        id: ledger.id,
        date: ledger.date,
        transactionDate: ledger.date, // 호환성을 위해 추가
        amount: ledger.amount,
        description: ledger.description,
        memo: ledger.memo,
        amountType: ledger.amountType,
        spender: ledger.spender,
        memberId: ledger.memberId || 0,
        bookId: ledger.bookId || params.bookId,
        categoryId: ledger.categoryId || 0,
        paymentId: ledger.paymentId || 0,
      }));

      console.log('매핑된 ledgers:', mappedLedgers);
      return mappedLedgers;
    } catch (error) {
      console.error('=== getLedgerList 에러 ===');
      console.error('에러:', error);
      if (isAxiosError(error)) {
        console.error('응답 상태:', error.response?.status);
        console.error('응답 데이터:', error.response?.data);
      }
      throw error;
    }
  }

  // 검색 조건이 있는 가계부 기록 검색
  async searchLedgers(params: SearchLedgerRequest, token: string): Promise<Ledger[]> {
    console.log('=== searchLedgers API 호출 ===');
    console.log('검색 파라미터:', params);
    
    const response = await this.axiosInstance.get<{
      ledgers: Array<{
        id: number;
        date: string;
        amount: number;
        description: string;
        memo?: string;
        amountType: 'INCOME' | 'EXPENSE';
        spender?: string;
        bookId: number;
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

    console.log('=== searchLedgers 응답 ===');
    console.log('응답 데이터:', response.data);

    if (!response.data.ledgers) {
      console.log('ledgers 필드가 없음, 빈 배열 반환');
      return [];
    }

    const mappedLedgers = response.data.ledgers.map(ledger => ({
      id: ledger.id,
      date: ledger.date,
      transactionDate: ledger.date, // 호환성을 위해 추가
      amount: ledger.amount,
      description: ledger.description,
      memo: ledger.memo,
      amountType: ledger.amountType,
      spender: ledger.spender,
      memberId: ledger.memberId || 0,
      bookId: ledger.bookId || params.bookId,
      categoryId: ledger.categoryId || 0,
      paymentId: ledger.paymentId || 0,
    }));

    console.log('매핑된 ledgers:', mappedLedgers);
    return mappedLedgers;
  }

  // Category endpoints
  async updateCategory(categoryId: number, data: CreateCategoryRequest, token: string): Promise<Category> {
    const response = await this.axiosInstance.put<{ id: number; category: string }>(`/category/${categoryId}`, data);
    
    return {
      id: response.data.id,
      category: response.data.category,
    };
  }

  async deleteCategory(categoryId: number, token: string): Promise<void> {
    await this.axiosInstance.delete(`/category/${categoryId}`);
  }

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

  async updateCategoryForBook(bookId: number, categoryId: number, data: CreateCategoryRequest, token: string): Promise<Category> {
    const response = await this.axiosInstance.put<{ id: number; category: string }>(
      `/category/book/${bookId}/${categoryId}`,
      data
    );
    
    return {
      id: response.data.id,
      category: response.data.category,
    };
  }

  async deleteCategoryForBook(bookId: number, categoryId: number, token: string): Promise<void> {
    await this.axiosInstance.delete(`/category/book/${bookId}/${categoryId}`);
  }

  // Payment endpoints
  async updatePayment(paymentId: number, data: CreatePaymentRequest, token: string): Promise<PaymentMethod> {
    const response = await this.axiosInstance.put<{ id: number; payment: string }>(`/payment/${paymentId}`, data);
    
    return {
      id: response.data.id,
      payment: response.data.payment,
    };
  }

  async deletePayment(paymentId: number, token: string): Promise<void> {
    await this.axiosInstance.delete(`/payment/${paymentId}`);
  }

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

  async updatePaymentForBook(bookId: number, paymentId: number, data: CreatePaymentRequest, token: string): Promise<PaymentMethod> {
    const response = await this.axiosInstance.put<{ id: number; payment: string }>(
      `/payment/book/${bookId}/${paymentId}`,
      data
    );
    
    return {
      id: response.data.id,
      payment: response.data.payment,
    };
  }

  async deletePaymentForBook(bookId: number, paymentId: number, token: string): Promise<void> {
    await this.axiosInstance.delete(`/payment/book/${bookId}/${paymentId}`);
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
      
      console.log('=== 가계부 멤버 조회 디버깅 시작 ===');
      console.log('요청 URL:', `/book/${bookId}/owners`);
      console.log('응답 상태:', response.status);
      console.log('원본 응답:', JSON.stringify(response.data, null, 2));
      console.log('응답 타입:', typeof response.data);
      console.log('응답 키들:', Object.keys(response.data || {}));
      
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
        
        // 권한 정보를 더 정확하게 추출
        let role: 'OWNER' | 'EDITOR' | 'VIEWER' = 'VIEWER';
        const roleFields = ['bookRole', 'role', 'book_role', 'userRole', 'memberRole'];
        
        for (const field of roleFields) {
          if (ownerData[field]) {
            role = ownerData[field];
            console.log(`권한 필드 '${field}'에서 발견: ${role} (memberId: ${ownerData.memberId || ownerData.member_id || ownerData.id})`);
            break;
          }
        }
        
        if (!roleFields.some(field => ownerData[field])) {
          console.warn('권한 정보를 찾을 수 없음. 사용 가능한 필드들:', Object.keys(ownerData));
          console.warn('전체 데이터:', ownerData);
        }
        
        const result = {
          memberId: ownerData.memberId || ownerData.member_id || ownerData.id || index,
          username: ownerData.username || ownerData.name || `사용자${index + 1}`,
          email: ownerData.email || '이메일 없음',
          role: role,
        };
        
        console.log(`최종 멤버 데이터:`, result);
        return result;
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

  // 예산 관련 API 메서드들
  async createBudget(bookId: number, data: BudgetRequest, token: string): Promise<Budget> {
    try {
      const response = await this.axiosInstance.post(`/budgets/books/${bookId}`, data);
      return response.data;
    } catch (error) {
      console.error('예산 생성 실패:', error);
      throw error;
    }
  }

  async updateBudget(bookId: number, budgetMonth: string, data: BudgetRequest, token: string): Promise<Budget> {
    try {
      const response = await this.axiosInstance.put(`/budgets/books/${bookId}/months/${budgetMonth}`, data);
      return response.data;
    } catch (error) {
      console.error('예산 수정 실패:', error);
      throw error;
    }
  }

  async deleteBudget(bookId: number, budgetMonth: string, token: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/budgets/books/${bookId}/months/${budgetMonth}`);
    } catch (error) {
      console.error('예산 삭제 실패:', error);
      throw error;
    }
  }

  async getBudgetsByBook(bookId: number, token: string): Promise<Budget[]> {
    try {
      const response = await this.axiosInstance.get(`/budgets/books/${bookId}`);
      return response.data;
    } catch (error) {
      console.error('예산 목록 조회 실패:', error);
      throw error;
    }
  }

  async getBudgetByMonth(bookId: number, budgetMonth: string, token: string): Promise<Budget> {
    try {
      const response = await this.axiosInstance.get(`/budgets/books/${bookId}/months/${budgetMonth}`);
      return response.data;
    } catch (error) {
      console.error('예산 조회 실패:', error);
      throw error;
    }
  }

  async getBudgetSummary(bookId: number, budgetMonth: string, token: string): Promise<BudgetSummary> {
    try {
      const response = await this.axiosInstance.get(`/budgets/books/${bookId}/months/${budgetMonth}/summary`);
      return response.data;
    } catch (error) {
      console.error('예산 요약 조회 실패:', error);
      throw error;
    }
  }

  async getBudgetsByYear(bookId: number, year: string, token: string): Promise<Budget[]> {
    try {
      const response = await this.axiosInstance.get(`/budgets/books/${bookId}/years/${year}`);
      return response.data;
    } catch (error) {
      console.error('연도별 예산 조회 실패:', error);
      throw error;
    }
  }

  // FCM 토큰 관련 API
  async registerFCMToken(tokenData: FCMTokenRequest): Promise<FCMTokenResponse> {
    try {
      console.log('Sending FCM token to server:', JSON.stringify(tokenData, null, 2));
      const response = await this.axiosInstance.post('/notifications/token', tokenData);
      console.log('FCM token registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('FCM 토큰 등록 실패:', error);
      throw error;
    }
  }

  async deleteFCMToken(deviceId: string): Promise<FCMTokenResponse> {
    try {
      const response = await this.axiosInstance.delete(`/notifications/token/${deviceId}`);
      return response.data;
    } catch (error) {
      console.error('FCM 토큰 삭제 실패:', error);
      throw error;
    }
  }

  async sendTestNotification(data?: { message?: string; token?: string }): Promise<FCMTokenResponse> {
    try {
      const response = await this.axiosInstance.post('/notifications/send/test', data || {});
      return response.data;
    } catch (error) {
      console.error('테스트 알림 전송 실패:', error);
      throw error;
    }
  }

  async getRecentBudgets(bookId: number, limit: number, token: string): Promise<Budget[]> {
    try {
      const response = await this.axiosInstance.get(`/budgets/books/${bookId}/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('최근 예산 조회 실패:', error);
      throw error;
    }
  }

  // 자산 타입 조회
  async getAssetTypes(token: string): Promise<AssetType[]> {
    try {
      const response = await this.axiosInstance.get('/assets/types');
      return response.data.assetTypes || [];
    } catch (error) {
      console.error('자산 타입 조회 실패:', error);
      return [];
    }
  }

  // 자산 관련 API 메서드들
  async createAsset(bookId: number, data: CreateAssetRequest, token: string): Promise<Asset> {
    try {
      const response = await this.axiosInstance.post(`/assets/books/${bookId}`, data);
      return response.data;
    } catch (error) {
      console.error('자산 생성 실패:', error);
      throw error;
    }
  }

  async updateAsset(assetId: number, data: UpdateAssetRequest, token: string): Promise<Asset> {
    try {
      const response = await this.axiosInstance.put(`/assets/${assetId}`, data);
      return response.data;
    } catch (error) {
      console.error('자산 수정 실패:', error);
      throw error;
    }
  }

  async deleteAsset(assetId: number, token: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/assets/${assetId}`);
    } catch (error) {
      console.error('자산 삭제 실패:', error);
      throw error;
    }
  }

  async getAssetsByBook(bookId: number, token: string): Promise<Asset[]> {
    try {
      const response = await this.axiosInstance.get(`/assets/books/${bookId}`);
      return response.data.assets || [];
    } catch (error) {
      console.error('자산 목록 조회 실패:', error);
      return [];
    }
  }

  async getAssetById(assetId: number, token: string): Promise<Asset> {
    try {
      const response = await this.axiosInstance.get(`/assets/${assetId}`);
      return response.data;
    } catch (error) {
      console.error('자산 상세 조회 실패:', error);
      throw error;
    }
  }

  async getAssetsByType(bookId: number, assetType: string, token: string): Promise<Asset[]> {
    try {
      const response = await this.axiosInstance.get(`/assets/books/${bookId}/type/${assetType}`);
      return response.data.assets || [];
    } catch (error) {
      console.error('자산 타입별 조회 실패:', error);
      return [];
    }
  }

  async updateAssetBalance(assetId: number, amount: number, operation: 'ADD' | 'SUBTRACT', token: string): Promise<Asset> {
    try {
      const response = await this.axiosInstance.patch(`/assets/${assetId}/balance`, {
        amount,
        operation
      });
      return response.data;
    } catch (error) {
      console.error('자산 잔액 업데이트 실패:', error);
      throw error;
    }
  }

  // 이체 생성 API
  async createTransfer(data: CreateTransferRequest, token: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/ledger/transfers', data);
      return response.data;
    } catch (error) {
      console.error('이체 생성 실패:', error);
      throw error;
    }
  }

  // 동기화를 위한 public post 메서드
  async post(url: string, data: any): Promise<any> {
    return this.axiosInstance.post(url, data);
  }

  // === 친구 관련 API ===
  
  // 친구 목록 조회
  async getFriends(): Promise<{ friends: Friend[], totalElements: number }> {
    try {
      const response = await this.axiosInstance.get('/friends');
      return response.data;
    } catch (error) {
      console.error('친구 목록 조회 실패:', error);
      throw error;
    }
  }

  // 친구 요청 보내기
  async sendFriendRequest(data: SendFriendRequestRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/friends/request', data);
      return response.data;
    } catch (error) {
      console.error('친구 요청 전송 실패:', error);
      throw error;
    }
  }

  // 친구 요청 수락
  async acceptFriendRequest(friendshipId: number, data: AcceptFriendRequestRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/friends/accept/${friendshipId}`, data);
      return response.data;
    } catch (error) {
      console.error('친구 요청 수락 실패:', error);
      throw error;
    }
  }

  // 친구 요청 거절
  async rejectFriendRequest(friendshipId: number): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/friends/reject/${friendshipId}`);
      return response.data;
    } catch (error) {
      console.error('친구 요청 거절 실패:', error);
      throw error;
    }
  }

  // 친구 삭제
  async deleteFriend(friendshipId: number): Promise<any> {
    try {
      const response = await this.axiosInstance.delete(`/friends/${friendshipId}`);
      return response.data;
    } catch (error) {
      console.error('친구 삭제 실패:', error);
      throw error;
    }
  }

  // 친구 별칭 설정
  async setFriendAlias(friendshipId: number, data: SetFriendAliasRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.put(`/friends/${friendshipId}/alias`, data);
      return response.data;
    } catch (error) {
      console.error('친구 별칭 설정 실패:', error);
      throw error;
    }
  }

  // 받은 친구 요청 목록 조회
  async getReceivedFriendRequests(): Promise<{ requests: FriendRequest[], totalElements: number }> {
    try {
      const response = await this.axiosInstance.get('/friends/requests/received');
      return response.data;
    } catch (error) {
      console.error('받은 친구 요청 조회 실패:', error);
      throw error;
    }
  }

  // 보낸 친구 요청 목록 조회
  async getSentFriendRequests(): Promise<{ requests: FriendRequest[], totalElements: number }> {
    try {
      const response = await this.axiosInstance.get('/friends/requests/sent');
      return response.data;
    } catch (error) {
      console.error('보낸 친구 요청 조회 실패:', error);
      throw error;
    }
  }

  // 친구 상태 조회
  async getFriendStatus(): Promise<{ friendCount: number, pendingRequestCount: number }> {
    try {
      const response = await this.axiosInstance.get('/friends/status');
      return response.data;
    } catch (error) {
      console.error('친구 상태 조회 실패:', error);
      throw error;
    }
  }

  // 친구 검색
  async searchFriends(username: string): Promise<{ friends: Friend[], totalElements: number }> {
    try {
      const response = await this.axiosInstance.get(`/friends/search?username=${username}`);
      return response.data;
    } catch (error) {
      console.error('친구 검색 실패:', error);
      throw error;
    }
  }

  // === 친구 그룹 관련 API ===

  // 친구 그룹 목록 조회
  async getFriendGroups(): Promise<{ groups: FriendGroup[], totalElements: number }> {
    try {
      const response = await this.axiosInstance.get('/friend-groups');
      return response.data;
    } catch (error) {
      console.error('친구 그룹 조회 실패:', error);
      throw error;
    }
  }

  // 친구 그룹 생성
  async createFriendGroup(data: CreateFriendGroupRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/friend-groups', data);
      return response.data;
    } catch (error) {
      console.error('친구 그룹 생성 실패:', error);
      throw error;
    }
  }

  // 친구 그룹 수정
  async updateFriendGroup(groupId: number, data: CreateFriendGroupRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.put(`/friend-groups/${groupId}`, data);
      return response.data;
    } catch (error) {
      console.error('친구 그룹 수정 실패:', error);
      throw error;
    }
  }

  // 친구 그룹 삭제
  async deleteFriendGroup(groupId: number): Promise<any> {
    try {
      const response = await this.axiosInstance.delete(`/friend-groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('친구 그룹 삭제 실패:', error);
      throw error;
    }
  }

  // 친구 그룹에 친구 추가
  async addFriendToGroup(groupId: number, friendshipId: number): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/friend-groups/${groupId}/members/${friendshipId}`);
      return response.data;
    } catch (error) {
      console.error('그룹에 친구 추가 실패:', error);
      throw error;
    }
  }

  // 친구 그룹에서 친구 제거
  async removeFriendFromGroup(groupId: number, friendshipId: number): Promise<any> {
    try {
      const response = await this.axiosInstance.delete(`/friend-groups/${groupId}/members/${friendshipId}`);
      return response.data;
    } catch (error) {
      console.error('그룹에서 친구 제거 실패:', error);
      throw error;
    }
  }

  // === 메시지 관련 API ===

  // 메시지 전송
  async sendMessage(data: SendMessageRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/messages', data);
      return response.data;
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      throw error;
    }
  }

  // 대화 내역 조회
  async getConversation(friendshipId: number): Promise<{ messages: Message[], totalElements: number }> {
    try {
      const response = await this.axiosInstance.get(`/messages/conversation/${friendshipId}`);
      return response.data;
    } catch (error) {
      console.error('대화 내역 조회 실패:', error);
      throw error;
    }
  }

  // 메시지 읽음 처리
  async markMessageAsRead(messageId: number): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error('메시지 읽음 처리 실패:', error);
      throw error;
    }
  }

  // === 댓글 관련 API ===

  // 가계부 댓글 작성
  async createBookComment(bookId: number, data: CreateCommentRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/comments/book/${bookId}`, data);
      return response.data;
    } catch (error) {
      console.error('가계부 댓글 작성 실패:', error);
      throw error;
    }
  }

  // 가계부 내역 댓글 작성
  async createLedgerComment(ledgerId: number, data: CreateCommentRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/comments/ledger/${ledgerId}`, data);
      return response.data;
    } catch (error) {
      console.error('가계부 내역 댓글 작성 실패:', error);
      throw error;
    }
  }

  // 가계부 메모 조회
  async getBookMemo(bookId: number): Promise<Memo> {
    try {
      const response = await this.axiosInstance.get(`/memos/book/${bookId}`);
      return response.data;
    } catch (error) {
      console.error('가계부 메모 조회 실패:', error);
      throw error;
    }
  }
  
  // 가계부 메모 생성/수정
  async createOrUpdateBookMemo(bookId: number, request: CreateMemoRequest): Promise<Memo> {
    try {
      const response = await this.axiosInstance.post(`/memos/book/${bookId}`, request);
      return response.data;
    } catch (error) {
      console.error('가계부 메모 생성/수정 실패:', error);
      throw error;
    }
  }
  
  // 가계부 메모 삭제
  async deleteBookMemo(bookId: number): Promise<void> {
    try {
      await this.axiosInstance.delete(`/memos/book/${bookId}`);
    } catch (error) {
      console.error('가계부 메모 삭제 실패:', error);
      throw error;
    }
  }

  // 가계부 내역 댓글 목록 조회
  async getLedgerComments(ledgerId: number): Promise<{ comments: Comment[], totalElements: number }> {
    try {
      const response = await this.axiosInstance.get(`/comments/ledger/${ledgerId}`);
      return response.data;
    } catch (error) {
      console.error('가계부 내역 댓글 조회 실패:', error);
      throw error;
    }
  }

  // 댓글 삭제
  async deleteComment(commentId: number): Promise<any> {
    try {
      const response = await this.axiosInstance.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      throw error;
    }
  }

  // 모바일 OAuth 로그인
  async mobileOAuthLogin(data: { provider: string; accessToken: string; idToken?: string }): Promise<{ user: Member; accessToken: string; refreshToken?: string }> {
    try {
      const response = await this.axiosInstance.post('/mobile-oauth/login', data);
      return response.data;
    } catch (error) {
      console.error('모바일 OAuth 로그인 실패:', error);
      throw error;
    }
  }

  // === 반복거래 관련 API ===

  // 반복거래 목록 조회
  async getRecurringTransactions(bookId: number, active?: boolean): Promise<RecurringTransaction[]> {
    try {
      const response = await this.axiosInstance.get(`/recurring-transactions/books/${bookId}`, {
        params: { active }
      });
      return response.data;
    } catch (error) {
      console.error('반복거래 목록 조회 실패:', error);
      throw error;
    }
  }

  // 반복거래 생성
  async createRecurringTransaction(bookId: number, data: CreateRecurringTransactionRequest): Promise<RecurringTransaction> {
    try {
      const response = await this.axiosInstance.post(`/recurring-transactions/books/${bookId}`, data);
      return response.data;
    } catch (error) {
      console.error('반복거래 생성 실패:', error);
      throw error;
    }
  }

  // 반복거래 수정
  async updateRecurringTransaction(id: number, data: UpdateRecurringTransactionRequest): Promise<RecurringTransaction> {
    try {
      const response = await this.axiosInstance.put(`/recurring-transactions/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('반복거래 수정 실패:', error);
      throw error;
    }
  }

  // 반복거래 삭제
  async deleteRecurringTransaction(id: number): Promise<void> {
    try {
      await this.axiosInstance.delete(`/recurring-transactions/${id}`);
    } catch (error) {
      console.error('반복거래 삭제 실패:', error);
      throw error;
    }
  }

  // 반복거래 활성/비활성 토글
  async toggleRecurringTransaction(id: number): Promise<RecurringTransaction> {
    try {
      const response = await this.axiosInstance.patch(`/recurring-transactions/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error('반복거래 활성화 토글 실패:', error);
      throw error;
    }
  }

  // === 통화 관련 API ===
  
  // 통화 목록 조회
  async getCurrencies(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/currencies');
      return response.data;
    } catch (error) {
      console.error('통화 목록 조회 실패:', error);
      throw error;
    }
  }

  // 가계부 통화 설정 조회
  async getBookCurrencySettings(bookId: number): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/currencies/books/${bookId}/currency`);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        // 설정이 없는 경우 기본값 반환
        return { defaultCurrencyCode: 'KRW', enableMultiCurrency: false };
      }
      console.error('가계부 통화 설정 조회 실패:', error);
      throw error;
    }
  }

  // 사용자 통화 설정 업데이트
  async updateUserCurrencySettings(settings: any): Promise<any> {
    try {
      const response = await this.axiosInstance.put('/currencies/settings', settings);
      return response.data;
    } catch (error) {
      console.error('사용자 통화 설정 업데이트 실패:', error);
      throw error;
    }
  }

  // === 태그 관련 API ===
  
  // 가계부별 태그 목록 조회
  async getTagsByBook(bookId: number): Promise<any[]> {
    try {
      const url = `/tags/books/${bookId}`;
      console.log('태그 API 호출:', url);
      console.log('Base URL:', this.axiosInstance.defaults.baseURL);
      const response = await this.axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('태그 목록 조회 실패:', error);
      throw error;
    }
  }

  // 태그 생성
  async createTag(bookId: number, data: { name: string; color?: string }): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/tags/books/${bookId}`, data);
      return response.data;
    } catch (error) {
      console.error('태그 생성 실패:', error);
      throw error;
    }
  }

  // 태그 수정
  async updateTag(tagId: number, data: { name?: string; color?: string }): Promise<any> {
    try {
      const response = await this.axiosInstance.put(`/tags/${tagId}`, data);
      return response.data;
    } catch (error) {
      console.error('태그 수정 실패:', error);
      throw error;
    }
  }

  // 태그 삭제
  async deleteTag(tagId: number): Promise<void> {
    try {
      await this.axiosInstance.delete(`/tags/${tagId}`);
    } catch (error) {
      console.error('태그 삭제 실패:', error);
      throw error;
    }
  }

  // === 반복거래 관련 API ===
  
  // 반복거래 목록 조회
  async getRecurringTransactions(bookId: number, activeOnly?: boolean): Promise<RecurringTransaction[]> {
    try {
      const params = activeOnly !== undefined ? { active: activeOnly } : {};
      const url = `/recurring-transactions/books/${bookId}`;
      console.log('반복거래 API 호출:', url);
      console.log('Base URL:', this.axiosInstance.defaults.baseURL);
      const response = await this.axiosInstance.get(url, { params });
      return response.data;
    } catch (error) {
      console.error('반복거래 목록 조회 실패:', error);
      throw error;
    }
  }

  // 반복거래 상세 조회
  async getRecurringTransaction(recurringId: number): Promise<RecurringTransaction> {
    try {
      const response = await this.axiosInstance.get(`/recurring-transactions/${recurringId}`);
      return response.data;
    } catch (error) {
      console.error('반복거래 상세 조회 실패:', error);
      throw error;
    }
  }

  // 반복거래 생성
  async createRecurringTransaction(bookId: number, data: CreateRecurringTransactionRequest): Promise<RecurringTransaction> {
    try {
      const response = await this.axiosInstance.post(`/recurring-transactions/books/${bookId}`, data);
      return response.data;
    } catch (error) {
      console.error('반복거래 생성 실패:', error);
      throw error;
    }
  }

  // 반복거래 수정
  async updateRecurringTransaction(recurringId: number, data: UpdateRecurringTransactionRequest): Promise<RecurringTransaction> {
    try {
      const response = await this.axiosInstance.put(`/recurring-transactions/${recurringId}`, data);
      return response.data;
    } catch (error) {
      console.error('반복거래 수정 실패:', error);
      throw error;
    }
  }

  // 반복거래 삭제
  async deleteRecurringTransaction(recurringId: number): Promise<void> {
    try {
      await this.axiosInstance.delete(`/recurring-transactions/${recurringId}`);
    } catch (error) {
      console.error('반복거래 삭제 실패:', error);
      throw error;
    }
  }

  // 반복거래 일시 중지
  async pauseRecurringTransaction(recurringId: number): Promise<void> {
    try {
      await this.axiosInstance.post(`/recurring-transactions/${recurringId}/pause`);
    } catch (error) {
      console.error('반복거래 일시 중지 실패:', error);
      throw error;
    }
  }

  // 반복거래 재개
  async resumeRecurringTransaction(recurringId: number): Promise<void> {
    try {
      await this.axiosInstance.post(`/recurring-transactions/${recurringId}/resume`);
    } catch (error) {
      console.error('반복거래 재개 실패:', error);
      throw error;
    }
  }

  // 반복거래 수동 실행
  async executeRecurringTransaction(recurringId: number): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/recurring-transactions/${recurringId}/execute`);
      return response.data;
    } catch (error) {
      console.error('반복거래 실행 실패:', error);
      throw error;
    }
  }

  // 예정된 반복거래 조회
  async getUpcomingTransactions(bookId: number, days?: number): Promise<UpcomingTransaction[]> {
    try {
      const params = days ? { days } : {};
      const response = await this.axiosInstance.get(`/recurring-transactions/books/${bookId}/upcoming`, { params });
      return response.data;
    } catch (error) {
      console.error('예정된 반복거래 조회 실패:', error);
      throw error;
    }
  }

  // === 알림 설정 관련 API ===
  
  // 알림 설정 조회
  async getNotificationPreferences(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/notifications/preferences');
      return response.data;
    } catch (error) {
      console.error('알림 설정 조회 실패:', error);
      throw error;
    }
  }

  // 알림 설정 업데이트
  async updateNotificationPreferences(preferences: any): Promise<any> {
    try {
      const response = await this.axiosInstance.put('/notifications/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('알림 설정 업데이트 실패:', error);
      throw error;
    }
  }

  // 알림 히스토리 조회
  async getNotificationHistory(page?: number, size?: number): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/notifications/history', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error('알림 히스토리 조회 실패:', error);
      throw error;
    }
  }

  // 알림 읽음 처리
  async markNotificationAsRead(notificationId: number): Promise<void> {
    try {
      await this.axiosInstance.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
      throw error;
    }
  }

  // 모든 알림 읽음 처리
  async markAllNotificationsAsRead(): Promise<void> {
    try {
      await this.axiosInstance.put('/notifications/read-all');
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
      throw error;
    }
  }

}

// API 서비스 인스턴스 생성 - 실제 서버 API만 사용
const apiService = new ApiService(config.API_BASE_URL);

export default apiService;
export { ApiService };
export type {
  Asset, AssetType, Book, BookMember, Budget, BudgetRequest, BudgetSummary, Category, ChangeRoleRequest,
  ChangeRoleResponse, CreateAssetRequest, CreateBookRequest, CreateCategoryRequest, CreateLedgerRequest, CreatePaymentRequest, CreateTransferRequest, GetLedgerListRequest, InviteUserRequest,
  InviteUserResponse, LeaveBookResponse, Ledger, LoginRequest,
  LoginResponse, Member, OAuthRequest,
  OAuthResponse, PaymentMethod, RemoveMemberResponse, SearchLedgerRequest, SignupRequest,
  SignupResponse, UpdateAssetRequest, UserBook
};

