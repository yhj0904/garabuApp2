import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Category } from '@/core/api/client';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface CategorySelectorProps {
  selectedCategoryId?: number;
  onCategorySelect: (category: Category) => void;
  bookId?: number;
}

export default function CategorySelector({ selectedCategoryId, onCategorySelect, bookId }: CategorySelectorProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📝');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  const { categories, isLoading, fetchCategoriesByBook, createCategoryForBook } = useCategoryStore();
  const { currentBookId } = useBookStore();
  const { token } = useAuthStore();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const targetBookId = bookId || currentBookId;
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  useEffect(() => {
    if (targetBookId && token) {
      fetchCategoriesByBook(targetBookId, token);
    }
  }, [targetBookId, token]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('오류', '카테고리명을 입력해주세요.');
      return;
    }

    if (!targetBookId || !token) {
      Alert.alert('오류', '가계부 정보를 확인할 수 없습니다.');
      return;
    }

    setIsAddingCategory(true);
    
    try {
      const success = await createCategoryForBook(
        targetBookId,
        { category: newCategoryName.trim(), emoji: selectedEmoji },
        token
      );

      if (success) {
        setNewCategoryName('');
        setSelectedEmoji('📝');
        setIsModalVisible(false);
        Alert.alert('성공', '카테고리가 추가되었습니다.');
        // 카테고리 목록 새로고침
        fetchCategoriesByBook(targetBookId, token);
      } else {
        Alert.alert('오류', '카테고리 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('카테고리 추가 오류:', error);
      Alert.alert('오류', '카테고리 추가 중 오류가 발생했습니다.');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleCategoryPress = (category: Category) => {
    onCategorySelect(category);
  };

  const renderDefaultCategories = () => {
    const defaultCategories = categories.filter(cat => cat.isDefault);
    return defaultCategories.map((category) => (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryItem,
          { backgroundColor: colors.card },
          selectedCategoryId === category.id && { backgroundColor: colors.tint, opacity: 0.8 }
        ]}
        onPress={() => handleCategoryPress(category)}
      >
        <View style={styles.categoryContent}>
          <Text style={styles.categoryEmoji}>{category.emoji}</Text>
          <Text style={[
            styles.categoryText,
            { color: selectedCategoryId === category.id ? 'white' : colors.text }
          ]}>
            {category.category}
          </Text>
        </View>
      </TouchableOpacity>
    ));
  };

  const renderUserCategories = () => {
    const userCategories = categories.filter(cat => !cat.isDefault);
    return userCategories.map((category) => (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryItem,
          { backgroundColor: colors.card },
          selectedCategoryId === category.id && { backgroundColor: colors.tint, opacity: 0.8 }
        ]}
        onPress={() => handleCategoryPress(category)}
      >
        <View style={styles.categoryContent}>
          <Text style={styles.categoryEmoji}>
            {category.emoji || '📝'}
          </Text>
          <Text style={[
            styles.categoryText,
            { color: selectedCategoryId === category.id ? 'white' : colors.text }
          ]}>
            {category.category}
          </Text>
        </View>
      </TouchableOpacity>
    ));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>카테고리를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>분류</Text>
        {selectedCategory && (
          <Text style={[styles.selectedText, { color: colors.tint }]}>
            {selectedCategory.emoji} {selectedCategory.category}
          </Text>
        )}
      </View>

      <View style={styles.categoriesContainer}>
        {/* 기본 제공 카테고리 */}
        <View style={styles.defaultCategoriesGrid}>
          {renderDefaultCategories()}
        </View>

        {/* 사용자 정의 카테고리 */}
        {categories.filter(cat => !cat.isDefault).length > 0 && (
          <View style={styles.userCategoriesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>사용자 정의 카테고리</Text>
            <View style={styles.userCategoriesGrid}>
              {renderUserCategories()}
            </View>
          </View>
        )}

        {/* 추가 버튼 */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.card }]}
          onPress={() => setIsModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={colors.tint} />
          <Text style={[styles.addButtonText, { color: colors.tint }]}>카테고리 추가</Text>
        </TouchableOpacity>
      </View>

      {/* 카테고리 추가 모달 */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={[styles.modalCancel, { color: colors.tint }]}>취소</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>카테고리 추가</Text>
            <TouchableOpacity onPress={handleAddCategory} disabled={isAddingCategory}>
              <Text style={[styles.modalSave, { color: colors.tint }]}>
                {isAddingCategory ? '추가 중...' : '완료'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>아이콘 선택</Text>
              <View style={styles.emojiContainer}>
                {['📝', '💰', '🍔', '🚗', '🏠', '🎮', '📚', '💊', '👕', '🎬', '✈️', '🎵', '🏥', '🎨', '⚽', '💻'].map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiButton,
                      { backgroundColor: colors.card },
                      selectedEmoji === emoji && { backgroundColor: colors.tint }
                    ]}
                    onPress={() => setSelectedEmoji(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>카테고리명</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="카테고리명을 입력하세요"
                placeholderTextColor={colors.icon}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                autoFocus
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoriesContainer: {
    gap: 16,
  },
  defaultCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  userCategoriesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  userCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
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
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  emojiButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiText: {
    fontSize: 20,
  },
});