import { create } from 'zustand';
import apiService from '@/core/api/client';

interface BookMember {
  userBookId: number;
  userId: number;
  username: string;
  name: string;
  email: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  joinedAt: string;
}

interface JoinRequest {
  requestId: number;
  bookId: number;
  bookTitle: string;
  memberId: number;
  memberName: string;
  memberEmail: string;
  status: string;
  requestedRole: string;
  requestDate: string;
  responseDate?: string;
}

interface BookGroup {
  groupId: number;
  groupName: string;
  description?: string;
  createdDate: string;
  memberCount: number;
}

interface InviteCodeResponse {
  code: string;
  ttlSeconds: number;
}

interface BookSharingStore {
  // State
  bookMembers: BookMember[];
  joinRequests: JoinRequest[];
  myJoinRequests: JoinRequest[];
  bookGroups: BookGroup[];
  currentInviteCode: InviteCodeResponse | null;
  userIdCode: InviteCodeResponse | null;
  isLoading: boolean;

  // Member management
  loadBookMembers: (bookId: number) => Promise<void>;
  removeMember: (bookId: number, userBookId: number) => Promise<boolean>;
  changeRole: (bookId: number, userBookId: number, role: 'EDITOR' | 'VIEWER') => Promise<boolean>;
  leaveBook: (bookId: number) => Promise<boolean>;

  // Invite code management
  createInviteCode: (bookId: number, role: 'EDITOR' | 'VIEWER') => Promise<InviteCodeResponse | null>;
  createUserIdCode: () => Promise<InviteCodeResponse | null>;
  joinBookWithCode: (inviteCode: string) => Promise<boolean>;

  // Join request management
  loadJoinRequests: (bookId: number) => Promise<void>;
  loadMyJoinRequests: () => Promise<void>;
  acceptJoinRequest: (requestId: number) => Promise<boolean>;
  rejectJoinRequest: (requestId: number) => Promise<boolean>;

  // Group management
  loadBookGroups: (bookId: number) => Promise<void>;
  createGroup: (bookId: number, groupName: string, description?: string) => Promise<boolean>;
  addMemberToGroup: (groupId: number, userBookId: number) => Promise<boolean>;

  // Reset
  reset: () => void;
}

export const useBookSharingStore = create<BookSharingStore>((set, get) => ({
  bookMembers: [],
  joinRequests: [],
  myJoinRequests: [],
  bookGroups: [],
  currentInviteCode: null,
  userIdCode: null,
  isLoading: false,

  loadBookMembers: async (bookId: number) => {
    try {
      set({ isLoading: true });
      const response = await apiService.axiosInstance.get(`/books/${bookId}/members`);
      
      const members: BookMember[] = response.data.members.map((member: any) => ({
        userBookId: member.userBookId,
        userId: member.userId,
        username: member.username,
        name: member.name,
        email: member.email,
        role: member.role,
        joinedAt: member.joinedAt
      }));
      
      set({ bookMembers: members, isLoading: false });
    } catch (error) {
      console.error('가계부 멤버 로드 실패:', error);
      set({ isLoading: false });
    }
  },

  removeMember: async (bookId: number, userBookId: number) => {
    try {
      await apiService.axiosInstance.delete(`/books/${bookId}/members/${userBookId}`);
      
      // 멤버 목록 새로고침
      await get().loadBookMembers(bookId);
      return true;
    } catch (error) {
      console.error('멤버 삭제 실패:', error);
      return false;
    }
  },

  changeRole: async (bookId: number, userBookId: number, role: 'EDITOR' | 'VIEWER') => {
    try {
      await apiService.axiosInstance.put(`/books/${bookId}/members/${userBookId}/role`, {
        role
      });
      
      // 멤버 목록 새로고침
      await get().loadBookMembers(bookId);
      return true;
    } catch (error) {
      console.error('역할 변경 실패:', error);
      return false;
    }
  },

  leaveBook: async (bookId: number) => {
    try {
      await apiService.axiosInstance.delete(`/books/${bookId}/leave`);
      return true;
    } catch (error) {
      console.error('가계부 나가기 실패:', error);
      return false;
    }
  },

  createInviteCode: async (bookId: number, role: 'EDITOR' | 'VIEWER') => {
    try {
      const response = await apiService.axiosInstance.post(`/book/invite/${bookId}/code`, {
        role
      });
      
      const inviteCode: InviteCodeResponse = {
        code: response.data.code,
        ttlSeconds: response.data.ttlSeconds
      };
      
      set({ currentInviteCode: inviteCode });
      return inviteCode;
    } catch (error) {
      console.error('초대 코드 생성 실패:', error);
      return null;
    }
  },

  createUserIdCode: async () => {
    try {
      const response = await apiService.axiosInstance.post('/book/invite/user/code');
      
      const userIdCode: InviteCodeResponse = {
        code: response.data.code,
        ttlSeconds: response.data.ttlSeconds
      };
      
      set({ userIdCode });
      return userIdCode;
    } catch (error) {
      console.error('사용자 식별 코드 생성 실패:', error);
      return null;
    }
  },

  joinBookWithCode: async (inviteCode: string) => {
    try {
      await apiService.axiosInstance.post('/book/invite/join', {
        inviteCode
      });
      
      // 내 참가 요청 목록 새로고침
      await get().loadMyJoinRequests();
      return true;
    } catch (error) {
      console.error('가계부 참가 요청 실패:', error);
      return false;
    }
  },

  loadJoinRequests: async (bookId: number) => {
    try {
      set({ isLoading: true });
      const response = await apiService.axiosInstance.get(`/book/invite/${bookId}/requests`);
      set({ joinRequests: response.data, isLoading: false });
    } catch (error) {
      console.error('참가 요청 로드 실패:', error);
      set({ isLoading: false });
    }
  },

  loadMyJoinRequests: async () => {
    try {
      set({ isLoading: true });
      const response = await apiService.axiosInstance.get('/book/invite/my-requests');
      set({ myJoinRequests: response.data, isLoading: false });
    } catch (error) {
      console.error('내 참가 요청 로드 실패:', error);
      set({ isLoading: false });
    }
  },

  acceptJoinRequest: async (requestId: number) => {
    try {
      await apiService.axiosInstance.put(`/book/invite/request/${requestId}/accept`);
      return true;
    } catch (error) {
      console.error('참가 요청 수락 실패:', error);
      return false;
    }
  },

  rejectJoinRequest: async (requestId: number) => {
    try {
      await apiService.axiosInstance.put(`/book/invite/request/${requestId}/reject`);
      return true;
    } catch (error) {
      console.error('참가 요청 거절 실패:', error);
      return false;
    }
  },

  loadBookGroups: async (bookId: number) => {
    try {
      set({ isLoading: true });
      const response = await apiService.axiosInstance.get(`/book/invite/${bookId}/groups`);
      set({ bookGroups: response.data, isLoading: false });
    } catch (error) {
      console.error('가계부 그룹 로드 실패:', error);
      set({ isLoading: false });
    }
  },

  createGroup: async (bookId: number, groupName: string, description?: string) => {
    try {
      await apiService.axiosInstance.post(`/book/invite/${bookId}/group`, {
        groupName,
        description
      });
      
      // 그룹 목록 새로고침
      await get().loadBookGroups(bookId);
      return true;
    } catch (error) {
      console.error('그룹 생성 실패:', error);
      return false;
    }
  },

  addMemberToGroup: async (groupId: number, userBookId: number) => {
    try {
      await apiService.axiosInstance.post(`/book/invite/group/${groupId}/member`, {
        userBookId
      });
      return true;
    } catch (error) {
      console.error('그룹 멤버 추가 실패:', error);
      return false;
    }
  },

  reset: () => {
    set({
      bookMembers: [],
      joinRequests: [],
      myJoinRequests: [],
      bookGroups: [],
      currentInviteCode: null,
      userIdCode: null,
      isLoading: false
    });
  }
}));