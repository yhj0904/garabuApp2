import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import { getMyJoinRequests } from '@/services/inviteService';
import type { JoinRequestResponse } from '@/services/inviteService';

export default function ProfileModal() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors, isDarkMode } = useTheme();

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [myRequests, setMyRequests] = useState<JoinRequestResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMyRequests();
  }, []);

  const loadMyRequests = async () => {
    try {
      setLoading(true);
      const requests = await getMyJoinRequests();
      setMyRequests(requests);
    } catch (error) {
      console.error('요청 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    Alert.alert('성공', '프로필이 저장되었습니다.');
    router.back();
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return '대기 중';
      case 'ACCEPTED': return '승인됨';
      case 'REJECTED': return '거절됨';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return colors.warning || '#FFB800';
      case 'ACCEPTED': return colors.success || '#34C759';
      case 'REJECTED': return colors.error || '#FF3B30';
      default: return colors.textSecondary || '#666';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">프로필</ThemedText>
          <TouchableOpacity onPress={handleSave}>
            <ThemedText style={[styles.saveButton, { color: colors.primary }]}>저장</ThemedText>
          </TouchableOpacity>
        </View>

        {/* 프로필 정보 */}
        <View style={styles.profileSection}>
          <View style={[styles.profileImage, { backgroundColor: colors.background }]}>
            <Ionicons name="person" size={48} color={colors.primary} />
          </View>
          
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>사용자명</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={username}
              onChangeText={setUsername}
              placeholder="사용자명을 입력하세요"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>이메일</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="이메일을 입력하세요"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* 사용자 ID 섹션 */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>내 식별 코드</ThemedText>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() => router.push('/user-id-code')}
          >
            <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
            <ThemedText style={styles.actionButtonText}>내 식별 코드 생성</ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 가계부 참가 요청 목록 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>내 가계부 참가 요청</ThemedText>
            <TouchableOpacity onPress={loadMyRequests}>
              <Ionicons name="refresh" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
          ) : myRequests.length === 0 ? (
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>참가 요청한 가계부가 없습니다.</ThemedText>
          ) : (
            <View style={styles.requestList}>
              {myRequests.map((request) => (
                <View key={request.requestId} style={[styles.requestItem, { backgroundColor: colors.card }]}>
                  <View style={styles.requestInfo}>
                    <ThemedText style={styles.bookTitle}>{request.bookTitle}</ThemedText>
                    <ThemedText style={[styles.requestDate, { color: colors.textSecondary }]}>
                      요청일: {new Date(request.requestDate).toLocaleDateString('ko-KR')}
                    </ThemedText>
                    <ThemedText style={[styles.requestRole, { color: colors.textSecondary }]}>
                      요청 권한: {request.requestedRole === 'VIEWER' ? '조회자' : '편집자'}
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
                    <ThemedText style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                      {getStatusText(request.status)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 다른 가계부 참가하기 버튼 */}
        <TouchableOpacity
          style={[styles.joinButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/join-book')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <ThemedText style={styles.joinButtonText}>다른 가계부 참가하기</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
  },
  requestList: {
    gap: 12,
  },
  requestItem: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  requestRole: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 32,
    marginBottom: 20,
    gap: 8,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 