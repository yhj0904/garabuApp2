import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedCard } from './ThemedCard';
import { ThemedButton } from './ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import apiService from '@/services/api';

interface MemoSectionProps {
  bookId: number;
}

interface MemoData {
  id: number;
  bookId: number;
  title?: string;
  content: string;
  important: boolean;
  color?: string;
  authorId: number;
  authorName: string;
  lastEditorId?: number;
  lastEditorName?: string;
  createdAt: string;
  updatedAt: string;
}

const MEMO_COLORS = [
  '#FFE4B5', // Moccasin
  '#E6E6FA', // Lavender
  '#F0E68C', // Khaki
  '#FFB6C1', // LightPink
  '#98FB98', // PaleGreen
  '#87CEEB', // SkyBlue
  '#DDA0DD', // Plum
  '#F5DEB3', // Wheat
];

export default function MemoSection({ bookId }: MemoSectionProps) {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const [memo, setMemo] = useState<MemoData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [isImportant, setIsImportant] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMemo();
  }, [bookId]);

  const loadMemo = async () => {
    try {
      setLoading(true);
      const memoData = await apiService.getBookMemo(bookId);
      setMemo(memoData);
      setTitle(memoData.title || '');
      setContent(memoData.content);
      setSelectedColor(memoData.color);
      setIsImportant(memoData.important);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // 메모가 없는 경우 - 정상적인 상태
        setMemo(null);
      } else {
        console.error('메모 로드 실패:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('알림', '메모 내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const request = {
        title: title.trim() || undefined,
        content: content.trim(),
        important: isImportant,
        color: selectedColor,
      };
      
      const updatedMemo = await apiService.createOrUpdateBookMemo(bookId, request);
      setMemo(updatedMemo);
      setIsEditing(false);
      Alert.alert('성공', '메모가 저장되었습니다.');
    } catch (error) {
      console.error('메모 저장 실패:', error);
      Alert.alert('오류', '메모 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '메모 삭제',
      '메모를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await apiService.deleteBookMemo(bookId);
              setMemo(null);
              setTitle('');
              setContent('');
              setSelectedColor(undefined);
              setIsImportant(false);
              Alert.alert('성공', '메모가 삭제되었습니다.');
            } catch (error) {
              console.error('메모 삭제 실패:', error);
              Alert.alert('오류', '메모 삭제에 실패했습니다.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    setIsEditing(true);
    if (memo) {
      setTitle(memo.title || '');
      setContent(memo.content);
      setSelectedColor(memo.color);
      setIsImportant(memo.important);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (memo) {
      setTitle(memo.title || '');
      setContent(memo.content);
      setSelectedColor(memo.color);
      setIsImportant(memo.important);
    } else {
      setTitle('');
      setContent('');
      setSelectedColor(undefined);
      setIsImportant(false);
    }
  };

  if (loading) {
    return (
      <ThemedCard variant="elevated" style={styles.container}>
        <ThemedText type="body" variant="tertiary">로딩 중...</ThemedText>
      </ThemedCard>
    );
  }

  if (!memo && !isEditing) {
    return (
      <ThemedCard variant="elevated" style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
          <ThemedText type="body" variant="tertiary" style={styles.emptyText}>
            가계부 메모가 없습니다
          </ThemedText>
          <ThemedButton
            variant="primary"
            size="small"
            onPress={() => setIsEditing(true)}
            style={styles.addButton}
          >
            메모 작성하기
          </ThemedButton>
        </View>
      </ThemedCard>
    );
  }

  if (isEditing) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ThemedCard
          variant="elevated"
          style={[
            styles.editContainer,
            selectedColor && { backgroundColor: selectedColor }
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.editHeader}>
              <ThemedText type="subtitle">메모 {memo ? '수정' : '작성'}</ThemedText>
              <View style={styles.editActions}>
                <TouchableOpacity onPress={handleCancel} style={styles.iconButton}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.iconButton}>
                  <Ionicons name="checkmark" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={[styles.titleInput, { color: colors.text }]}
              placeholder="제목 (선택사항)"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />

            <TextInput
              style={[styles.contentInput, { color: colors.text }]}
              placeholder="메모 내용을 입력하세요..."
              placeholderTextColor={colors.textTertiary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={5000}
            />

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.importantToggle}
                onPress={() => setIsImportant(!isImportant)}
              >
                <Ionicons
                  name={isImportant ? 'star' : 'star-outline'}
                  size={24}
                  color={isImportant ? colors.warning : colors.textSecondary}
                />
                <ThemedText type="body" style={styles.importantText}>
                  중요 표시
                </ThemedText>
              </TouchableOpacity>

              <View style={styles.colorPicker}>
                <ThemedText type="caption" variant="secondary" style={styles.colorLabel}>
                  배경색:
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[
                      styles.colorOption,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      !selectedColor && styles.selectedColor
                    ]}
                    onPress={() => setSelectedColor(undefined)}
                  >
                    <Ionicons name="close" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                  {MEMO_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.selectedColor
                      ]}
                      onPress={() => setSelectedColor(color)}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>
          </ScrollView>
        </ThemedCard>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ThemedCard
      variant="elevated"
      style={[
        styles.container,
        memo?.color && { backgroundColor: memo.color }
      ]}
    >
      <View style={styles.memoHeader}>
        <View style={styles.memoTitleContainer}>
          {memo?.important && (
            <Ionicons name="star" size={20} color={colors.warning} style={styles.importantIcon} />
          )}
          {memo?.title && (
            <ThemedText type="subtitle" style={styles.memoTitle}>
              {memo.title}
            </ThemedText>
          )}
        </View>
        <View style={styles.memoActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.iconButton}>
            <Ionicons name="pencil" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ThemedText type="body" style={styles.memoContent}>
        {memo?.content}
      </ThemedText>

      <View style={styles.memoFooter}>
        <ThemedText type="caption" variant="tertiary">
          작성: {memo?.authorName} • {new Date(memo?.createdAt || '').toLocaleDateString('ko-KR')}
        </ThemedText>
        {memo?.lastEditorId && (
          <ThemedText type="caption" variant="tertiary">
            수정: {memo.lastEditorName} • {new Date(memo.updatedAt).toLocaleDateString('ko-KR')}
          </ThemedText>
        )}
      </View>
    </ThemedCard>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 12,
    marginBottom: 16,
  },
  addButton: {
    marginTop: 8,
  },
  editContainer: {
    margin: 16,
    padding: 16,
    minHeight: 300,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editActions: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    padding: 8,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 150,
    padding: 8,
  },
  optionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  importantToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  importantText: {
    marginLeft: 8,
  },
  colorPicker: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorLabel: {
    marginRight: 12,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderColor: '#007AFF',
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  memoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  importantIcon: {
    marginRight: 8,
  },
  memoTitle: {
    flex: 1,
  },
  memoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  memoContent: {
    lineHeight: 24,
    marginBottom: 16,
  },
  memoFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});