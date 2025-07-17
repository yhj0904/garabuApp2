import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface Comment {
  id: number;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: string;
  canDelete: boolean;
}

interface CommentSectionProps {
  type: 'book' | 'ledger';
  targetId: number;
}

export default function CommentSection({ type, targetId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadComments();
  }, [type, targetId]);

  const loadComments = async (pageNum = 0) => {
    if (loading) return;
    
    try {
      setLoading(true);
      const endpoint = type === 'book' 
        ? `/api/v2/comments/book/${targetId}`
        : `/api/v2/comments/ledger/${targetId}`;
      
      const response = await apiClient.get(endpoint, {
        params: { page: pageNum, size: 20 }
      });
      
      if (pageNum === 0) {
        setComments(response.data.content);
      } else {
        setComments(prev => [...prev, ...response.data.content]);
      }
      
      setHasMore(!response.data.last);
      setPage(pageNum);
    } catch (error) {
      console.error('댓글 로드 실패:', error);
      Alert.alert('오류', '댓글을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadComments(0);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadComments(page + 1);
    }
  };

  const createComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const endpoint = type === 'book'
        ? `/api/v2/comments/book/${targetId}`
        : `/api/v2/comments/ledger/${targetId}`;
      
      await apiClient.post(endpoint, { content: newComment.trim() });
      setNewComment('');
      loadComments(0);
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      Alert.alert('오류', '댓글을 작성할 수 없습니다.');
    }
  };

  const deleteComment = async (commentId: number) => {
    Alert.alert(
      '댓글 삭제',
      '이 댓글을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/v2/comments/${commentId}`);
              setComments(prev => prev.filter(c => c.id !== commentId));
            } catch (error) {
              console.error('댓글 삭제 실패:', error);
              Alert.alert('오류', '댓글을 삭제할 수 없습니다.');
            }
          }
        }
      ]
    );
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <Text style={styles.authorName}>{item.authorName}</Text>
        <Text style={styles.commentDate}>
          {new Date(item.createdAt).toLocaleDateString('ko-KR')}
        </Text>
      </View>
      <Text style={styles.commentContent}>{item.content}</Text>
      {item.canDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteComment(item.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>댓글</Text>
        <Text style={styles.commentCount}>{comments.length}개</Text>
      </View>
      
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={item => item.id.toString()}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>아직 댓글이 없습니다.</Text>
        }
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="댓글을 입력하세요..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
          onPress={createComment}
          disabled={!newComment.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={newComment.trim() ? '#007AFF' : '#C0C0C0'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  commentCount: {
    fontSize: 14,
    color: '#6C757D',
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  commentItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  commentDate: {
    fontSize: 12,
    color: '#6C757D',
  },
  commentContent: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6C757D',
    fontSize: 14,
    marginTop: 32,
  },
});