import apiService from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InviteCodeResponse {
  code: string;
  ttlSeconds: number;
}

export interface JoinRequestResponse {
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

export interface GroupResponse {
  groupId: number;
  groupName: string;
  description?: string;
  createdDate: string;
  memberCount: number;
}

/**
 * 가계부 초대 코드 생성
 */
export const createBookInviteCode = async (bookId: number, role: string): Promise<InviteCodeResponse> => {
  const token = await AsyncStorage.getItem('auth-token');
  if (!token) throw new Error('인증 토큰이 없습니다.');
  return apiService.createBookInviteCode(bookId, role);
};

/**
 * 사용자 식별 코드 생성
 */
export const createUserIdCode = async (): Promise<InviteCodeResponse> => {
  const token = await AsyncStorage.getItem('auth-token');
  if (!token) throw new Error('인증 토큰이 없습니다.');
  return apiService.createUserIdCode();
};

/**
 * 초대 코드로 가계부 참가 요청
 */
export const requestJoinBook = async (inviteCode: string): Promise<JoinRequestResponse> => {
  const token = await AsyncStorage.getItem('auth-token');
  if (!token) throw new Error('인증 토큰이 없습니다.');
  return apiService.requestJoinBook(inviteCode);
};

/**
 * 참가 요청 수락
 */
export const acceptJoinRequest = async (requestId: number): Promise<void> => {
  const token = await AsyncStorage.getItem('auth-token');
  if (!token) throw new Error('인증 토큰이 없습니다.');
  return apiService.acceptJoinRequest(requestId);
};

/**
 * 참가 요청 거절
 */
export const rejectJoinRequest = async (requestId: number): Promise<void> => {
  const token = await AsyncStorage.getItem('auth-token');
  if (!token) throw new Error('인증 토큰이 없습니다.');
  return apiService.rejectJoinRequest(requestId);
};

/**
 * 가계부의 참가 요청 목록 조회
 */
export const getBookJoinRequests = async (bookId: number): Promise<JoinRequestResponse[]> => {
  const token = await AsyncStorage.getItem('auth-token');
  if (!token) throw new Error('인증 토큰이 없습니다.');
  return apiService.getBookJoinRequests(bookId);
};

/**
 * 내가 요청한 가계부 목록 조회
 */
export const getMyJoinRequests = async (): Promise<JoinRequestResponse[]> => {
  const token = await AsyncStorage.getItem('auth-token');
  if (!token) throw new Error('인증 토큰이 없습니다.');
  return apiService.getMyJoinRequests();
};

/**
 * 그룹 생성
 */
export const createGroup = async (bookId: number, groupName: string, description?: string): Promise<GroupResponse> => {
  const token = await AsyncStorage.getItem('auth-token');
  if (!token) throw new Error('인증 토큰이 없습니다.');
  return apiService.createGroup(bookId, groupName, description);
};

/**
 * 그룹에 멤버 추가
 */
export const addMemberToGroup = async (groupId: number, userBookId: number): Promise<void> => {
  const token = await AsyncStorage.getItem('auth-token');
  if (!token) throw new Error('인증 토큰이 없습니다.');
  return apiService.addMemberToGroup(groupId, userBookId);
};

/**
 * 가계부의 그룹 목록 조회
 */
export const getBookGroups = async (bookId: number): Promise<GroupResponse[]> => {
  const token = await AsyncStorage.getItem('auth-token');
  if (!token) throw new Error('인증 토큰이 없습니다.');
  // TODO: API endpoint 구현 필요
  return [];
}; 