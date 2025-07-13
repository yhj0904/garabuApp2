import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBookJoinRequests, acceptJoinRequest, rejectJoinRequest } from '../../services/inviteService';
import type { JoinRequestResponse } from '../../services/inviteService';
import apiService from '../../services/api';

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>가계부 설정</Text>
        <View style={{ width: 24 }} />
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
                pathname: '/(modals)/invite-code',
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
            {joinRequests.map((request, index) => (
              <View key={`request-${request.requestId || index}`} style={styles.requestItem}>
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
          {members.map((member, index) => (
            <View key={`member-${member.memberId || index}`} style={styles.memberItem}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.username}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
              <View style={[styles.roleTag, { backgroundColor: getRoleColor(member.role) + '20' }]}>
                <Text style={[styles.roleText, { color: getRoleColor(member.role) }]}>
                  {getRoleDisplay(member.role)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 가계부 참가하기 버튼 - 모든 사용자에게 표시 */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.joinBookButton}
            onPress={() => router.push('/(modals)/join-book')}
          >
            <Ionicons name="enter-outline" size={20} color="#007AFF" />
            <Text style={styles.joinBookButtonText}>다른 가계부 참가하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
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
  roleTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
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
});