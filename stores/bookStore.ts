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
} from '@/core/api/client';
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
  
  // Helper methods
  getOwnedBooksCount: () => number;
  
  // API Actions
  fetchBooks: (token: string) => Promise<boolean>;
  createBook: (data: CreateBookRequest, token: string) => Promise<boolean>;
  updateBook: (bookId: number, data: { title: string }, token: string) => Promise<boolean>;
  deleteBook: (bookId: number, token: string) => Promise<boolean>;
  fetchLedgers: (params: GetLedgerListRequest, token: string) => Promise<boolean>;
  createLedger: (data: CreateLedgerRequest, token: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateLedger: (ledgerId: number, data: CreateLedgerRequest, token: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  deleteLedger: (ledgerId: number, token: string) => Promise<{ success: boolean; error?: string; message?: string }>;
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
  
  // Helper methods
  getOwnedBooksCount: () => {
    const { books } = get();
    return books.filter(book => book.role === 'OWNER').length;
  },

  fetchBooks: async (token: string) => {
    console.log('가계부 목록 조회 시작');
    console.log('토큰:', token ? '존재함' : '없음');
    set({ isLoading: true });
    
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        const apiService = (await import('@/core/api/client')).default;
        const books = await apiService.getMyBooks(token);
        
        console.log('가계부 목록 조회 성공:', books);
        console.log('조회된 가계부 수:', books.length);
        
        // 현재 선택된 가계부가 없거나, 목록에 없는 경우에만 첫 번째 가계부 선택
        const { currentBook } = get();
        let newCurrentBook = currentBook;
        
        if (!currentBook || !books.find(b => b.id === currentBook.id)) {
          newCurrentBook = books.length > 0 ? books[0] : null;
          console.log('새로운 currentBook 설정:', newCurrentBook);
        } else {
          console.log('기존 currentBook 유지:', currentBook);
        }
        
        set({ 
          books,
          currentBook: newCurrentBook,
          isLoading: false 
        });
        
        return true;
      } catch (error: any) {
        console.error(`가계부 목록 조회 실패 (시도 ${retryCount + 1}/${maxRetries + 1}):`, error);
        console.error('에러 상세:', error instanceof Error ? error.message : String(error));
        
        // 인증 실패 처리
        if (error.message === 'AUTH_FAILED') {
          console.log('인증 실패 - 로그인 필요');
          // authStore를 가져와서 로그아웃 처리
          const authStore = (await import('@/stores/authStore')).useAuthStore.getState();
          await authStore.logout();
          // 로그인 화면으로 이동은 AuthNavigator에서 처리됨
          break; // 인증 실패 시 재시도하지 않음
        }
        
        // axios 에러인 경우 더 자세한 정보 출력
        if (error?.response) {
          console.error('응답 상태:', error.response.status);
          console.error('응답 데이터:', error.response.data);
          console.error('응답 헤더:', error.response.headers);
          
          // 500 에러인 경우 재시도
          if (error.response.status === 500 && retryCount < maxRetries) {
            retryCount++;
            console.log(`${retryCount}초 후 재시도...`);
            await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
            continue;
          }
        } else if (error?.request) {
          console.error('요청 에러:', error.request);
        }
        
        break; // 다른 에러의 경우 재시도하지 않음
      }
    }
    
    // 모든 시도 실패
    set({ 
      books: [],
      currentBook: null,
      isLoading: false 
    });
    return false;
  },

  createBook: async (data: CreateBookRequest, token: string) => {
    console.log('가계부 생성 시작:', data);
    console.log('토큰:', token ? '존재함' : '없음');
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/core/api/client')).default;
      const newBook = await apiService.createBook(data, token);
      
      console.log('가계부 생성 성공:', newBook);
      
      // 가계부 생성 후 목록을 새로고침하여 최신 데이터 가져오기
      console.log('가계부 목록 새로고침 시작');
      const { fetchBooks } = get();
      const refreshSuccess = await fetchBooks(token);
      console.log('가계부 목록 새로고침 결과:', refreshSuccess ? '성공' : '실패');
      
      // 생성된 가계부의 멤버 권한 즉시 확인
      try {
        console.log('생성된 가계부 멤버 권한 확인 시작');
        const { fetchBookMembers } = get();
        const membersSuccess = await fetchBookMembers(newBook.id, token);
        console.log('멤버 권한 조회 결과:', membersSuccess ? '성공' : '실패');
        
        const { bookMembers } = get();
        const currentUserMember = bookMembers.find(m => m.memberId);
        console.log('생성자 권한 확인:', currentUserMember?.role || '권한 없음');
      } catch (memberError) {
        console.error('멤버 권한 조회 실패:', memberError);
      }
      
      // 서버에서 가계부 생성 시 기본 자산과 카테고리를 자동으로 생성하므로
      // 클라이언트에서 중복 생성할 필요 없음
      console.log('가계부 생성 완료. 서버에서 기본 데이터 자동 생성됨.');
      
      set({ isLoading: false });
      
      return true;
    } catch (error) {
      console.error('가계부 생성 실패:', error);
      console.error('에러 상세:', error instanceof Error ? error.message : String(error));
      set({ isLoading: false });
      return false;
    }
  },

  updateBook: async (bookId: number, data: { title: string }, token: string) => {
    console.log('가계부 수정 시작:', { bookId, data });
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/core/api/client')).default;
      const updatedBook = await apiService.updateBook(bookId, data, token);
      
      console.log('가계부 수정 성공:', updatedBook);
      
      // 가계부 목록에서 해당 가계부 업데이트
      const { books, currentBook } = get();
      const updatedBooks = books.map(book => 
        book.id === bookId ? { ...book, title: data.title } : book
      );
      
      // 현재 가계부가 수정된 가계부인 경우 업데이트
      const updatedCurrentBook = currentBook && currentBook.id === bookId 
        ? { ...currentBook, title: data.title }
        : currentBook;
      
      set({ 
        books: updatedBooks,
        currentBook: updatedCurrentBook,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('가계부 수정 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  deleteBook: async (bookId: number, token: string) => {
    console.log('가계부 삭제 시작:', bookId);
    
    // 소유한 가계부가 1개 이상인지 확인
    const { getOwnedBooksCount } = get();
    const ownedCount = getOwnedBooksCount();
    if (ownedCount <= 1) {
      throw new Error('최소 1개의 가계부는 유지되어야 합니다.');
    }
    
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/core/api/client')).default;
      await apiService.deleteBook(bookId, token);
      
      console.log('가계부 삭제 성공');
      
      // 가계부 목록에서 해당 가계부 제거
      const { books, currentBook } = get();
      const updatedBooks = books.filter(book => book.id !== bookId);
      
      // 현재 가계부가 삭제된 가계부인 경우 다른 가계부로 변경
      const updatedCurrentBook = currentBook && currentBook.id === bookId 
        ? (updatedBooks.length > 0 ? updatedBooks[0] : null)
        : currentBook;
      
      set({ 
        books: updatedBooks,
        currentBook: updatedCurrentBook,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('가계부 삭제 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  fetchLedgers: async (params: GetLedgerListRequest, token: string) => {
    console.log('가계부 기록 조회 시작:', params);
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/core/api/client')).default;
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
      const apiService = (await import('@/core/api/client')).default;
      const newLedger = await apiService.createLedger(data, token);
      
      console.log('가계부 기록 생성 성공:', newLedger);
      
      const { ledgers } = get();
      const updatedLedgers = [newLedger, ...ledgers];
      
      set({ 
        ledgers: updatedLedgers,
        isLoading: false 
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('가계부 기록 생성 실패:', error);
      set({ isLoading: false });
      
      // Check if it's an axios error with a response
      if (error?.response?.data?.message) {
        const errorMessage = error.response.data.message;
        if (error.response.status === 400) {
          return { success: false, error: 'validation', message: errorMessage };
        }
        return { success: false, error: 'server', message: errorMessage };
      } else if (error?.response?.status === 500) {
        // 500 에러의 경우 서버 오류 메시지가 없어도 일반적인 서버 오류 메시지 반환
        return { success: false, error: 'server', message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' };
      }
      
      return { success: false, error: 'network', message: '네트워크 오류가 발생했습니다.' };
    }
  },

  updateLedger: async (ledgerId: number, data: CreateLedgerRequest, token: string) => {
    console.log('가계부 기록 수정 시작:', { ledgerId, data });
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/core/api/client')).default;
      const updatedLedger = await apiService.updateLedger(ledgerId, data, token);
      
      console.log('가계부 기록 수정 성공:', updatedLedger);
      
      // 가계부 기록 목록에서 해당 기록 업데이트
      const { ledgers } = get();
      const updatedLedgers = ledgers.map(ledger => 
        ledger.id === ledgerId ? updatedLedger : ledger
      );
      
      set({ 
        ledgers: updatedLedgers,
        isLoading: false 
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('가계부 기록 수정 실패:', error);
      set({ isLoading: false });
      
      if (error?.response?.data?.message) {
        const errorMessage = error.response.data.message;
        if (error.response.status === 400) {
          return { success: false, error: 'validation', message: errorMessage };
        }
        return { success: false, error: 'server', message: errorMessage };
      }
      
      return { success: false, error: 'network', message: '네트워크 오류가 발생했습니다.' };
    }
  },

  deleteLedger: async (ledgerId: number, token: string) => {
    console.log('가계부 기록 삭제 시작:', ledgerId);
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/core/api/client')).default;
      await apiService.deleteLedger(ledgerId, token);
      
      console.log('가계부 기록 삭제 성공');
      
      // 가계부 기록 목록에서 해당 기록 제거
      const { ledgers } = get();
      const updatedLedgers = ledgers.filter(ledger => ledger.id !== ledgerId);
      
      set({ 
        ledgers: updatedLedgers,
        isLoading: false 
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('가계부 기록 삭제 실패:', error);
      set({ isLoading: false });
      
      if (error?.response?.data?.message) {
        const errorMessage = error.response.data.message;
        return { success: false, error: 'server', message: errorMessage };
      }
      
      return { success: false, error: 'network', message: '네트워크 오류가 발생했습니다.' };
    }
  },

  getBookOwners: async (bookId: number, token: string) => {
    console.log('가계부 소유자 조회 시작:', bookId);
    
    try {
      const apiService = (await import('@/core/api/client')).default;
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
      const apiService = (await import('@/core/api/client')).default;
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
      const apiService = (await import('@/core/api/client')).default;
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
      const apiService = (await import('@/core/api/client')).default;
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
      const apiService = (await import('@/core/api/client')).default;
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
      const apiService = (await import('@/core/api/client')).default;
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