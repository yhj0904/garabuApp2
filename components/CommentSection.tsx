import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { ThemedText } from '@/components/ThemedText';
import { ThemedInput } from '@/components/ThemedInput';
import { ThemedButton } from '@/components/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';

interface LocalComment {
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
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuthStore();
  const { colors } = useTheme();

  useEffect(() => {
    loadComments();
  }, [type, targetId]);

  const loadComments = async (pageNum = 0) => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      const response = type === 'book' 
        ? await apiService.getBookComments(targetId)
        : await apiService.getLedgerComments(targetId);
      
      // apiService는 페이징을 지원하지 않으므로 전체 댓글을 가져옴
      if (response && response.comments) {
        // API Comment를 LocalComment로 변환
        const localComments: LocalComment[] = response.comments.map((comment: any) => ({
          ...comment,
          canDelete: comment.authorId === user?.id
        }));
        setComments(localComments);
        setHasMore(false); // 페이징 없음
      }
      
      setPage(pageNum);
    } catch (error: any) {
      console.error('댓글 로드 실패:', error);
      // 500 에러인 경우 빈 댓글 목록으로 처리
      if (error.response?.status === 500) {
        setComments([]);
        console.log('서버 오류로 인해 댓글을 불러올 수 없습니다.');
      } else {
        Alert.alert('오류', '댓글을 불러올 수 없습니다.');
      }
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
      const commentData = { 
        content: newComment.trim(),
        commentType: type === 'book' ? 'BOOK' : 'LEDGER'
      };
      
      if (type === 'book') {
        await apiService.createBookComment(targetId, commentData);
      } else {
        await apiService.createLedgerComment(targetId, commentData);
      }
      
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
              await apiService.deleteComment(commentId);
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

  const renderComment = ({ item }: { item: LocalComment }) => (
    <View style={[styles.commentItem, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
      <View style={styles.commentHeader}>
        <ThemedText type="body" weight="semibold" style={styles.authorName}>{item.authorName}</ThemedText>
        <ThemedText type="caption" variant="secondary" style={styles.commentDate}>
          {new Date(item.createdAt).toLocaleDateString('ko-KR')}
        </ThemedText>
      </View>
      <ThemedText type="body" style={styles.commentContent}>{item.content}</ThemedText>
      {item.canDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteComment(item.id)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ThemedText type="subtitle" style={styles.headerTitle}>댓글</ThemedText>
        <ThemedText type="caption" variant="secondary" style={styles.commentCount}>{comments.length}개</ThemedText>
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
          <ThemedText type="body" variant="tertiary" style={styles.emptyText}>아직 댓글이 없습니다.</ThemedText>
        }
      />
      
      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <ThemedInput
            style={[styles.input, { color: colors.text }]}
            placeholder="댓글을 입력하세요..."
            placeholderTextColor={colors.textTertiary}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <View style={[styles.inputFooter, { borderTopColor: colors.border }]}>
            <ThemedText type="caption" variant="tertiary" style={styles.charCount}>
              {newComment.length}/500
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.sendButton,
                { 
                  backgroundColor: newComment.trim() ? colors.primary : colors.borderLight,
                  shadowColor: colors.shadow
                },
                !newComment.trim() && styles.sendButtonDisabled
              ]}
              onPress={createComment}
              disabled={!newComment.trim()}
              activeOpacity={0.8}
            >
              <Ionicons
                name="send"
                size={18}
                color={newComment.trim() ? colors.textInverse : colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  commentCount: {
    fontSize: 14,
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  commentItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: 'transparent', // Will be overridden by inline style
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
  },
  commentDate: {
    fontSize: 12,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  inputWrapper: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    minHeight: 60,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'transparent', // Will be overridden by inline style
  },
  charCount: {
    fontSize: 12,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'transparent', // Will be overridden by inline style
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 32,
  },
});