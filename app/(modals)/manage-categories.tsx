import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  RefreshControl,
  Text,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Category } from '@/services/api';

export default function ManageCategoriesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [globalCategories, setGlobalCategories] = useState<Category[]>([]);
  const [bookCategories, setBookCategories] = useState<Category[]>([]);

  const { token } = useAuthStore();
  const { currentBook } = useBookStore();
  const { 
    categories, 
    fetchCategories, 
    fetchCategoriesForBook, 
    deleteCategory, 
    deleteCategoryForBook 
  } = useCategoryStore();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (token) {
      loadCategories();
    }
  }, [token, currentBook]);

  const loadCategories = async () => {
    if (!token) return;
    
    try {
      // 전역 카테고리 로드
      await fetchCategories(token);
      
      // 가계부별 카테고리 로드
      if (currentBook) {
        await fetchCategoriesForBook(currentBook.id, token);
      }
      
      // 카테고리 분류
      const globals = categories.filter(cat => !cat.bookId);
      const bookSpecific = categories.filter(cat => cat.bookId === currentBook?.id);
      
      setGlobalCategories(globals);
      setBookCategories(bookSpecific);
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
    if (!token) return;
    
    const isGlobal = !category.bookId;
    const categoryType = isGlobal ? '전역' : '가계부';
    
    Alert.alert(
      '카테고리 삭제',
      `"${category.category}" ${categoryType} 카테고리를 삭제하시겠습니까?\n\n삭제된 카테고리는 복구할 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              
              if (isGlobal) {
                await deleteCategory(category.id, token);
                setGlobalCategories(prev => prev.filter(c => c.id !== category.id));
              } else {
                await deleteCategoryForBook(category.id, token);
                setBookCategories(prev => prev.filter(c => c.id !== category.id));
              }
              
              console.log('카테고리 삭제 완료:', category.category);
            } catch (error) {
              console.error('카테고리 삭제 실패:', error);
              Alert.alert('오류', '카테고리를 삭제하는 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const renderCategoryItem = (category: Category) => (
    <View key={category.id} style={[styles.categoryItem, { backgroundColor: colors.card }]}>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryEmoji}>{category.emoji || '📝'}</Text>
        <View style={styles.categoryDetails}>
          <ThemedText style={[styles.categoryName, { color: colors.text }]}>
            {category.category}
          </ThemedText>
          <ThemedText style={[styles.categoryType, { color: colors.tabIconDefault }]}>
            {category.bookId ? '가계부 카테고리' : '전역 카테고리'}
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
          <Ionicons name="arrow-back" size={24} color={colors.tint} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>카테고리 관리</ThemedText>
        <TouchableOpacity onPress={() => router.push('/(modals)/add-category')} style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.tint} />
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
            tintColor={colors.tint}
            colors={[colors.tint]}
            progressBackgroundColor={colors.background}
          />
        }
      >
        {/* 전역 카테고리 섹션 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>전역 카테고리</ThemedText>
          <ThemedText style={[styles.sectionDescription, { color: colors.tabIconDefault }]}>
            모든 가계부에서 사용할 수 있는 카테고리입니다.
          </ThemedText>
          
          {globalCategories.length > 0 ? (
            <View style={styles.categoryList}>
              {globalCategories.map(renderCategoryItem)}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Ionicons name="pricetag-outline" size={48} color={colors.tabIconDefault} />
              <ThemedText style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                전역 카테고리가 없습니다
              </ThemedText>
            </View>
          )}
        </View>

        {/* 가계부별 카테고리 섹션 */}
        {currentBook && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {currentBook.title} 카테고리
            </ThemedText>
            <ThemedText style={[styles.sectionDescription, { color: colors.tabIconDefault }]}>
              이 가계부에서만 사용할 수 있는 카테고리입니다.
            </ThemedText>
            
            {bookCategories.length > 0 ? (
              <View style={styles.categoryList}>
                {bookCategories.map(renderCategoryItem)}
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <Ionicons name="book-outline" size={48} color={colors.tabIconDefault} />
                <ThemedText style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                  가계부 카테고리가 없습니다
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
  categoryType: {
    fontSize: 12,
    marginTop: 2,
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
});