import { Category, CreateCategoryRequest, CreatePaymentRequest, PaymentMethod } from '@/services/api';
import { create } from 'zustand';

interface CategoryState {
  categories: Category[];
  payments: PaymentMethod[];
  isLoading: boolean;
  
  // Actions
  setCategories: (categories: Category[]) => void;
  setPayments: (payments: PaymentMethod[]) => void;
  setLoading: (loading: boolean) => void;
  
  // API Actions
  fetchCategories: (token: string) => Promise<boolean>;
  createCategory: (data: CreateCategoryRequest, token: string) => Promise<boolean>;
  fetchPayments: (token: string) => Promise<boolean>;
  createPayment: (data: CreatePaymentRequest, token: string) => Promise<boolean>;
  
  // 가계부별 API Actions
  fetchCategoriesByBook: (bookId: number, token: string) => Promise<boolean>;
  createCategoryForBook: (bookId: number, data: CreateCategoryRequest, token: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  fetchPaymentsByBook: (bookId: number, token: string) => Promise<boolean>;
  createPaymentForBook: (bookId: number, data: CreatePaymentRequest, token: string) => Promise<{ success: boolean; error?: string; message?: string }>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  payments: [],
  isLoading: false,

  setCategories: (categories) => set({ categories }),
  setPayments: (payments) => set({ payments }),
  setLoading: (loading) => set({ isLoading: loading }),

  fetchCategories: async (token: string) => {
    console.log('카테고리 목록 조회 시작');
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      const categories = await apiService.getCategoryList(token);
      
      console.log('카테고리 목록 조회 성공:', categories);
      
      set({ 
        categories: categories || [],
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('카테고리 목록 조회 실패:', error);
      // 에러가 발생해도 빈 배열로 설정하여 앱이 멈추지 않도록 처리
      set({ 
        categories: [],
        isLoading: false 
      });
      return false;
    }
  },

  createCategory: async (data: CreateCategoryRequest, token: string) => {
    console.log('카테고리 생성 시작:', data);
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      const newCategory = await apiService.createCategory(data, token);
      
      console.log('카테고리 생성 성공:', newCategory);
      
      const { categories } = get();
      const updatedCategories = [...categories, newCategory];
      
      set({ 
        categories: updatedCategories,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('카테고리 생성 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  fetchPayments: async (token: string) => {
    console.log('결제 수단 목록 조회 시작');
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      const payments = await apiService.getPaymentList(token);
      
      console.log('결제 수단 목록 조회 성공:', payments);
      
      set({ 
        payments: payments || [],
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('결제 수단 목록 조회 실패:', error);
      // 에러가 발생해도 빈 배열로 설정하여 앱이 멈추지 않도록 처리
      set({ 
        payments: [],
        isLoading: false 
      });
      return false;
    }
  },

  createPayment: async (data: CreatePaymentRequest, token: string) => {
    console.log('결제 수단 생성 시작:', data);
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      const newPayment = await apiService.createPayment(data, token);
      
      console.log('결제 수단 생성 성공:', newPayment);
      
      const { payments } = get();
      const updatedPayments = [...payments, newPayment];
      
      set({ 
        payments: updatedPayments,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('결제 수단 생성 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  // 가계부별 카테고리 조회
  fetchCategoriesByBook: async (bookId: number, token: string) => {
    console.log('가계부별 카테고리 목록 조회 시작:', bookId);
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      const categories = await apiService.getCategoryListByBook(bookId, token);
      
      console.log('가계부별 카테고리 목록 조회 성공:', categories);
      
      set({ 
        categories,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('가계부별 카테고리 목록 조회 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  // 가계부별 카테고리 생성
  createCategoryForBook: async (bookId: number, data: CreateCategoryRequest, token: string) => {
    console.log('가계부별 카테고리 생성 시작:', { bookId, data });
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      const newCategory = await apiService.createCategoryForBook(bookId, data, token);
      
      console.log('가계부별 카테고리 생성 성공:', newCategory);
      
      const { categories } = get();
      const updatedCategories = [...categories, newCategory];
      
      set({ 
        categories: updatedCategories,
        isLoading: false 
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('가계부별 카테고리 생성 실패:', error);
      set({ isLoading: false });
      
      // Check if it's an axios error with a response
      if (error?.response?.data?.message) {
        const errorMessage = error.response.data.message;
        // Check for duplicate category error
        if (errorMessage.includes('이미 존재하는') && errorMessage.includes('카테고리')) {
          return { success: false, error: 'duplicate', message: '이미 존재하는 카테고리입니다.' };
        }
        return { success: false, error: 'server', message: errorMessage };
      }
      
      return { success: false, error: 'network', message: '네트워크 오류가 발생했습니다.' };
    }
  },

  // 가계부별 결제수단 조회
  fetchPaymentsByBook: async (bookId: number, token: string) => {
    console.log('가계부별 결제 수단 목록 조회 시작:', bookId);
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      const payments = await apiService.getPaymentListByBook(bookId, token);
      
      console.log('가계부별 결제 수단 목록 조회 성공:', payments);
      
      set({ 
        payments,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('가계부별 결제 수단 목록 조회 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  // 가계부별 결제수단 생성
  createPaymentForBook: async (bookId: number, data: CreatePaymentRequest, token: string) => {
    console.log('가계부별 결제 수단 생성 시작:', { bookId, data });
    set({ isLoading: true });
    
    try {
      const apiService = (await import('@/services/api')).default;
      const newPayment = await apiService.createPaymentForBook(bookId, data, token);
      
      console.log('가계부별 결제 수단 생성 성공:', newPayment);
      
      const { payments } = get();
      const updatedPayments = [...payments, newPayment];
      
      set({ 
        payments: updatedPayments,
        isLoading: false 
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('가계부별 결제 수단 생성 실패:', error);
      set({ isLoading: false });
      
      // Check if it's an axios error with a response
      if (error?.response?.data?.message) {
        const errorMessage = error.response.data.message;
        // Check for duplicate payment method error
        if (errorMessage.includes('이미 존재하는 결제 수단입니다')) {
          return { success: false, error: 'duplicate', message: '이미 존재하는 결제 수단입니다.' };
        }
        return { success: false, error: 'server', message: errorMessage };
      }
      
      return { success: false, error: 'network', message: '네트워크 오류가 발생했습니다.' };
    }
  },
}));