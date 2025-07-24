import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import type { Category } from '@/core/api/client';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsEvents } from '@/utils/analytics';

export default function ManageCategoriesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📝');
  const [isLoading, setIsLoading] = useState(false);

  const { token } = useAuthStore();
  const { currentBook } = useBookStore();
  const { 
    categories, 
    fetchCategories, 
    fetchCategoriesByBook, 
    deleteCategory, 
    deleteCategoryForBook,
    createCategory,
    createCategoryForBook 
  } = useCategoryStore();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { logEvent, logScreenView } = useAnalytics();

  useEffect(() => {
    logScreenView('manage_categories_modal', 'ManageCategoriesScreen');
    logEvent(AnalyticsEvents.MODAL_OPEN, { modal_name: 'manage_categories' });
  }, []);

  useEffect(() => {
    if (token) {
      loadCategories();
    }
  }, [token, currentBook]);

  const loadCategories = async () => {
    if (!token || !currentBook) return;
    
    try {
      // 가계부별 카테고리만 로드 (기본 카테고리 포함)
      await fetchCategoriesByBook(currentBook.id, token);
      setAllCategories(categories);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
    }
  };

  const onRefresh = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRefreshing(true);
      await loadCategories();
    } catch (error) {
      console.error('새로고침 실패:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!token || !currentBook) return;
    
    Alert.alert(
      '카테고리 삭제',
      `"${category.category}" 카테고리를 삭제하시겠습니까?\n\n삭제된 카테고리는 복구할 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              
              const result = await deleteCategoryForBook(currentBook.id, category.id, token);
              if (result.success) {
                setAllCategories(prev => prev.filter(c => c.id !== category.id));
                logEvent(AnalyticsEvents.CATEGORY_DELETE, {
                  category_id: category.id,
                  category_name: category.category,
                  source: 'manage_categories_modal'
                });
                console.log('카테고리 삭제 완료:', category.category);
              }
            } catch (error) {
              console.error('카테고리 삭제 실패:', error);
              Alert.alert('오류', '카테고리를 삭제하는 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('오류', '카테고리명을 입력해주세요.');
      return;
    }

    if (!token || !currentBook) return;

    setIsLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await createCategoryForBook(currentBook.id, { 
        category: categoryName.trim(),
        emoji: selectedEmoji 
      }, token);
      
      if (result.success) {
        await loadCategories();
        setShowAddModal(false);
        setCategoryName('');
        setSelectedEmoji('📝');
        
        logEvent(AnalyticsEvents.CATEGORY_CREATE, {
          category_name: categoryName.trim(),
          emoji: selectedEmoji,
          book_id: currentBook.id,
          source: 'manage_categories_modal'
        });
        
        Alert.alert('성공', '카테고리가 추가되었습니다.');
      } else if (result.error === 'duplicate') {
        Alert.alert('알림', '이미 존재하는 카테고리입니다.');
      }
    } catch (error) {
      console.error('카테고리 추가 실패:', error);
      Alert.alert('오류', '카테고리 추가에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoryItem = (category: Category) => (
    <View key={category.id} style={[styles.categoryItem, { backgroundColor: colors.card }]}>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryEmoji}>{category.emoji || '📝'}</Text>
        <View style={styles.categoryDetails}>
          <ThemedText style={[styles.categoryName, { color: colors.text }]}>
            {category.category}
          </ThemedText>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteCategory(category)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>카테고리 관리</ThemedText>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.background}
          />
        }
      >
        {/* 카테고리 섹션 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>카테고리</ThemedText>
          <ThemedText style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            현재 가계부에서 사용할 수 있는 카테고리입니다.
          </ThemedText>
          
          {allCategories.length > 0 ? (
            <View style={styles.categoryList}>
              {allCategories.map(renderCategoryItem)}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Ionicons name="pricetag-outline" size={48} color={colors.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                등록된 카테고리가 없습니다
              </ThemedText>
              <TouchableOpacity
                style={[styles.emptyAddButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.emptyAddButtonText}>카테고리 추가</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 카테고리 추가 모달 */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>카테고리 추가</Text>
            <View style={styles.modalCloseButton} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* 아이콘 선택 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>아이콘 선택</Text>
              <View style={styles.emojiContainer}>
                {['📝', '💰', '🍔', '🚗', '🏠', '🎮', '📚', '💊', '👕', '🎬', '✈️', '🎵', '🏥', '🎨', '⚽', '💻'].map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiButton,
                      { backgroundColor: colors.card },
                      selectedEmoji === emoji && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setSelectedEmoji(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 카테고리명 입력 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>카테고리명</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="카테고리명을 입력하세요"
                placeholderTextColor={colors.textTertiary}
                value={categoryName}
                onChangeText={setCategoryName}
                autoFocus
              />
            </View>

            {/* 추가 버튼 */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
              onPress={handleAddCategory}
              disabled={isLoading}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {isLoading ? '추가 중...' : '카테고리 추가'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  categoryList: {
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  emptyAddButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalCloseButton: {
    padding: 8,
    width: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  submitButton: {
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  emojiButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiText: {
    fontSize: 24,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});