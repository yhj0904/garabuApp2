import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsEvents } from '@/utils/analytics';

export default function AddCategoryScreen() {
  const [categoryName, setCategoryName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📝');
  const [isLoading, setIsLoading] = useState(false);

  const { token } = useAuthStore();
  const { createCategory } = useCategoryStore();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { logEvent, logScreenView } = useAnalytics();

  useEffect(() => {
    logScreenView('add_category_modal', 'AddCategoryScreen');
    logEvent(AnalyticsEvents.MODAL_OPEN, { modal_name: 'add_category' });
  }, []);

  const handleSubmit = async () => {
    if (!categoryName.trim()) {
      Alert.alert('오류', '카테고리명을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    const success = await createCategory({ 
      category: categoryName.trim(),
      emoji: selectedEmoji 
    }, token!);
    setIsLoading(false);
    
    if (success) {
      logEvent(AnalyticsEvents.CATEGORY_CREATE, {
        category_name: categoryName.trim(),
        emoji: selectedEmoji,
        source: 'add_category_modal'
      });
      Alert.alert('성공', '카테고리가 추가되었습니다.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } else {
      logEvent(AnalyticsEvents.API_ERROR, {
        error_type: 'category_create_failed',
        source: 'add_category_modal'
      });
      Alert.alert('오류', '카테고리 추가에 실패했습니다.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>카테고리 추가</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 폼 */}
      <View style={styles.form}>
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

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.submitButtonText}>
            {isLoading ? '추가 중...' : '카테고리 추가'}
          </Text>
        </TouchableOpacity>
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
  placeholder: {
    width: 40,
  },
  form: {
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
});