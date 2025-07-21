import { create } from 'zustand';
import apiService from '@/core/api/client';
import type { Asset, AssetType, CreateAssetRequest, UpdateAssetRequest } from '@/core/api/client';

interface AssetState {
  assets: Asset[];
  assetTypes: AssetType[];
  selectedAsset: Asset | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setAssets: (assets: Asset[]) => void;
  setAssetTypes: (assetTypes: AssetType[]) => void;
  setSelectedAsset: (asset: Asset | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // API Actions
  fetchAssetTypes: (token: string) => Promise<boolean>;
  fetchAssetsByBook: (bookId: number, token: string) => Promise<void>;
  createAsset: (bookId: number, data: CreateAssetRequest, token: string) => Promise<Asset>;
  createDefaultAssets: (bookId: number, token: string) => Promise<Asset[]>;
  updateAsset: (assetId: number, data: UpdateAssetRequest, token: string) => Promise<Asset>;
  deleteAsset: (assetId: number, token: string) => Promise<void>;
  updateAssetBalance: (assetId: number, amount: number, operation: 'ADD' | 'SUBTRACT', token: string) => Promise<void>;
  
  // Computed
  getTotalAssets: () => number;
  getAssetsByType: (assetType: string) => Asset[];
  getAssetTypeStats: () => Array<{ type: string; amount: number; percentage: number; count: number }>;
  getDefaultAssetTypes: () => AssetType[];
  getCustomAssetTypes: () => AssetType[];
}

// 기본 자산 타입 정의
const defaultAssetTypes: AssetType[] = [
  { type: 'CASH', name: '현금', icon: 'cash', color: '#4CAF50' },
  { type: 'SAVINGS_ACCOUNT', name: '적금계좌', icon: 'card', color: '#2196F3' },
  { type: 'CHECKING_ACCOUNT', name: '입출금계좌', icon: 'card-outline', color: '#03A9F4' },
  { type: 'CREDIT_CARD', name: '신용카드', icon: 'card', color: '#FF9800' },
  { type: 'DEBIT_CARD', name: '체크카드', icon: 'card-outline', color: '#FF5722' },
  { type: 'INVESTMENT', name: '투자', icon: 'trending-up', color: '#9C27B0' },
  { type: 'REAL_ESTATE', name: '부동산', icon: 'home', color: '#795548' },
  { type: 'OTHER', name: '기타', icon: 'diamond', color: '#607D8B' },
];

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  assetTypes: defaultAssetTypes,
  selectedAsset: null,
  isLoading: false,
  error: null,

  // Setters
  setAssets: (assets) => set({ assets }),
  setAssetTypes: (assetTypes) => set({ assetTypes }),
  setSelectedAsset: (asset) => set({ selectedAsset: asset }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // API Actions
  fetchAssetTypes: async (token: string) => {
    try {
      set({ isLoading: true, error: null });
      const assetTypes = await apiService.getAssetTypes(token);
      set({ assetTypes, isLoading: false });
      return true;
    } catch (error: any) {
      set({ 
        error: error.message || '자산 타입 목록을 불러오는데 실패했습니다.',
        isLoading: false 
      });
      console.error('자산 타입 목록 조회 실패:', error);
      return false;
    }
  },

  // 기본 자산 자동 생성
  createDefaultAssets: async (bookId: number, token: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const defaultAssets = [
        { name: '현금', assetType: 'CASH' as const, balance: 0, description: '지갑에 있는 현금' },
        { name: '주거래 계좌', assetType: 'CHECKING_ACCOUNT' as const, balance: 0, description: '주로 사용하는 은행 계좌', bankName: '은행명 입력' },
        { name: '적금 계좌', assetType: 'SAVINGS_ACCOUNT' as const, balance: 0, description: '저축용 적금 계좌', bankName: '은행명 입력' },
        { name: '주카드', assetType: 'CREDIT_CARD' as const, balance: 0, description: '주로 사용하는 카드', cardType: '신용카드' },
      ];

      const createdAssets = [];
      for (const assetData of defaultAssets) {
        try {
          const newAsset = await apiService.createAsset(bookId, assetData, token);
          createdAssets.push(newAsset);
        } catch (error) {
          console.error('기본 자산 생성 실패:', assetData.name, error);
        }
      }

      // 기존 자산 목록에 새로 생성된 자산들 추가
      const currentAssets = get().assets;
      set({ 
        assets: [...currentAssets, ...createdAssets],
        isLoading: false 
      });
      
      return createdAssets;
    } catch (error: any) {
      set({ 
        error: error.message || '기본 자산 생성에 실패했습니다.',
        isLoading: false 
      });
      console.error('기본 자산 생성 실패:', error);
      return [];
    }
  },

  fetchAssetsByBook: async (bookId: number, token: string) => {
    try {
      set({ isLoading: true, error: null });
      const assets = await apiService.getAssetsByBook(bookId, token);
      set({ assets, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || '자산 목록을 불러오는데 실패했습니다.',
        isLoading: false 
      });
      console.error('자산 목록 조회 실패:', error);
    }
  },

  createAsset: async (bookId: number, data: CreateAssetRequest, token: string) => {
    try {
      set({ isLoading: true, error: null });
      const newAsset = await apiService.createAsset(bookId, data, token);
      
      // 기존 자산 목록에 새 자산 추가
      const currentAssets = get().assets;
      set({ 
        assets: [...currentAssets, newAsset],
        isLoading: false 
      });
      
      return newAsset;
    } catch (error: any) {
      set({ 
        error: error.message || '자산 생성에 실패했습니다.',
        isLoading: false 
      });
      console.error('자산 생성 실패:', error);
      throw error;
    }
  },

  updateAsset: async (assetId: number, data: UpdateAssetRequest, token: string) => {
    try {
      set({ isLoading: true, error: null });
      const updatedAsset = await apiService.updateAsset(assetId, data, token);
      
      // 자산 목록에서 해당 자산 업데이트
      const currentAssets = get().assets;
      const updatedAssets = currentAssets.map(asset => 
        asset.id === assetId ? updatedAsset : asset
      );
      
      set({ 
        assets: updatedAssets,
        selectedAsset: get().selectedAsset?.id === assetId ? updatedAsset : get().selectedAsset,
        isLoading: false 
      });
      
      return updatedAsset;
    } catch (error: any) {
      set({ 
        error: error.message || '자산 수정에 실패했습니다.',
        isLoading: false 
      });
      console.error('자산 수정 실패:', error);
      throw error;
    }
  },

  deleteAsset: async (assetId: number, token: string) => {
    try {
      set({ isLoading: true, error: null });
      await apiService.deleteAsset(assetId, token);
      
      // 자산 목록에서 해당 자산 제거
      const currentAssets = get().assets;
      const filteredAssets = currentAssets.filter(asset => asset.id !== assetId);
      
      set({ 
        assets: filteredAssets,
        selectedAsset: get().selectedAsset?.id === assetId ? null : get().selectedAsset,
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.message || '자산 삭제에 실패했습니다.',
        isLoading: false 
      });
      console.error('자산 삭제 실패:', error);
      throw error;
    }
  },

  updateAssetBalance: async (assetId: number, amount: number, operation: 'ADD' | 'SUBTRACT', token: string) => {
    try {
      const updatedAsset = await apiService.updateAssetBalance(assetId, amount, operation, token);
      
      // 자산 목록에서 해당 자산 업데이트
      const currentAssets = get().assets;
      const updatedAssets = currentAssets.map(asset => 
        asset.id === assetId ? updatedAsset : asset
      );
      
      set({ 
        assets: updatedAssets,
        selectedAsset: get().selectedAsset?.id === assetId ? updatedAsset : get().selectedAsset,
      });
    } catch (error: any) {
      set({ error: error.message || '자산 잔액 업데이트에 실패했습니다.' });
      console.error('자산 잔액 업데이트 실패:', error);
      throw error;
    }
  },

  // Computed values
  getTotalAssets: () => {
    const assets = get().assets;
    return assets.reduce((total, asset) => total + asset.balance, 0);
  },

  getDefaultAssetTypes: () => {
    const assetTypes = get().assetTypes;
    return assetTypes.filter(type => 
      ['CASH', 'SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT', 'CREDIT_CARD', 'DEBIT_CARD'].includes(type.type)
    );
  },

  getCustomAssetTypes: () => {
    const assetTypes = get().assetTypes;
    return assetTypes.filter(type => 
      ['INVESTMENT', 'REAL_ESTATE', 'OTHER'].includes(type.type)
    );
  },

  getAssetsByType: (assetType: string) => {
    const assets = get().assets;
    return assets.filter(asset => asset.assetType === assetType && asset.isActive);
  },

  getAssetTypeStats: () => {
    const assets = get().assets.filter(asset => asset.isActive);
    const totalBalance = assets.reduce((sum, asset) => sum + asset.balance, 0);
    
    // 타입별 그룹화
    const typeGroups = assets.reduce((groups, asset) => {
      const type = asset.assetType;
      if (!groups[type]) {
        groups[type] = { amount: 0, count: 0 };
      }
      groups[type].amount += asset.balance;
      groups[type].count += 1;
      return groups;
    }, {} as Record<string, { amount: number; count: number }>);

    // 통계 배열로 변환
    return Object.entries(typeGroups).map(([type, data]) => ({
      type,
      amount: data.amount,
      count: data.count,
      percentage: totalBalance > 0 ? (data.amount / totalBalance) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);
  },
}));