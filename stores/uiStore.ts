import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface UIState {
  // Theme
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  
  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Modal states
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  
  // Toast/Notification
  toast: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    visible: boolean;
  } | null;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  hideToast: () => void;
  
  // Tab bar visibility
  isTabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
  
  // Refresh states
  refreshing: {
    [key: string]: boolean;
  };
  setRefreshing: (key: string, refreshing: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Theme
      themeMode: 'system',
      setThemeMode: (mode) => set({ themeMode: mode }),
      
      // Loading states
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Modal states
      activeModal: null,
      setActiveModal: (modal) => set({ activeModal: modal }),
      
      // Toast/Notification
      toast: null,
      showToast: (message, type) => 
        set({ toast: { message, type, visible: true } }),
      hideToast: () => 
        set({ toast: null }),
      
      // Tab bar visibility
      isTabBarVisible: true,
      setTabBarVisible: (visible) => set({ isTabBarVisible: visible }),
      
      // Refresh states
      refreshing: {},
      setRefreshing: (key, refreshing) => 
        set((state) => ({
          refreshing: {
            ...state.refreshing,
            [key]: refreshing,
          },
        })),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        themeMode: state.themeMode,
        isTabBarVisible: state.isTabBarVisible,
      }),
    }
  )
);