import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFriendStore } from '@/stores/friendStore';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function FriendRequestsScreen() {
  const {
    friendRequests,
    sentRequests,
    isLoading,
    loadFriendRequests,
    loadSentRequests,
    acceptFriendRequest,
    rejectFriendRequest
  } = useFriendStore();

  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const { colors, isDarkMode } = useTheme();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadFriendRequests(),
      loadSentRequests()
    ]);
  };

  const handleAcceptRequest = (friendshipId: number, requesterName: string) => {
    Alert.prompt(
      '친구 요청 수락',
      `${requesterName}님의 친구 요청을 수락하시겠습니까?\n별칭을 설정하세요 (선택사항)`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '수락',
          onPress: async (alias) => {
            const success = await acceptFriendRequest(friendshipId, alias?.trim());
            if (success) {
              Alert.alert('성공', '친구 요청이 수락되었습니다.');
            } else {
              Alert.alert('오류', '친구 요청 수락에 실패했습니다.');
            }
          }
        }
      ],
      'plain-text',
      ''
    );
  };

  const handleRejectRequest = (friendshipId: number, requesterName: string) => {
    Alert.alert(
      '친구 요청 거절',
      `${requesterName}님의 친구 요청을 거절하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '거절',
          style: 'destructive',
          onPress: async () => {
            const success = await rejectFriendRequest(friendshipId);
            if (success) {
              Alert.alert('완료', '친구 요청이 거절되었습니다.');
            } else {
              Alert.alert('오류', '친구 요청 거절에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  const renderReceivedRequestItem = ({ item }: { item: any }) => (
    <View style={[styles.requestItem, { backgroundColor: colors.card, shadowColor: isDarkMode ? colors.text : '#000' }]}>
      <View style={[styles.requestAvatar, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="person" size={24} color={colors.textSecondary} />
      </View>
      <View style={styles.requestInfo}>
        <Text style={[styles.requestName, { color: colors.text }]}>{item.requesterName}</Text>
        <Text style={[styles.requestUsername, { color: colors.textSecondary }]}>@{item.requesterUsername}</Text>
        {item.requesterAlias && (
          <Text style={[styles.requestAlias, { color: colors.primary }]}>별칭: {item.requesterAlias}</Text>
        )}
        <Text style={[styles.requestDate, { color: colors.textTertiary }]}>
          {new Date(item.requestedAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.success }]}
          onPress={() => handleAcceptRequest(item.friendshipId, item.requesterName)}
        >
          <Text style={styles.acceptButtonText}>수락</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton, { backgroundColor: colors.error }]}
          onPress={() => handleRejectRequest(item.friendshipId, item.requesterName)}
        >
          <Text style={styles.rejectButtonText}>거절</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSentRequestItem = ({ item }: { item: any }) => (
    <View style={[styles.requestItem, { backgroundColor: colors.card, shadowColor: isDarkMode ? colors.text : '#000' }]}>
      <View style={[styles.requestAvatar, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="person" size={24} color={colors.textSecondary} />
      </View>
      <View style={styles.requestInfo}>
        <Text style={[styles.requestName, { color: colors.text }]}>{item.addresseeName}</Text>
        <Text style={[styles.requestUsername, { color: colors.textSecondary }]}>@{item.addresseeUsername}</Text>
        {item.requesterAlias && (
          <Text style={[styles.requestAlias, { color: colors.primary }]}>설정한 별칭: {item.requesterAlias}</Text>
        )}
        <Text style={[styles.requestDate, { color: colors.textTertiary }]}>
          {new Date(item.requestedAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.requestActions}>
        <View style={[styles.statusBadge, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>대기 중</Text>
        </View>
      </View>
    </View>
  );

  const currentData = activeTab === 'received' ? friendRequests : sentRequests;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'received' && [styles.activeTab, { borderBottomColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[
            styles.tabText,
            { color: colors.textSecondary },
            activeTab === 'received' && [styles.activeTabText, { color: colors.primary }]
          ]}>
            받은 요청 ({friendRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'sent' && [styles.activeTab, { borderBottomColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[
            styles.tabText,
            { color: colors.textSecondary },
            activeTab === 'sent' && [styles.activeTabText, { color: colors.primary }]
          ]}>
            보낸 요청 ({sentRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentData}
        renderItem={activeTab === 'received' ? renderReceivedRequestItem : renderSentRequestItem}
        keyExtractor={(item) => item.friendshipId.toString()}
        style={styles.requestsList}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadInitialData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === 'received' ? '받은 친구 요청이 없습니다' : '보낸 친구 요청이 없습니다'}
            </Text>
            <Text style={[styles.emptySubText, { color: colors.textTertiary }]}>
              {activeTab === 'received' ? '새로운 친구 요청을 기다려보세요' : '새로운 친구를 추가해보세요'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
  },
  tabText: {
    fontSize: 16,
  },
  activeTabText: {
    fontWeight: '600',
  },
  requestsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
    marginLeft: 15,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  requestAlias: {
    fontSize: 12,
    marginTop: 2,
  },
  requestDate: {
    fontSize: 12,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  acceptButton: {
  },
  rejectButton: {
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 5,
  },
});