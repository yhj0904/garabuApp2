import { create } from 'zustand';
import apiService from '../services/api';

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

interface FriendStore {
  friends: Friend[];
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  friendGroups: FriendGroup[];
  friendCount: number;
  pendingRequestCount: number;
  isLoading: boolean;
  
  // Actions
  loadFriends: () => Promise<void>;
  loadFriendRequests: () => Promise<void>;
  loadSentRequests: () => Promise<void>;
  loadFriendGroups: () => Promise<void>;
  loadFriendStatus: () => Promise<void>;
  
  sendFriendRequest: (addresseeId: number, alias?: string) => Promise<boolean>;
  acceptFriendRequest: (friendshipId: number, alias?: string) => Promise<boolean>;
  rejectFriendRequest: (friendshipId: number) => Promise<boolean>;
  deleteFriend: (friendshipId: number) => Promise<boolean>;
  setFriendAlias: (friendshipId: number, alias: string) => Promise<boolean>;
  
  createFriendGroup: (name: string, description?: string, color?: string, icon?: string) => Promise<boolean>;
  updateFriendGroup: (groupId: number, name: string, description?: string, color?: string, icon?: string) => Promise<boolean>;
  deleteFriendGroup: (groupId: number) => Promise<boolean>;
  
  searchFriends: (username: string) => Promise<Friend[]>;
  reset: () => void;
}

export const useFriendStore = create<FriendStore>((set, get) => ({
  friends: [],
  friendRequests: [],
  sentRequests: [],
  friendGroups: [],
  friendCount: 0,
  pendingRequestCount: 0,
  isLoading: false,

  loadFriends: async () => {
    try {
      set({ isLoading: true });
      const response = await apiService.axiosInstance.get('/friends');
      set({ friends: response.data.friends, isLoading: false });
    } catch (error) {
      console.error('친구 목록 로드 실패:', error);
      set({ isLoading: false });
    }
  },

  loadFriendRequests: async () => {
    try {
      set({ isLoading: true });
      const response = await apiService.axiosInstance.get('/friends/requests/received');
      set({ friendRequests: response.data.requests, isLoading: false });
    } catch (error) {
      console.error('받은 친구 요청 로드 실패:', error);
      set({ isLoading: false });
    }
  },

  loadSentRequests: async () => {
    try {
      set({ isLoading: true });
      const response = await apiService.axiosInstance.get('/friends/requests/sent');
      set({ sentRequests: response.data.requests, isLoading: false });
    } catch (error) {
      console.error('보낸 친구 요청 로드 실패:', error);
      set({ isLoading: false });
    }
  },

  loadFriendGroups: async () => {
    try {
      set({ isLoading: true });
      const response = await apiService.axiosInstance.get('/friend-groups');
      set({ friendGroups: response.data.groups, isLoading: false });
    } catch (error) {
      console.error('친구 그룹 로드 실패:', error);
      set({ isLoading: false });
    }
  },

  loadFriendStatus: async () => {
    try {
      const response = await apiService.axiosInstance.get('/friends/status');
      set({ 
        friendCount: response.data.friendCount,
        pendingRequestCount: response.data.pendingRequestCount
      });
    } catch (error) {
      console.error('친구 상태 로드 실패:', error);
    }
  },

  sendFriendRequest: async (addresseeId: number, alias?: string) => {
    try {
      await apiService.axiosInstance.post('/friends/request', {
        addresseeId,
        alias
      });
      
      // 보낸 요청 목록 새로고침
      await get().loadSentRequests();
      return true;
    } catch (error) {
      console.error('친구 요청 전송 실패:', error);
      return false;
    }
  },

  acceptFriendRequest: async (friendshipId: number, alias?: string) => {
    try {
      await apiService.axiosInstance.post(`/friends/accept/${friendshipId}`, {
        alias
      });
      
      // 관련 목록들 새로고침
      await Promise.all([
        get().loadFriends(),
        get().loadFriendRequests(),
        get().loadFriendStatus()
      ]);
      
      return true;
    } catch (error) {
      console.error('친구 요청 수락 실패:', error);
      return false;
    }
  },

  rejectFriendRequest: async (friendshipId: number) => {
    try {
      await apiService.axiosInstance.post(`/friends/reject/${friendshipId}`);
      
      // 받은 요청 목록 새로고침
      await get().loadFriendRequests();
      return true;
    } catch (error) {
      console.error('친구 요청 거절 실패:', error);
      return false;
    }
  },

  deleteFriend: async (friendshipId: number) => {
    try {
      await apiService.axiosInstance.delete(`/friends/${friendshipId}`);
      
      // 친구 목록 새로고침
      await Promise.all([
        get().loadFriends(),
        get().loadFriendStatus()
      ]);
      
      return true;
    } catch (error) {
      console.error('친구 삭제 실패:', error);
      return false;
    }
  },

  setFriendAlias: async (friendshipId: number, alias: string) => {
    try {
      await apiService.axiosInstance.put(`/friends/${friendshipId}/alias`, {
        alias
      });
      
      // 친구 목록 새로고침
      await get().loadFriends();
      return true;
    } catch (error) {
      console.error('친구 별칭 설정 실패:', error);
      return false;
    }
  },

  createFriendGroup: async (name: string, description?: string, color?: string, icon?: string) => {
    try {
      await apiService.axiosInstance.post('/friend-groups', {
        name,
        description,
        color,
        icon
      });
      
      // 친구 그룹 목록 새로고침
      await get().loadFriendGroups();
      return true;
    } catch (error) {
      console.error('친구 그룹 생성 실패:', error);
      return false;
    }
  },

  updateFriendGroup: async (groupId: number, name: string, description?: string, color?: string, icon?: string) => {
    try {
      await apiService.axiosInstance.put(`/friend-groups/${groupId}`, {
        name,
        description,
        color,
        icon
      });
      
      // 친구 그룹 목록 새로고침
      await get().loadFriendGroups();
      return true;
    } catch (error) {
      console.error('친구 그룹 수정 실패:', error);
      return false;
    }
  },

  deleteFriendGroup: async (groupId: number) => {
    try {
      await apiService.axiosInstance.delete(`/friend-groups/${groupId}`);
      
      // 친구 그룹 목록 새로고침
      await get().loadFriendGroups();
      return true;
    } catch (error) {
      console.error('친구 그룹 삭제 실패:', error);
      return false;
    }
  },

  searchFriends: async (username: string) => {
    try {
      const response = await apiService.axiosInstance.get(`/friends/search?username=${username}`);
      return response.data.friends;
    } catch (error) {
      console.error('친구 검색 실패:', error);
      return [];
    }
  },

  reset: () => {
    set({
      friends: [],
      friendRequests: [],
      sentRequests: [],
      friendGroups: [],
      friendCount: 0,
      pendingRequestCount: 0,
      isLoading: false
    });
  }
}));