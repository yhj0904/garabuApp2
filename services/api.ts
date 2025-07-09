// API 기본 설정
const API_BASE_URL = 'http://localhost:8080'; // 실제 API 서버 URL
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
    const url = `${this.baseURL}${endpoint}`;
    
    // 기본 헤더 설정
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // JWT 토큰이 있으면 헤더에 추가
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

  // 인증 관련 API
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(userData: SignupRequest): Promise<SignupResponse> {
    return this.request<SignupResponse>('/api/v2/join', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async oauthLogin(oauthData: OAuthRequest): Promise<OAuthResponse> {
    return this.request<OAuthResponse>('/api/v2/oauth/login', {
      method: 'POST',
      body: JSON.stringify(oauthData),
    });
  }

  async getProfile(token: string): Promise<{ user: Member }> {
    return this.request<{ user: Member }>('/api/v2/profile', {}, token);
  }

  async logout(token: string): Promise<void> {
    return this.request<void>('/api/v2/logout', {
      method: 'POST',
    }, token);
  }

  // 회원 관리 API
  async getMembers(token: string): Promise<Member[]> {
    return this.request<Member[]>('/api/v2/members', {}, token);
  }

  // 가계부 관리 API
  async createBook(data: CreateBookRequest, token: string): Promise<Book> {
    return this.request<Book>('/api/v2/book', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async getMyBooks(token: string): Promise<Book[]> {
    return this.request<Book[]>('/api/v2/book/mybooks', {}, token);
  }

  async getBookOwners(bookId: number, token: string): Promise<Member[]> {
    return this.request<Member[]>(`/api/v2/book/${bookId}/owners`, {}, token);
  }

  // 가계부 기록 관리 API
  async createLedger(data: CreateLedgerRequest, token: string): Promise<Ledger> {
    return this.request<Ledger>('/api/v2/ledger', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async getLedgerList(params: GetLedgerListRequest, token: string): Promise<Ledger[]> {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.amountType) queryParams.append('amountType', params.amountType);
    if (params.category) queryParams.append('category', params.category);
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/api/v2/ledger/list${queryString ? `?${queryString}` : ''}`;
    
    return this.request<Ledger[]>(endpoint, {}, token);
  }

  // 카테고리 관리 API
  async createCategory(data: CreateCategoryRequest, token: string): Promise<Category> {
    return this.request<Category>('/api/v2/category', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async getCategoryList(token: string): Promise<Category[]> {
    return this.request<Category[]>('/api/v2/category/list', {}, token);
  }

  // 결제 수단 관리 API
  async createPayment(data: CreatePaymentRequest, token: string): Promise<PaymentMethod> {
    return this.request<PaymentMethod>('/api/v2/payment', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async getPaymentList(token: string): Promise<PaymentMethod[]> {
    return this.request<PaymentMethod[]>('/api/v2/payment/list', {}, token);
  }

  // 가계부 공유 관련 API
  async inviteUser(bookId: number, data: InviteUserRequest, token: string): Promise<InviteUserResponse> {
    return this.request<InviteUserResponse>(`/api/v2/book/${bookId}/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async removeMember(bookId: number, memberId: number, token: string): Promise<RemoveMemberResponse> {
    return this.request<RemoveMemberResponse>(`/api/v2/book/${bookId}/members/${memberId}`, {
      method: 'DELETE',
    }, token);
  }

  async changeRole(bookId: number, memberId: number, data: ChangeRoleRequest, token: string): Promise<ChangeRoleResponse> {
    return this.request<ChangeRoleResponse>(`/api/v2/book/${bookId}/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  }

  async leaveBook(bookId: number, token: string): Promise<LeaveBookResponse> {
    return this.request<LeaveBookResponse>(`/api/v2/book/${bookId}/leave`, {
      method: 'POST',
    }, token);
  }

  async getBookMembersWithRoles(bookId: number, token: string): Promise<BookMember[]> {
    const owners = await this.getBookOwners(bookId, token);
    // TODO: 실제 API에서 role 정보를 포함한 멤버 목록을 받아와야 함
    return owners.map(owner => ({
      memberId: owner.id,
      username: owner.username,
      email: owner.email,
      role: 'OWNER' as const // 임시로 OWNER 설정, 실제로는 API에서 받아와야 함
    }));
  }
}

// API 서비스 인스턴스 생성
export const apiService = new ApiService(API_BASE_URL);

// 개발용 Mock API (실제 API가 없을 때 사용)
export class MockApiService {
  private mockData = {
    books: [
      { id: 1, title: '가족 가계부', ownerId: 1, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
      { id: 2, title: '개인 가계부', ownerId: 1, createdAt: '2025-01-01', updatedAt: '2025-01-01' }
    ],
    categories: [
      { id: 1, category: '식비' },
      { id: 2, category: '교통비' },
      { id: 3, category: '급여' },
      { id: 4, category: '용돈' }
    ],
    payments: [
      { id: 1, payment: '현금' },
      { id: 2, payment: '카드' },
      { id: 3, payment: '이체' }
    ],
    ledgers: [
      {
        id: 1,
        date: '2025-01-08',
        amount: 3000000,
        description: '7월 월급',
        memo: '세후 지급액',
        amountType: 'INCOME' as const,
        spender: '회사',
        memberId: 1,
        bookId: 1,
        categoryId: 3,
        paymentId: 3
      },
      {
        id: 2,
        date: '2025-01-08',
        amount: 50000,
        description: '점심 식대',
        memo: '회사 근처 식당',
        amountType: 'EXPENSE' as const,
        spender: '홍길동',
        memberId: 1,
        bookId: 1,
        categoryId: 1,
        paymentId: 2
      }
    ]
  };

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === 'test@example.com' && credentials.password === 'password') {
      return {
        user: {
          id: 1,
          username: '테스트 사용자',
          email: credentials.email,
          name: '홍길동',
          role: 'USER',
          providerId: undefined
        },
        token: 'mock-jwt-token-' + Date.now(),
      };
    }
    
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  async signup(userData: SignupRequest): Promise<SignupResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      user: {
        id: Date.now(),
        username: userData.username,
        email: userData.email,
        name: userData.name,
        role: 'USER',
        providerId: undefined
      },
      token: 'mock-jwt-token-' + Date.now(),
    };
  }

  async oauthLogin(oauthData: OAuthRequest): Promise<OAuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      user: {
        id: Date.now(),
        username: `${oauthData.provider} 사용자`,
        email: `user@${oauthData.provider}.com`,
        name: `${oauthData.provider} 사용자`,
        role: 'USER',
        providerId: `${oauthData.provider}_123`
      },
      token: 'mock-jwt-token-' + Date.now(),
    };
  }

  async getProfile(token: string): Promise<{ user: Member }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      user: {
        id: 1,
        username: '테스트 사용자',
        email: 'test@example.com',
        name: '홍길동',
        role: 'USER',
        providerId: undefined
      },
    };
  }

  async logout(token: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async getMembers(token: string): Promise<Member[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: 1,
        username: '테스트 사용자',
        email: 'test@example.com',
        name: '홍길동',
        role: 'USER',
        providerId: undefined
      },
      {
        id: 2,
        username: '가족 사용자',
        email: 'family@example.com',
        name: '김철수',
        role: 'USER',
        providerId: undefined
      }
    ];
  }

  async createBook(data: CreateBookRequest, token: string): Promise<Book> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newBook = {
      id: Date.now(),
      title: data.title,
      ownerId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.mockData.books.push(newBook);
    return newBook;
  }

  async getMyBooks(token: string): Promise<Book[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockData.books;
  }

  async getBookOwners(bookId: number, token: string): Promise<Member[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: 1,
        username: '테스트 사용자',
        email: 'test@example.com',
        name: '홍길동',
        role: 'USER',
        providerId: undefined
      }
    ];
  }

  async createLedger(data: CreateLedgerRequest, token: string): Promise<Ledger> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newLedger = {
      id: Date.now(),
      date: data.date,
      amount: data.amount,
      description: data.description,
      memo: data.memo,
      amountType: data.amountType,
      spender: data.spender,
      memberId: 1,
      bookId: 1,
      categoryId: 1,
      paymentId: 1
    };
    
    this.mockData.ledgers.push(newLedger);
    return newLedger;
  }

  async getLedgerList(params: GetLedgerListRequest, token: string): Promise<Ledger[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredLedgers = this.mockData.ledgers;
    
    if (params.amountType) {
      filteredLedgers = filteredLedgers.filter(ledger => ledger.amountType === params.amountType);
    }
    
    if (params.startDate) {
      filteredLedgers = filteredLedgers.filter(ledger => ledger.date >= params.startDate!);
    }
    
    if (params.endDate) {
      filteredLedgers = filteredLedgers.filter(ledger => ledger.date <= params.endDate!);
    }
    
    return filteredLedgers.slice(0, params.size || 20);
  }

  async createCategory(data: CreateCategoryRequest, token: string): Promise<Category> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newCategory = {
      id: Date.now(),
      category: data.category
    };
    
    this.mockData.categories.push(newCategory);
    return newCategory;
  }

  async getCategoryList(token: string): Promise<Category[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockData.categories;
  }

  async createPayment(data: CreatePaymentRequest, token: string): Promise<PaymentMethod> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newPayment = {
      id: Date.now(),
      payment: data.payment
    };
    
    this.mockData.payments.push(newPayment);
    return newPayment;
  }

  async getPaymentList(token: string): Promise<PaymentMethod[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockData.payments;
  }

  // 가계부 공유 관련 Mock API
  async inviteUser(bookId: number, data: InviteUserRequest, token: string): Promise<InviteUserResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock: 사용자 초대 성공
    console.log('Mock: 사용자 초대 완료', { bookId, email: data.email, role: data.role });
    
    return {
      message: '사용자가 성공적으로 초대되었습니다.'
    };
  }

  async removeMember(bookId: number, memberId: number, token: string): Promise<RemoveMemberResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock: 멤버 제거 성공
    console.log('Mock: 멤버 제거 완료', { bookId, memberId });
    
    return {
      message: '멤버가 성공적으로 제거되었습니다.'
    };
  }

  async changeRole(bookId: number, memberId: number, data: ChangeRoleRequest, token: string): Promise<ChangeRoleResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock: 권한 변경 성공
    console.log('Mock: 권한 변경 완료', { bookId, memberId, newRole: data.role });
    
    return {
      message: '권한이 성공적으로 변경되었습니다.'
    };
  }

  async leaveBook(bookId: number, token: string): Promise<LeaveBookResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock: 가계부 나가기 성공
    console.log('Mock: 가계부 나가기 완료', { bookId });
    
    return {
      message: '가계부에서 성공적으로 나갔습니다.'
    };
  }

  async getBookMembersWithRoles(bookId: number, token: string): Promise<BookMember[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock: 가계부 멤버 목록 (역할 포함)
    const mockMembers: BookMember[] = [
      {
        memberId: 1,
        username: '홍길동',
        email: 'hong@example.com',
        role: 'OWNER'
      },
      {
        memberId: 2,
        username: '김철수',
        email: 'kim@example.com',
        role: 'EDITOR'
      },
      {
        memberId: 3,
        username: '이영희',
        email: 'lee@example.com',
        role: 'VIEWER'
      }
    ];
    
    return mockMembers;
  }
}

// 개발 환경에서는 Mock API 사용, 프로덕션에서는 실제 API 사용
// 실제 백엔드 API를 사용하려면 아래 라인을 주석 해제하고 위 라인을 주석 처리
export const api = new MockApiService();
// export const api = new ApiService(API_BASE_URL);

// 타입 export
export type {
  Member,
  Book,
  Ledger,
  Category,
  PaymentMethod,
  UserBook,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  OAuthRequest,
  OAuthResponse,
  CreateBookRequest,
  CreateLedgerRequest,
  GetLedgerListRequest,
  CreateCategoryRequest,
  CreatePaymentRequest,
  InviteUserRequest,
  InviteUserResponse,
  RemoveMemberResponse,
  ChangeRoleRequest,
  ChangeRoleResponse,
  LeaveBookResponse,
  BookMember
}; 