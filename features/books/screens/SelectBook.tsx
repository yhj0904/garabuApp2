import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';

export default function SelectBookScreen() {
  const { token, user } = useAuthStore();
  const { books, currentBook, setCurrentBook, fetchBooks, deleteBook, getOwnedBooksCount, isLoading } = useBookStore();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadBooks();
  }, [token]);

  const loadBooks = async () => {
    if (token) {
      setLoadError(null);
      console.log('가계부 목록 로드 시작');
      const success = await fetchBooks(token);
      if (!success) {
        console.error('가계부 목록 로드 실패');
        setLoadError('가계부 목록을 불러올 수 없습니다.');
      } else {
        console.log('가계부 목록 로드 성공, 개수:', books.length);
      }
    } else {
      console.log('토큰이 없어서 가계부 목록을 로드할 수 없습니다.');
      setLoadError('로그인이 필요합니다.');
    }
  };

  const handleSelectBook = (book: any) => {
    setCurrentBook(book);
    router.back();
  };

  const handleAddBook = () => {
    router.push('/(modals)/book-creation?mode=modal');
  };

  const handleRetry = () => {
    loadBooks();
  };

  const handleDeleteBook = async (book: any) => {
    if (!token) return;
    
    // 소유한 가계부 개수 확인
    const ownedCount = getOwnedBooksCount();
    if (ownedCount <= 1) {
      Alert.alert(
        '삭제 불가',
        '최소 1개의 가계부는 유지되어야 합니다.',
        [{ text: '확인' }]
      );
      return;
    }
    
    // 현재 선택된 가계부인지 확인
    const isCurrentBook = currentBook?.id === book.id;
    
    Alert.alert(
      '가계부 삭제',
      `"${book.title}" 가계부를 삭제하시겠습니까?\n\n가계부의 모든 데이터가 삭제되며, 이는 되돌릴 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const success = await deleteBook(book.id, token);
              
              if (success) {
                console.log('가계부 삭제 완료:', book.title);
                
                // 삭제된 가계부가 현재 선택된 가계부였다면 알림 표시
                if (isCurrentBook) {
                  Alert.alert(
                    '가계부 삭제 완료',
                    '현재 선택된 가계부가 삭제되어 다른 가계부로 변경되었습니다.',
                    [{ text: '확인' }]
                  );
                }
              } else {
                Alert.alert('오류', '가계부를 삭제하는 중 오류가 발생했습니다.');
              }
            } catch (error: any) {
              console.error('가계부 삭제 실패:', error);
              const errorMessage = error?.message || '가계부를 삭제하는 중 오류가 발생했습니다.';
              Alert.alert('오류', errorMessage);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>가계부 선택</Text>
        <TouchableOpacity onPress={handleAddBook} style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.tint} />
        </TouchableOpacity>
      </View>

      {/* 현재 선택된 가계부 */}
      {currentBook && (
        <View style={styles.currentBookSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>현재 선택된 가계부</Text>
          <View style={[styles.currentBookCard, { backgroundColor: colors.tint }]}>
            <Ionicons name="bookmark" size={24} color="white" />
            <Text style={styles.currentBookTitle}>{currentBook.title}</Text>
            <Ionicons name="checkmark-circle" size={24} color="white" />
          </View>
        </View>
      )}

      {/* 가계부 목록 */}
      <View style={styles.bookListSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>가계부 목록</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.icon }]}>가계부 목록을 불러오는 중...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.icon} />
            <Text style={[styles.errorText, { color: colors.icon }]}>{loadError}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.tint }]}
              onPress={handleRetry}
            >
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.bookList} showsVerticalScrollIndicator={false}>
            {Array.isArray(books) && books.map((book) => {
              // book 객체가 유효한지 확인
              if (!book || !book.id) {
                console.warn('Invalid book object:', book);
                return null;
              }
              
              return (
                <View
                  key={`book-${book.id}`}
                  style={[
                    styles.bookCard,
                    { backgroundColor: colors.card },
                    currentBook?.id === book.id && styles.selectedBookCard
                  ]}
                >
                  <TouchableOpacity
                    style={styles.bookCardTouchable}
                    onPress={() => handleSelectBook(book)}
                  >
                    <View style={styles.bookCardContent}>
                      <Ionicons 
                        name="book" 
                        size={24} 
                        color={currentBook?.id === book.id ? colors.tint : colors.icon} 
                      />
                      <Text style={[
                        styles.bookTitle,
                        { color: currentBook?.id === book.id ? colors.tint : colors.text }
                      ]}>
                        {book.title || '제목 없음'}
                      </Text>
                    </View>
                    {currentBook?.id === book.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.tint} />
                    )}
                  </TouchableOpacity>
                  
                  {/* 삭제 버튼 */}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteBook(book)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              );
            })}
            
            {(!Array.isArray(books) || books.length === 0) && (
              <View style={styles.emptyContainer}>
                <Ionicons name="book-outline" size={64} color={colors.icon} />
                <Text style={[styles.emptyText, { color: colors.icon }]}>
                  아직 가계부가 없습니다.
                </Text>
                <TouchableOpacity
                  style={[styles.addBookButton, { backgroundColor: colors.tint }]}
                  onPress={handleAddBook}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.addBookButtonText}>가계부 추가</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>
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
    paddingVertical: 12,
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
  currentBookSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  currentBookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  currentBookTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  bookListSection: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  bookList: {
    flex: 1,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 8,
  },
  bookCardTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  deleteButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBookCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  bookCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  addBookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addBookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});