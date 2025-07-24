import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { firebaseService } from '@/services/firebaseService';
import { AnalyticsEvents } from '@/utils/analytics';

const { width, height } = Dimensions.get('window');

export default function CreateFirstBookScreen() {
  const [bookTitle, setBookTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { token, user, loadInitialData } = useAuthStore();
  const { createBook } = useBookStore();
  const { colors, isDarkMode } = useTheme();
  
  React.useEffect(() => {
    // Screen view 이벤트 로깅 (온보딩 화면)
    firebaseService.logScreenView('create_first_book', 'CreateFirstBookScreen');
  }, []);

  const handleCreateBook = async () => {
    if (!bookTitle.trim()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '가계부 이름을 입력해주세요.');
      return;
    }

    if (!token) {
      Alert.alert('오류', '인증 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const success = await createBook({ title: bookTitle.trim() }, token);
      
      if (success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Analytics 이벤트 로깅
        await firebaseService.logEvent(AnalyticsEvents.BOOK_CREATE, {
          book_title: bookTitle.trim(),
          mode: 'onboarding',
          is_first_book: true,
          user_id: user?.id
        });
        
        // 가계부 생성 후 초기 데이터 로드
        if (user && token) {
          await loadInitialData(user, token);
        }
        
        // 메인 화면으로 이동
        router.replace('/(tabs)');
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('오류', '가계부 생성에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('가계부 생성 실패:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '가계부 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedNames = [
    `${user?.name || '내'} 가계부`,
    '우리 가계부',
    '가족 가계부',
    '생활비 관리',
    '용돈 기입장',
    '재정 관리'
  ];

  const handleSuggestionPress = async (suggestion: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBookTitle(suggestion);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.gradient, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            {/* 헤더 영역 */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: colors.tint }]}>
                <Ionicons name="book" size={48} color="white" />
              </View>
              
              <ThemedText type="title" style={styles.title}>
                가계부 만들기
              </ThemedText>
              
              <ThemedText style={[styles.subtitle, { color: colors.tabIconDefault }]}>
                {user?.name}님의 첫 번째 가계부 이름을{'\n'}입력해주세요
              </ThemedText>
            </View>

            {/* 입력 영역 */}
            <View style={styles.inputSection}>
              <View style={styles.inputLabel}>
                <Ionicons name="create" size={20} color={colors.tint} />
                <ThemedText type="defaultSemiBold" style={styles.inputLabelText}>
                  가계부 이름
                </ThemedText>
              </View>
              
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="예: 내 가계부"
                placeholderTextColor={colors.tabIconDefault}
                value={bookTitle}
                onChangeText={setBookTitle}
                autoFocus
                maxLength={50}
                returnKeyType="done"
                onSubmitEditing={handleCreateBook}
              />
              
              <ThemedText style={[styles.inputHint, { color: colors.tabIconDefault }]}>
                최대 50자까지 입력할 수 있습니다
              </ThemedText>
            </View>

            {/* 추천 이름 */}
            <View style={styles.suggestionsSection}>
              <ThemedText type="defaultSemiBold" style={styles.suggestionsTitle}>
                추천 이름
              </ThemedText>
              
              <View style={styles.suggestionsGrid}>
                {suggestedNames.map((name, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.suggestionButton,
                      { backgroundColor: colors.card },
                      bookTitle === name && { 
                        backgroundColor: colors.tint,
                        borderColor: colors.tint 
                      }
                    ]}
                    onPress={() => handleSuggestionPress(name)}
                  >
                    <ThemedText 
                      style={[
                        styles.suggestionText,
                        bookTitle === name && { color: 'white' }
                      ]}
                    >
                      {name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 하단 버튼 */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.createButton,
                  { 
                    backgroundColor: bookTitle.trim() ? colors.tint : colors.card,
                    opacity: isLoading ? 0.7 : 1
                  }
                ]}
                onPress={handleCreateBook}
                disabled={!bookTitle.trim() || isLoading}
              >
                {isLoading ? (
                  <ThemedText style={styles.createButtonText}>
                    가계부 만드는 중...
                  </ThemedText>
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="white" />
                    <ThemedText style={styles.createButtonText}>
                      가계부 만들기
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
              
              <ThemedText style={[styles.footerHint, { color: colors.tabIconDefault }]}>
                나중에 설정에서 언제든지 변경할 수 있습니다
              </ThemedText>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputSection: {
    marginBottom: 40,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  inputLabelText: {
    fontSize: 16,
  },
  input: {
    height: 60,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  suggestionsSection: {
    marginBottom: 40,
  },
  suggestionsTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  suggestionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    paddingBottom: 40,
  },
  createButton: {
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  footerHint: {
    fontSize: 12,
    textAlign: 'center',
  },
});