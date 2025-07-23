import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useFriendStore } from '@/stores/friendStore';

export default function FriendDetailScreen() {
  const { id } = useLocalSearchParams();
  const { friends } = useFriendStore();
  const [friend, setFriend] = useState<any>(null);

  useEffect(() => {
    // Find friend by ID
    const foundFriend = friends.find(f => f.friendshipId.toString() === id);
    if (foundFriend) {
      setFriend(foundFriend);
    }
  }, [id, friends]);

  if (!friend) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>친구 정보를 찾을 수 없습니다</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color="#666" />
          </View>
          <Text style={styles.name}>{friend.alias || friend.name}</Text>
          <Text style={styles.username}>@{friend.username}</Text>
          {friend.alias && (
            <Text style={styles.realName}>실명: {friend.name}</Text>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>친구 정보</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>친구 상태</Text>
            <Text style={styles.infoValue}>활성</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>친구가 된 날짜</Text>
            <Text style={styles.infoValue}>2024년 1월 1일</Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.alert('준비중', '공유 가계부 기능은 준비중입니다.');
            }}
          >
            <Ionicons name="book-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>가계부 공유하기</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => {
              Alert.alert(
                '친구 삭제',
                `${friend.alias || friend.name}님을 친구에서 삭제하시겠습니까?`,
                [
                  { text: '취소', style: 'cancel' },
                  {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                      // Delete friend logic
                      router.back();
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>
              친구 삭제
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 30,
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    color: '#666',
  },
  realName: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  infoSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  actionSection: {
    paddingHorizontal: 20,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 15,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  deleteButton: {
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});