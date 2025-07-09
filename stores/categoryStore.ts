import { create } from 'zustand';
import { Category, CreateCategoryRequest, PaymentMethod, CreatePaymentRequest } from '@/services/api';

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
      const { api } = await import('@/services/api');
      const categories = await api.getCategoryList(token);
      
      console.log('카테고리 목록 조회 성공:', categories);
      
      set({ 
        categories,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('카테고리 목록 조회 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  createCategory: async (data: CreateCategoryRequest, token: string) => {
    console.log('카테고리 생성 시작:', data);
    set({ isLoading: true });
    
    try {
      const { api } = await import('@/services/api');
      const newCategory = await api.createCategory(data, token);
      
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
      const { api } = await import('@/services/api');
      const payments = await api.getPaymentList(token);
      
      console.log('결제 수단 목록 조회 성공:', payments);
      
      set({ 
        payments,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error('결제 수단 목록 조회 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  createPayment: async (data: CreatePaymentRequest, token: string) => {
    console.log('결제 수단 생성 시작:', data);
    set({ isLoading: true });
    
    try {
      const { api } = await import('@/services/api');
      const newPayment = await api.createPayment(data, token);
      
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
}));