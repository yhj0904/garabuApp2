import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AddBookScreen() {
  const [bookTitle, setBookTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { token } = useAuthStore();
  const { createBook } = useBookStore();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSubmit = async () => {
    if (!bookTitle.trim()) {
      Alert.alert('오류', '가계부명을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    const success = await createBook({ title: bookTitle.trim() }, token!);
    setIsLoading(false);
    
    if (success) {
      Alert.alert('성공', '가계부가 추가되었습니다.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('오류', '가계부 추가에 실패했습니다.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>가계부 추가</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 폼 */}
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>가계부명</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="가계부명을 입력하세요"
            placeholderTextColor={colors.icon}
            value={bookTitle}
            onChangeText={setBookTitle}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.tint, opacity: isLoading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.submitButtonText}>
            {isLoading ? '추가 중...' : '가계부 추가'}
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
});