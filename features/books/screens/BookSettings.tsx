import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import apiService from '@/core/api/client';
import type { GroupResponse, JoinRequestResponse } from '@/services/inviteService';
import { acceptJoinRequest, createGroup, getBookGroups, getBookJoinRequests, rejectJoinRequest } from '@/services/inviteService';

interface BookMember {
  memberId: number;
  username: string;
  email: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
}

export default function BookSettingsModal() {
  const router = useRouter();
  const { bookId, bookTitle, userRole } = useLocalSearchParams<{ 
    bookId: string; 
    bookTitle: string;
    userRole: string;
  }>();
  
  const [members, setMembers] = useState<BookMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequestResponse[]>([]);
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const isOwner = userRole === 'OWNER';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 멤버 목록 조회
      const token = await AsyncStorage.getItem('auth-token');
      if (token) {
        const membersData = await apiService.getBookMembersWithRoles(Number(bookId), token);
        setMembers(membersData);
      }
      
      // OWNER인 경우 참가 요청 목록도 조회
      if (isOwner) {
        const requests = await getBookJoinRequests(Number(bookId));
        setJoinRequests(requests.filter(req => req.status === 'PENDING'));
      }
      
      // 그룹 목록 조회
      const groupsData = await getBookGroups(Number(bookId));
      setGroups(groupsData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await acceptJoinRequest(requestId);
      Alert.alert('성공', '참가 요청을 승인했습니다.');
      loadData();
    } catch (error) {
      Alert.alert('오류', '요청 처리에 실패했습니다.');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    Alert.alert(
      '참가 요청 거절',
      '정말로 이 요청을 거절하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '거절',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectJoinRequest(requestId);
              Alert.alert('완료', '참가 요청을 거절했습니다.');
              loadData();
            } catch (error) {
              Alert.alert('오류', '요청 처리에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('알림', '그룹 이름을 입력해주세요.');
      return;
    }

    try {
      await createGroup(Number(bookId), newGroupName.trim(), newGroupDescription.trim());
      Alert.alert('성공', '그룹이 생성되었습니다.');
      setShowCreateGroupModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
      loadData();
    } catch (error: any) {
      Alert.alert('오류', error.message || '그룹 생성에 실패했습니다.');
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    Alert.alert(
      '멤버 제거',
      '정말로 이 멤버를 가계부에서 제거하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제거',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth-token');
              if (token) {
                await apiService.removeMember(Number(bookId), memberId, token);
                Alert.alert('완료', '멤버가 제거되었습니다.');
                loadData();
              }
            } catch (error) {
              Alert.alert('오류', '멤버 제거에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = async (memberId: number, currentRole: string) => {
    const newRole = currentRole === 'VIEWER' ? 'EDITOR' : 'VIEWER';
    
    Alert.alert(
      '권한 변경',
      `권한을 ${getRoleDisplay(newRole)}(으)로 변경하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '변경',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth-token');
              if (token) {
                await apiService.changeRole(Number(bookId), memberId, { role: newRole }, token);
                Alert.alert('완료', '권한이 변경되었습니다.');
                loadData();
              }
            } catch (error) {
              Alert.alert('오류', '권한 변경에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'OWNER': return '소유자';
      case 'EDITOR': return '편집자';
      case 'VIEWER': return '조회자';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return '#FF3B30';
      case 'EDITOR': return '#007AFF';
      case 'VIEWER': return '#34C759';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 추가 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>가계부 설정</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadData();
          }} />
        }
      >
        <Text style={styles.bookTitle}>{bookTitle}</Text>

        {/* 초대 섹션 - OWNER만 표시 */}
        {isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>초대하기</Text>
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => router.push({
                pathname: '/invite-code',
                params: { bookId, bookTitle }
              })}
            >
              <Ionicons name="person-add-outline" size={20} color="#007AFF" />
              <Text style={styles.inviteButtonText}>초대 코드 생성</Text>
              <Ionicons name="chevron-forward" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* 참가 요청 섹션 - OWNER만 표시 */}
        {isOwner && joinRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>참가 요청 ({joinRequests.length})</Text>
            {joinRequests.map((request) => (
              <View key={request.requestId} style={styles.requestItem}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestName}>{request.memberName}</Text>
                  <Text style={styles.requestEmail}>{request.memberEmail}</Text>
                  <View style={styles.roleTag}>
                    <Text style={[styles.roleText, { color: getRoleColor(request.requestedRole) }]}>
                      {getRoleDisplay(request.requestedRole)}
                    </Text>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[styles.requestButton, styles.acceptButton]}
                    onPress={() => handleAcceptRequest(request.requestId)}
                  >
                    <Text style={styles.acceptButtonText}>수락</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.requestButton, styles.rejectButton]}
                    onPress={() => handleRejectRequest(request.requestId)}
                  >
                    <Text style={styles.rejectButtonText}>거절</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 멤버 목록 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>멤버 ({members.length})</Text>
          {members.map((member) => (
            <View key={member.memberId} style={styles.memberItem}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.username}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
              <View style={styles.memberRightSection}>
                <View style={[styles.roleTag, { backgroundColor: getRoleColor(member.role) + '20' }]}>
                  <Text style={[styles.roleText, { color: getRoleColor(member.role) }]}>
                    {getRoleDisplay(member.role)}
                  </Text>
                </View>
                {isOwner && member.role !== 'OWNER' && (
                  <View style={styles.memberActions}>
                    <TouchableOpacity
                      style={styles.actionIcon}
                      onPress={() => handleChangeRole(member.memberId, member.role)}
                    >
                      <Ionicons name="settings-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionIcon}
                      onPress={() => handleRemoveMember(member.memberId)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* 그룹 섹션 - OWNER만 표시 */}
        {isOwner && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>그룹 ({groups.length})</Text>
              <TouchableOpacity onPress={() => setShowCreateGroupModal(true)}>
                <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            {groups.length === 0 ? (
              <Text style={styles.emptyText}>아직 생성된 그룹이 없습니다.</Text>
            ) : (
              groups.map((group) => (
                <TouchableOpacity
                  key={group.groupId}
                  style={styles.groupItem}
                  onPress={() => router.push({
                    pathname: '/group-detail',
                    params: { groupId: group.groupId.toString(), groupName: group.groupName }
                  })}
                >
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.groupName}</Text>
                    {group.description && (
                      <Text style={styles.groupDescription}>{group.description}</Text>
                    )}
                    <Text style={styles.groupMemberCount}>멤버 {group.memberCount}명</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* 가계부 참가하기 버튼 - 모든 사용자에게 표시 */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.joinBookButton}
            onPress={() => router.push('/join-book')}
          >
            <Ionicons name="enter-outline" size={20} color="#007AFF" />
            <Text style={styles.joinBookButtonText}>다른 가계부 참가하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 그룹 생성 모달 */}
      <Modal
        visible={showCreateGroupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새 그룹 만들기</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="그룹 이름"
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="그룹 설명 (선택사항)"
              value={newGroupDescription}
              onChangeText={setNewGroupDescription}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowCreateGroupModal(false);
                  setNewGroupName('');
                  setNewGroupDescription('');
                }}
              >
                <Text style={styles.modalCancelButtonText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCreateButton]}
                onPress={handleCreateGroup}
              >
                <Text style={styles.modalCreateButtonText}>생성</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 0,
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  inviteButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  requestEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  rejectButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
  },
  memberRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    padding: 4,
  },
  roleTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  groupMemberCount: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  joinBookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  joinBookButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  modalCreateButton: {
    backgroundColor: '#007AFF',
  },
  modalCreateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
}); 