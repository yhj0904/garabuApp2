import {
  Book,
  BookMember,
  ChangeRoleRequest,
  CreateBookRequest,
  CreateLedgerRequest,
  GetLedgerListRequest,
  InviteUserRequest,
  Ledger,
  Member
} from '@/services/api';
import { create } from 'zustand';

interface BookState {
  books: Book[];
  currentBook: Book | null;
  ledgers: Ledger[];
  bookMembers: BookMember[];
  isLoading: boolean;
  
  // Actions
  setBooks: (books: Book[]) => void;
  setCurrentBook: (book: Book | null) => void;
  setLedgers: (ledgers: Ledger[]) => void;
  setBookMembers: (members: BookMember[]) => void;
  setLoading: (loading: boolean) => void;
  
  // API Actions
  fetchBooks: (token: string) => Promise<boolean>;
  createBook: (data: CreateBookRequest, token: string) => Promise<boolean>;
  fetchLedgers: (params: GetLedgerListRequest, token: string) => Promise<boolean>;
  createLedger: (data: CreateLedgerRequest, token: string) => Promise<boolean>;
  getBookOwners: (bookId: number, token: string) => Promise<Member[]>;
  
  // 공유 가계부 관련 Actions
  fetchBookMembers: (bookId: number, token: string) => Promise<boolean>;
  inviteUser: (bookId: number, data: InviteUserRequest, token: string) => Promise<boolean>;
  removeMember: (bookId: number, memberId: number, token: string) => Promise<boolean>;
  changeRole: (bookId: number, memberId: number, data: ChangeRoleRequest, token: string) => Promise<boolean>;
  leaveBook: (bookId: number, token: string) => Promise<boolean>;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  currentBook: null,
  ledgers: [],
  bookMembers: [],
  isLoading: false,

  setBooks: (books) => set({ books }),
  setCurrentBook: (book) => set({ currentBook: book }),
  setLedgers: (ledgers) => set({ ledgers }),
  setBookMembers: (members) => set({ bookMembers: members }),
  setLoading: (loading) => set({ isLoading: loading }),

  fetchBooks: async (token: string) => {
    console.log('가계부 목록 조회 시작');
    console.log('토큰:', token ? '존재함' : '없음');
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      const books = await apiService.getMyBooks(token);
      
      console.log('가계부 목록 조회 성공:', books);
      console.log('조회된 가계부 수:', books.length);
      
      set({ 
        books,
        currentBook: books.length > 0 ? books[0] : null,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('가계부 목록 조회 실패:', error);
      console.error('에러 상세:', error instanceof Error ? error.message : String(error));
      set({ isLoading: false });
      return false;
    }
  },

  createBook: async (data: CreateBookRequest, token: string) => {
    console.log('가계부 생성 시작:', data);
    console.log('토큰:', token ? '존재함' : '없음');
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      const newBook = await apiService.createBook(data, token);
      
      console.log('가계부 생성 성공:', newBook);
      
      // 가계부 생성 후 목록을 새로고침하여 최신 데이터 가져오기
      console.log('가계부 목록 새로고침 시작');
      const { fetchBooks } = get();
      const refreshSuccess = await fetchBooks(token);
      console.log('가계부 목록 새로고침 결과:', refreshSuccess ? '성공' : '실패');
      
      set({ isLoading: false });
      
      return true;
    } catch (error) {
      console.error('가계부 생성 실패:', error);
      console.error('에러 상세:', error instanceof Error ? error.message : String(error));
      set({ isLoading: false });
      return false;
    }
  },

  fetchLedgers: async (params: GetLedgerListRequest, token: string) => {
    console.log('가계부 기록 조회 시작:', params);
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      const ledgers = await apiService.getLedgerList(params, token);
      
      console.log('가계부 기록 조회 성공:', ledgers);
      
      set({ 
        ledgers,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('가계부 기록 조회 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  createLedger: async (data: CreateLedgerRequest, token: string) => {
    console.log('가계부 기록 생성 시작:', data);
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      const newLedger = await apiService.createLedger(data, token);
      
      console.log('가계부 기록 생성 성공:', newLedger);
      
      const { ledgers } = get();
      const updatedLedgers = [newLedger, ...ledgers];
      
      set({ 
        ledgers: updatedLedgers,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('가계부 기록 생성 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  getBookOwners: async (bookId: number, token: string) => {
    console.log('가계부 소유자 조회 시작:', bookId);
    
    try {
      const apiService = (await import('@/services/api')).default;
      const owners = await apiService.getBookOwners(bookId, token);
      
      console.log('가계부 소유자 조회 성공:', owners);
      
      return owners;
    } catch (error) {
      console.error('가계부 소유자 조회 실패:', error);
      return [];
    }
  },

  // 공유 가계부 관련 Actions
  fetchBookMembers: async (bookId: number, token: string) => {
    console.log('가계부 멤버 조회 시작:', bookId);
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      const members = await apiService.getBookMembersWithRoles(bookId, token);
      
      console.log('가계부 멤버 조회 성공:', members);
      
      set({ 
        bookMembers: members,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('가계부 멤버 조회 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  inviteUser: async (bookId: number, data: InviteUserRequest, token: string) => {
    console.log('사용자 초대 시작:', { bookId, data });
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      await apiService.inviteUser(bookId, data, token);
      
      console.log('사용자 초대 성공');
      
      // 멤버 목록 새로고침
      const { fetchBookMembers } = get();
      await fetchBookMembers(bookId, token);
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('사용자 초대 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  removeMember: async (bookId: number, memberId: number, token: string) => {
    console.log('멤버 제거 시작:', { bookId, memberId });
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      await apiService.removeMember(bookId, memberId, token);
      
      console.log('멤버 제거 성공');
      
      // 멤버 목록에서 해당 멤버 제거
      const { bookMembers } = get();
      const updatedMembers = bookMembers.filter(member => member.memberId !== memberId);
      
      set({ 
        bookMembers: updatedMembers,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('멤버 제거 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  changeRole: async (bookId: number, memberId: number, data: ChangeRoleRequest, token: string) => {
    console.log('권한 변경 시작:', { bookId, memberId, data });
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      await apiService.changeRole(bookId, memberId, data, token);
      
      console.log('권한 변경 성공');
      
      // 멤버 목록에서 해당 멤버의 권한 업데이트
      const { bookMembers } = get();
      const updatedMembers = bookMembers.map(member => 
        member.memberId === memberId 
          ? { ...member, role: data.role }
          : member
      );
      
      set({ 
        bookMembers: updatedMembers,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('권한 변경 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  leaveBook: async (bookId: number, token: string) => {
    console.log('가계부 나가기 시작:', bookId);
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      await apiService.leaveBook(bookId, token);
      
      console.log('가계부 나가기 성공');
      
      // 가계부 목록 새로고침
      const { fetchBooks } = get();
      await fetchBooks(token);
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('가계부 나가기 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },
}));