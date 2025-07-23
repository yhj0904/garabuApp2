import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  RefreshControl, 
  Alert 
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedCard } from '@/components/ThemedCard';
import { ThemedButton } from '@/components/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useFriendStore } from '@/stores/friendStore';

export default function FriendsScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const {
    friends,
    friendRequests,
    friendCount,
    pendingRequestCount,
    isLoading,
    loadFriends,
    loadFriendRequests,
    loadFriendStatus,
    acceptFriendRequest,
    rejectFriendRequest,
    deleteFriend
  } = useFriendStore();
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        loadFriends(),
        loadFriendRequests(), 
        loadFriendStatus()
      ]);
    } catch (error) {
      console.error('친구 데이터 로드 실패:', error);
    }
  };

  const onRefresh = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRefreshing(true);
      await loadData();
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcceptRequest = async (friendshipId: number) => {
    const success = await acceptFriendRequest(friendshipId);
    if (success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('성공', '친구 요청을 수락했습니다.');
    } else {
      Alert.alert('오류', '친구 요청 수락에 실패했습니다.');
    }
  };

  const handleRejectRequest = async (friendshipId: number) => {
    Alert.alert(
      '친구 요청 거절',
      '이 친구 요청을 거절하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '거절',
          style: 'destructive',
          onPress: async () => {
            const success = await rejectFriendRequest(friendshipId);
            if (success) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              Alert.alert('오류', '친구 요청 거절에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteFriend = async (friendshipId: number, friendName: string) => {
    Alert.alert(
      '친구 삭제',
      `${friendName}님을 친구 목록에서 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteFriend(friendshipId);
            if (success) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              Alert.alert('오류', '친구 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ThemedText type="title">친구</ThemedText>
            <ThemedText type="body" variant="secondary">
              {friendCount}명의 친구
            </ThemedText>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => router.push('/friends/add')}
            >
              <Ionicons name="person-add" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => router.push('/friends/groups')}
            >
              <Ionicons name="people" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 친구 요청 알림 */}
        {pendingRequestCount > 0 && (
          <TouchableOpacity
            style={[styles.requestBanner, { backgroundColor: colors.primaryLight + '20' }]}
            onPress={() => router.push('/friends/requests')}
          >
            <View style={[styles.requestBadge, { backgroundColor: colors.primary }]}>
              <ThemedText type="caption" variant="inverse" weight="semibold">
                {pendingRequestCount}
              </ThemedText>
            </View>
            <ThemedText type="body" variant="primary" weight="medium">
              새로운 친구 요청이 있습니다
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* 받은 친구 요청 */}
        {friendRequests && friendRequests.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              받은 친구 요청
            </ThemedText>
            {friendRequests.slice(0, 3).map((request) => (
              <ThemedCard key={request.friendshipId} variant="default" style={styles.requestCard}>
                <View style={styles.requestContent}>
                  <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                    <ThemedText type="body" weight="semibold" variant="primary">
                      {request.requesterName.charAt(0)}
                    </ThemedText>
                  </View>
                  <View style={styles.requestInfo}>
                    <ThemedText type="body" weight="medium">
                      {request.requesterName}
                    </ThemedText>
                    <ThemedText type="caption" variant="tertiary">
                      @{request.requesterUsername}
                    </ThemedText>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.requestButton, { backgroundColor: colors.success }]}
                      onPress={() => handleAcceptRequest(request.friendshipId)}
                    >
                      <Ionicons name="checkmark" size={16} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.requestButton, { backgroundColor: colors.error }]}
                      onPress={() => handleRejectRequest(request.friendshipId)}
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </ThemedCard>
            ))}
            {friendRequests.length > 3 && (
              <TouchableOpacity onPress={() => router.push('/friends/requests')}>
                <ThemedText type="body" variant="primary" style={styles.viewAll}>
                  모든 요청 보기 ({friendRequests.length})
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 친구 목록 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            친구 목록
          </ThemedText>
          
          {!friends || friends.length === 0 ? (
            <ThemedCard variant="outlined" style={styles.emptyCard}>
              <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
              <ThemedText type="body" variant="tertiary" style={styles.emptyText}>
                아직 친구가 없습니다
              </ThemedText>
              <ThemedButton
                title="친구 추가하기"
                onPress={() => router.push('/friends/add')}
                variant="primary"
                size="small"
                style={styles.emptyButton}
              />
            </ThemedCard>
          ) : (
            (friends || []).map((friend) => (
              <TouchableOpacity
                key={friend.friendshipId}
                onPress={() => router.push(`/friends/${friend.friendshipId}`)}
              >
                <ThemedCard variant="default" style={styles.friendCard}>
                  <View style={styles.friendContent}>
                    <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                      <ThemedText type="body" weight="semibold" variant="primary">
                        {(friend.alias || friend.name).charAt(0)}
                      </ThemedText>
                    </View>
                    <View style={styles.friendInfo}>
                      <ThemedText type="body" weight="medium">
                        {friend.alias || friend.name}
                      </ThemedText>
                      <ThemedText type="caption" variant="tertiary">
                        @{friend.username}
                      </ThemedText>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteFriend(friend.friendshipId, friend.alias || friend.name);
                      }}
                    >
                      <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </ThemedCard>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  requestBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  requestCard: {
    marginBottom: 12,
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAll: {
    textAlign: 'center',
    marginTop: 8,
  },
  friendCard: {
    marginBottom: 12,
  },
  friendContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deleteButton: {
    padding: 8,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
});