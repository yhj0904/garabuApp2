import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFriendStore } from '@/stores/friendStore';
import { router } from 'expo-router';

export default function FriendsScreen() {
  const {
    friends,
    friendCount,
    pendingRequestCount,
    isLoading,
    loadFriends,
    loadFriendStatus,
    deleteFriend,
    setFriendAlias,
    searchFriends
  } = useFriendStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadFriends(),
      loadFriendStatus()
    ]);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setIsSearching(true);
      const results = await searchFriends(query);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleDeleteFriend = (friendshipId: number, friendName: string) => {
    Alert.alert(
      '친구 삭제',
      `${friendName}님을 친구에서 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteFriend(friendshipId);
            if (success) {
              Alert.alert('성공', '친구가 삭제되었습니다.');
            } else {
              Alert.alert('오류', '친구 삭제에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  const handleSetAlias = (friendshipId: number, currentAlias: string, friendName: string) => {
    Alert.prompt(
      '별칭 설정',
      `${friendName}님의 별칭을 설정하세요`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: async (alias) => {
            if (alias && alias.trim().length > 0) {
              const success = await setFriendAlias(friendshipId, alias.trim());
              if (success) {
                Alert.alert('성공', '별칭이 설정되었습니다.');
              } else {
                Alert.alert('오류', '별칭 설정에 실패했습니다.');
              }
            }
          }
        }
      ],
      'plain-text',
      currentAlias
    );
  };

  const renderFriendItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => router.push(`/friends/${item.friendshipId}`)}
    >
      <View style={styles.friendAvatar}>
        <Ionicons name="person" size={24} color="#666" />
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>
          {item.alias || item.name}
        </Text>
        <Text style={styles.friendUsername}>@{item.username}</Text>
        {item.alias && (
          <Text style={styles.friendRealName}>실명: {item.name}</Text>
        )}
      </View>
      <View style={styles.friendActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSetAlias(item.friendshipId, item.alias, item.name)}
        >
          <Ionicons name="create-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteFriend(item.friendshipId, item.alias || item.name)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const displayData = searchQuery.trim().length > 0 ? searchResults : friends;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>친구</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/friends/requests')}
          >
            <Ionicons name="person-add" size={24} color="#007AFF" />
            {pendingRequestCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequestCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/friends/groups')}
          >
            <Ionicons name="people" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="친구 검색..."
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{friendCount}</Text>
          <Text style={styles.statLabel}>친구</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{pendingRequestCount}</Text>
          <Text style={styles.statLabel}>대기 중</Text>
        </View>
      </View>

      <FlatList
        data={displayData}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.friendshipId.toString()}
        style={styles.friendsList}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadInitialData}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery.trim().length > 0 ? '검색 결과가 없습니다' : '친구가 없습니다'}
            </Text>
            <Text style={styles.emptySubText}>
              {searchQuery.trim().length > 0 ? '다른 키워드로 검색해보세요' : '새로운 친구를 추가해보세요'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/friends/add')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  headerButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 10,
    paddingVertical: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  friendsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  friendItem: {
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
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 15,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  friendUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  friendRealName: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  friendActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
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
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});