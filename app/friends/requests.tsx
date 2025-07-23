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
    <View style={styles.requestItem}>
      <View style={styles.requestAvatar}>
        <Ionicons name="person" size={24} color="#666" />
      </View>
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{item.requesterName}</Text>
        <Text style={styles.requestUsername}>@{item.requesterUsername}</Text>
        {item.requesterAlias && (
          <Text style={styles.requestAlias}>별칭: {item.requesterAlias}</Text>
        )}
        <Text style={styles.requestDate}>
          {new Date(item.requestedAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item.friendshipId, item.requesterName)}
        >
          <Text style={styles.acceptButtonText}>수락</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectRequest(item.friendshipId, item.requesterName)}
        >
          <Text style={styles.rejectButtonText}>거절</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSentRequestItem = ({ item }: { item: any }) => (
    <View style={styles.requestItem}>
      <View style={styles.requestAvatar}>
        <Ionicons name="person" size={24} color="#666" />
      </View>
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{item.addresseeName}</Text>
        <Text style={styles.requestUsername}>@{item.addresseeUsername}</Text>
        {item.requesterAlias && (
          <Text style={styles.requestAlias}>설정한 별칭: {item.requesterAlias}</Text>
        )}
        <Text style={styles.requestDate}>
          {new Date(item.requestedAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.requestActions}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>대기 중</Text>
        </View>
      </View>
    </View>
  );

  const currentData = activeTab === 'received' ? friendRequests : sentRequests;

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'received' && styles.activeTab
          ]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'received' && styles.activeTabText
          ]}>
            받은 요청 ({friendRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'sent' && styles.activeTab
          ]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'sent' && styles.activeTabText
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
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {activeTab === 'received' ? '받은 친구 요청이 없습니다' : '보낸 친구 요청이 없습니다'}
            </Text>
            <Text style={styles.emptySubText}>
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
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
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
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
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
    color: '#333',
  },
  requestUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  requestAlias: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
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
    backgroundColor: '#007AFF',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
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
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
});