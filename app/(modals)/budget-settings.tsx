import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useBudgetStore } from '@/stores/budgetStore';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';

export default function BudgetSettingsModal() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams();
  
  // 스토어 훅
  const { 
    currentBudget, 
    budgetSummary, 
    isLoading, 
    createBudget, 
    updateBudget, 
    deleteBudget, 
    getBudgetByMonth, 
    getBudgetSummary 
  } = useBudgetStore();
  const { token } = useAuthStore();
  const { currentBook } = useBookStore();

  // 상태 관리
  const [budgetMonth, setBudgetMonth] = useState(new Date());
  const [incomeBudget, setIncomeBudget] = useState('');
  const [expenseBudget, setExpenseBudget] = useState('');
  const [memo, setMemo] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 현재 월 계산
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM 형식
  const selectedMonth = budgetMonth.toISOString().slice(0, 7);

  // 컴포넌트 마운트 시 기존 예산 데이터 로드
  useEffect(() => {
    if (currentBook && token) {
      loadExistingBudget();
    }
  }, [currentBook, token, selectedMonth]);

  // 기존 예산 데이터 로드
  const loadExistingBudget = async () => {
    if (!currentBook || !token) return;
    
    try {
      const result = await getBudgetByMonth(currentBook.id, selectedMonth, token);
      if (result.success && currentBudget) {
        // 기존 예산이 있으면 편집 모드로 설정
        setIsEditing(true);
        setIncomeBudget(currentBudget.incomeBudget ? currentBudget.incomeBudget.toLocaleString() : '');
        setExpenseBudget(currentBudget.expenseBudget ? currentBudget.expenseBudget.toLocaleString() : '');
        setMemo(currentBudget.memo || '');
      } else {
        // 새 예산 생성 모드
        setIsEditing(false);
        setIncomeBudget('');
        setExpenseBudget('');
        setMemo('');
      }
      
      // 예산 요약 정보 로드 (예산이 없어도 시도)
      const summaryResult = await getBudgetSummary(currentBook.id, selectedMonth, token);
      // 예산이 없어도 오류로 처리하지 않음 (이미 store에서 처리됨)
    } catch (error) {
      console.error('기존 예산 로드 실패:', error);
      // 오류가 발생해도 새 예산 생성 모드로 설정
      setIsEditing(false);
      setIncomeBudget('');
      setExpenseBudget('');
      setMemo('');
    }
  };

  // 날짜 변경 핸들러
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBudgetMonth(selectedDate);
    }
  };

  // 예산 저장
  const handleSaveBudget = async () => {
    if (!currentBook || !token) {
      Alert.alert('오류', '가계부 정보를 찾을 수 없습니다.');
      return;
    }

    if (!incomeBudget && !expenseBudget) {
      Alert.alert('오류', '수입 예산 또는 지출 예산 중 하나는 입력해주세요.');
      return;
    }

    const budgetData = {
      budgetMonth: selectedMonth,
      incomeBudget: incomeBudget ? parseInt(removeCommas(incomeBudget)) : undefined,
      expenseBudget: expenseBudget ? parseInt(removeCommas(expenseBudget)) : undefined,
      memo: memo.trim() || undefined,
    };

    try {
      let result;
      if (isEditing) {
        result = await updateBudget(currentBook.id, selectedMonth, budgetData, token);
      } else {
        result = await createBudget(currentBook.id, budgetData, token);
      }

      if (result.success) {
        Alert.alert(
          '성공', 
          isEditing ? '예산이 수정되었습니다.' : '예산이 생성되었습니다.',
          [{ text: '확인', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('오류', result.message || '예산 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('예산 저장 실패:', error);
      Alert.alert('오류', '예산 저장에 실패했습니다.');
    }
  };

  // 예산 삭제
  const handleDeleteBudget = () => {
    if (!currentBook || !token) {
      Alert.alert('오류', '가계부 정보를 찾을 수 없습니다.');
      return;
    }

    Alert.alert(
      '예산 삭제',
      '정말로 이 예산을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteBudget(currentBook.id, selectedMonth, token);
              if (result.success) {
                Alert.alert(
                  '성공', 
                  '예산이 삭제되었습니다.',
                  [{ text: '확인', onPress: () => router.back() }]
                );
              } else {
                Alert.alert('오류', result.message || '예산 삭제에 실패했습니다.');
              }
            } catch (error) {
              console.error('예산 삭제 실패:', error);
              Alert.alert('오류', '예산 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  // 숫자만 입력 허용하고 천 단위 쉼표 추가
  const formatNumber = (text: string) => {
    // 숫자가 아닌 문자 제거
    const numbersOnly = text.replace(/[^0-9]/g, '');
    
    // 천 단위 쉼표 추가
    if (numbersOnly) {
      return parseInt(numbersOnly).toLocaleString();
    }
    
    return '';
  };

  // 쉼표 제거하고 숫자만 반환
  const removeCommas = (text: string) => {
    return text.replace(/,/g, '');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          {isEditing ? '예산 수정' : '예산 설정'}
        </ThemedText>
        <TouchableOpacity 
          onPress={handleSaveBudget} 
          style={[styles.saveButton, { backgroundColor: colors.tint }]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <ThemedText style={styles.saveButtonText}>저장</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 예산 월 선택 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>예산 월</ThemedText>
          <TouchableOpacity 
            style={[styles.dateButton, { backgroundColor: colors.card }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.text} />
            <ThemedText style={styles.dateText}>
              {budgetMonth.getFullYear()}년 {budgetMonth.getMonth() + 1}월
            </ThemedText>
            <Ionicons name="chevron-down" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* 예산 요약 (기존 예산이 있는 경우) */}
        {budgetSummary ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>현재 상황</ThemedText>
            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              {budgetSummary.incomeBudget && (
                <View style={styles.summaryItem}>
                  <ThemedText style={styles.summaryLabel}>수입</ThemedText>
                  <ThemedText type="defaultSemiBold">
                    ₩{budgetSummary.actualIncome?.toLocaleString() || 0} / ₩{budgetSummary.incomeBudget.toLocaleString()}
                  </ThemedText>
                  <ThemedText style={[
                    styles.summaryRate,
                    { color: budgetSummary.incomeAchievementRate <= 100 ? '#4CAF50' : '#F44336' }
                  ]}>
                    {budgetSummary.incomeAchievementRate}%
                  </ThemedText>
                </View>
              )}
              {budgetSummary.expenseBudget && (
                <View style={styles.summaryItem}>
                  <ThemedText style={styles.summaryLabel}>지출</ThemedText>
                  <ThemedText type="defaultSemiBold">
                    ₩{budgetSummary.actualExpense?.toLocaleString() || 0} / ₩{budgetSummary.expenseBudget.toLocaleString()}
                  </ThemedText>
                  <ThemedText style={[
                    styles.summaryRate,
                    { color: budgetSummary.expenseAchievementRate <= 100 ? '#4CAF50' : '#F44336' }
                  ]}>
                    {budgetSummary.expenseAchievementRate}%
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        ) : (
          // 예산이 없는 경우 안내 메시지
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>현재 상황</ThemedText>
            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <View style={styles.noBudgetInfo}>
                <Ionicons name="information-circle-outline" size={24} color={colors.icon} />
                <ThemedText style={[styles.noBudgetText, { color: colors.icon }]}>
                  {budgetMonth.getFullYear()}년 {budgetMonth.getMonth() + 1}월에는 아직 예산이 설정되지 않았습니다.
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* 수입 예산 입력 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>수입 예산</ThemedText>
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="trending-up" size={20} color="#4CAF50" />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={incomeBudget}
              onChangeText={(text) => setIncomeBudget(formatNumber(text))}
              placeholder="수입 예산을 입력하세요"
              placeholderTextColor={colors.text + '80'}
              keyboardType="numeric"
            />
            {incomeBudget && <ThemedText style={styles.currency}>원</ThemedText>}
          </View>
        </View>

        {/* 지출 예산 입력 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>지출 예산</ThemedText>
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="trending-down" size={20} color="#F44336" />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={expenseBudget}
              onChangeText={(text) => setExpenseBudget(formatNumber(text))}
              placeholder="지출 예산을 입력하세요"
              placeholderTextColor={colors.text + '80'}
              keyboardType="numeric"
            />
            {expenseBudget && <ThemedText style={styles.currency}>원</ThemedText>}
          </View>
        </View>

        {/* 메모 입력 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>메모 (선택사항)</ThemedText>
          <TextInput
            style={[styles.memoInput, { backgroundColor: colors.card, color: colors.text }]}
            value={memo}
            onChangeText={setMemo}
            placeholder="예산에 대한 메모를 입력하세요"
            placeholderTextColor={colors.text + '80'}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* 삭제 버튼 (편집 모드에서만 표시) */}
        {isEditing && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.deleteButton, { backgroundColor: '#F44336' }]}
              onPress={handleDeleteBudget}
            >
              <Ionicons name="trash-outline" size={20} color="white" />
              <ThemedText style={styles.deleteButtonText}>예산 삭제</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 날짜 선택기 */}
      {showDatePicker && (
        <DateTimePicker
          value={budgetMonth}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}
    </KeyboardAvoidingView>
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
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    minWidth: 40,
  },
  summaryRate: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  currency: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  memoInput: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 80,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  noBudgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
  },
  noBudgetText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
}); 