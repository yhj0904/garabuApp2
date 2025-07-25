import { create } from 'zustand';
import apiService, { Budget, BudgetRequest, BudgetSummary } from '@/core/api/client';

interface BudgetState {
  budgets: Budget[];
  currentBudget: Budget | null;
  budgetSummary: BudgetSummary | null;
  isLoading: boolean;
  
  // Actions
  setBudgets: (budgets: Budget[]) => void;
  setCurrentBudget: (budget: Budget | null) => void;
  setBudgetSummary: (summary: BudgetSummary | null) => void;
  setLoading: (loading: boolean) => void;
  
  // API Actions
  fetchBudgetsByBook: (bookId: number, token: string) => Promise<boolean>;
  createBudget: (bookId: number, data: BudgetRequest, token: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateBudget: (bookId: number, budgetMonth: string, data: BudgetRequest, token: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  deleteBudget: (bookId: number, budgetMonth: string, token: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  getBudgetByMonth: (bookId: number, budgetMonth: string, token: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  getBudgetSummary: (bookId: number, budgetMonth: string, token: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  getBudgetsByYear: (bookId: number, year: string, token: string) => Promise<boolean>;
  getRecentBudgets: (bookId: number, limit: number, token: string) => Promise<boolean>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  currentBudget: null,
  budgetSummary: null,
  isLoading: false,

  setBudgets: (budgets) => set({ budgets }),
  setCurrentBudget: (budget) => set({ currentBudget: budget }),
  setBudgetSummary: (summary) => set({ budgetSummary: summary }),
  setLoading: (loading) => set({ isLoading: loading }),

  fetchBudgetsByBook: async (bookId: number, token: string) => {
    try {
      set({ isLoading: true });
      const budgets = await apiService.getBudgetsByBook(bookId, token);
      set({ budgets, isLoading: false });
      return true;
    } catch (error: any) {
      console.error('예산 목록 조회 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  createBudget: async (bookId: number, data: BudgetRequest, token: string) => {
    try {
      set({ isLoading: true });
      const budget = await apiService.createBudget(bookId, data, token);
      
      // 기존 예산 목록에 새 예산 추가
      const currentBudgets = get().budgets;
      set({ 
        budgets: [budget, ...currentBudgets],
        currentBudget: budget,
        isLoading: false 
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('예산 생성 실패:', error);
      set({ isLoading: false });
      
      let errorMessage = '예산 생성에 실패했습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: 'create_failed', message: errorMessage };
    }
  },

  updateBudget: async (bookId: number, budgetMonth: string, data: BudgetRequest, token: string) => {
    try {
      set({ isLoading: true });
      const updatedBudget = await apiService.updateBudget(bookId, budgetMonth, data, token);
      
      // 기존 예산 목록에서 해당 예산 업데이트
      const currentBudgets = get().budgets;
      const updatedBudgets = currentBudgets.map(budget => 
        budget.budgetMonth === budgetMonth ? updatedBudget : budget
      );
      
      set({ 
        budgets: updatedBudgets,
        currentBudget: updatedBudget,
        isLoading: false 
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('예산 수정 실패:', error);
      set({ isLoading: false });
      
      let errorMessage = '예산 수정에 실패했습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: 'update_failed', message: errorMessage };
    }
  },

  deleteBudget: async (bookId: number, budgetMonth: string, token: string) => {
    try {
      set({ isLoading: true });
      await apiService.deleteBudget(bookId, budgetMonth, token);
      
      // 기존 예산 목록에서 해당 예산 제거
      const currentBudgets = get().budgets;
      const updatedBudgets = currentBudgets.filter(budget => budget.budgetMonth !== budgetMonth);
      
      set({ 
        budgets: updatedBudgets,
        currentBudget: null,
        budgetSummary: null,
        isLoading: false 
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('예산 삭제 실패:', error);
      set({ isLoading: false });
      
      let errorMessage = '예산 삭제에 실패했습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: 'delete_failed', message: errorMessage };
    }
  },

  getBudgetByMonth: async (bookId: number, budgetMonth: string, token: string) => {
    try {
      set({ isLoading: true });
      const budget = await apiService.getBudgetByMonth(bookId, budgetMonth, token);
      set({ currentBudget: budget, isLoading: false });
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false });
      
      // 예산이 존재하지 않는 경우 (404 또는 500 에러)
      if (error.response?.status === 404 || 
          error.response?.status === 500 || 
          (error.response?.data?.message && error.response.data.message.includes('찾을 수 없습니다'))) {
        // 예산이 없으면 null로 설정하고 성공으로 처리
        set({ currentBudget: null });
        return { 
          success: true, 
          error: 'budget_not_found', 
          message: '해당 월의 예산이 설정되지 않았습니다.' 
        };
      }
      
      let errorMessage = '예산 조회에 실패했습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: 'fetch_failed', message: errorMessage };
    }
  },

  getBudgetSummary: async (bookId: number, budgetMonth: string, token: string) => {
    try {
      set({ isLoading: true });
      const summary = await apiService.getBudgetSummary(bookId, budgetMonth, token);
      set({ budgetSummary: summary, isLoading: false });
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false });
      
      // 예산이 존재하지 않는 경우 (404 또는 500 에러)
      if (error.response?.status === 404 || 
          error.response?.status === 500 || 
          (error.response?.data?.message && error.response.data.message.includes('찾을 수 없습니다'))) {
        // 예산이 없는 것은 정상 상황이므로 로그 레벨 낮춤
        console.log('예산 정보 없음 (정상)');
        // 예산이 없으면 null로 설정하고 성공으로 처리
        set({ budgetSummary: null });
        return { 
          success: true, 
          error: 'budget_not_found', 
          message: '해당 월의 예산이 설정되지 않았습니다.' 
        };
      }
      
      // 404 에러가 아닌 경우에만 error 로그
      if (error.response?.status !== 404) {
        console.error('예산 요약 조회 실패:', error);
      }
      
      let errorMessage = '예산 요약 조회에 실패했습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: 'fetch_failed', message: errorMessage };
    }
  },

  getBudgetsByYear: async (bookId: number, year: string, token: string) => {
    try {
      set({ isLoading: true });
      const budgets = await apiService.getBudgetsByYear(bookId, year, token);
      set({ budgets, isLoading: false });
      return true;
    } catch (error: any) {
      console.error('연도별 예산 조회 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },

  getRecentBudgets: async (bookId: number, limit: number, token: string) => {
    try {
      set({ isLoading: true });
      const budgets = await apiService.getRecentBudgets(bookId, limit, token);
      set({ budgets, isLoading: false });
      return true;
    } catch (error: any) {
      console.error('최근 예산 조회 실패:', error);
      set({ isLoading: false });
      return false;
    }
  },
})); 