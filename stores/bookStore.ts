import { create } from 'zustand';
import { Book, CreateBookRequest, Member, Ledger, GetLedgerListRequest, CreateLedgerRequest } from '@/services/api';

interface BookState {
  books: Book[];
  currentBook: Book | null;
  ledgers: Ledger[];
  isLoading: boolean;
  
  // Actions
  setBooks: (books: Book[]) => void;
  setCurrentBook: (book: Book | null) => void;
  setLedgers: (ledgers: Ledger[]) => void;
  setLoading: (loading: boolean) => void;
  
  // API Actions
  fetchBooks: (token: string) => Promise<boolean>;
  createBook: (data: CreateBookRequest, token: string) => Promise<boolean>;
  fetchLedgers: (params: GetLedgerListRequest, token: string) => Promise<boolean>;
  createLedger: (data: CreateLedgerRequest, token: string) => Promise<boolean>;
  getBookOwners: (bookId: number, token: string) => Promise<Member[]>;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  currentBook: null,
  ledgers: [],
  isLoading: false,

  setBooks: (books) => set({ books }),
  setCurrentBook: (book) => set({ currentBook: book }),
  setLedgers: (ledgers) => set({ ledgers }),
  setLoading: (loading) => set({ isLoading: loading }),

  fetchBooks: async (token: string) => {
    console.log('가계부 목록 조회 시작');
    set({ isLoading: true });
    
    try {
      const { api } = await import('@/services/api');
      const books = await api.getMyBooks(token);
      
      console.log('가계부 목록 조회 성공:', books);
      
      set({ 
        books,
        currentBook: books.length > 0 ? books[0] : null,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('가계부 목록 조회 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  createBook: async (data: CreateBookRequest, token: string) => {
    console.log('가계부 생성 시작:', data);
    set({ isLoading: true });
    
    try {
      const { api } = await import('@/services/api');
      const newBook = await api.createBook(data, token);
      
      console.log('가계부 생성 성공:', newBook);
      
      const { books } = get();
      const updatedBooks = [...books, newBook];
      
      set({ 
        books: updatedBooks,
        currentBook: newBook,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('가계부 생성 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  fetchLedgers: async (params: GetLedgerListRequest, token: string) => {
    console.log('가계부 기록 조회 시작:', params);
    set({ isLoading: true });
    
    try {
      const { api } = await import('@/services/api');
      const ledgers = await api.getLedgerList(params, token);
      
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
      const { api } = await import('@/services/api');
      const newLedger = await api.createLedger(data, token);
      
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
      const { api } = await import('@/services/api');
      const owners = await api.getBookOwners(bookId, token);
      
      console.log('가계부 소유자 조회 성공:', owners);
      
      return owners;
    } catch (error) {
      console.error('가계부 소유자 조회 실패:', error);
      return [];
    }
  },
}));