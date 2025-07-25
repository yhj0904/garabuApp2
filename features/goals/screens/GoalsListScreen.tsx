import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedCard } from '@/components/ThemedCard';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { useBookStore } from '@/stores/bookStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { formatAmountInput, parseFormattedNumber, formatKoreanAmount } from '@/utils/numberFormat';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// 한국어 달력 설정
LocaleConfig.locales['kr'] = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';

interface Goal {
  id: number;
  name: string;
  goalType: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  status: string;
  targetDate: string;
  icon?: string;
  color?: string;
}

export default function GoalsListScreen() {
  const { colors, isDarkMode } = useTheme();
  const { currentBook } = useBookStore();
  const bookId = currentBook?.id;
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    goalType: 'SAVING',
    status: 'ACTIVE',
    targetDate: new Date().toISOString().split('T')[0],
  });
  const [targetAmountString, setTargetAmountString] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'calendar' | 'input'>('input');

  useEffect(() => {
    loadGoalsFromStorage();
  }, []);

  const loadGoalsFromStorage = async () => {
    try {
      const savedGoals = await AsyncStorage.getItem(`goals_${bookId}`);
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }
    } catch (error) {
      console.error('목표 목록 로드 실패:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const saveGoalsToStorage = async (goalsToSave: Goal[]) => {
    try {
      await AsyncStorage.setItem(`goals_${bookId}`, JSON.stringify(goalsToSave));
    } catch (error) {
      console.error('목표 저장 실패:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadGoalsFromStorage();
  };

  const handleAddGoal = async () => {
    const targetAmount = parseFormattedNumber(targetAmountString);
    
    if (!newGoal.name || !targetAmount || !newGoal.targetDate) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    const goal: Goal = {
      id: Date.now(),
      name: newGoal.name,
      goalType: newGoal.goalType || 'SAVING',
      targetAmount: targetAmount,
      currentAmount: 0,
      progressPercentage: 0,
      status: 'ACTIVE',
      targetDate: newGoal.targetDate,
      icon: getGoalIcon(newGoal.goalType || 'SAVING'),
      color: getGoalColor(newGoal.goalType || 'SAVING'),
    };

    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    await saveGoalsToStorage(updatedGoals);
    setShowAddModal(false);
    setNewGoal({ 
      goalType: 'SAVING', 
      status: 'ACTIVE',
      targetDate: new Date().toISOString().split('T')[0]
    });
    setTargetAmountString('');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const updateGoalProgress = async (id: number, amount: number) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === id) {
        const newCurrentAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
        const newProgressPercentage = (newCurrentAmount / goal.targetAmount) * 100;
        const newStatus = newProgressPercentage >= 100 ? 'COMPLETED' : goal.status;
        
        return {
          ...goal,
          currentAmount: newCurrentAmount,
          progressPercentage: newProgressPercentage,
          status: newStatus,
        };
      }
      return goal;
    });
    
    setGoals(updatedGoals);
    await saveGoalsToStorage(updatedGoals);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteGoal = (id: number) => {
    Alert.alert(
      '목표 삭제',
      '이 목표를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: async () => {
            const updatedGoals = goals.filter(goal => goal.id !== id);
            setGoals(updatedGoals);
            await saveGoalsToStorage(updatedGoals);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        },
      ]
    );
  };

  const getGoalTypeText = (type: string) => {
    const types: { [key: string]: string } = {
      SAVING: '저축',
      SPENDING_REDUCTION: '지출 절감',
      DEBT_REPAYMENT: '부채 상환',
      EMERGENCY_FUND: '비상금',
      INVESTMENT: '투자',
      PURCHASE: '구매',
      TRAVEL: '여행',
      EDUCATION: '교육',
      RETIREMENT: '은퇴',
      CUSTOM: '기타'
    };
    return types[type] || type;
  };

  const getGoalIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      SAVING: '💰',
      SPENDING_REDUCTION: '📉',
      DEBT_REPAYMENT: '💳',
      EMERGENCY_FUND: '🚨',
      INVESTMENT: '📈',
      PURCHASE: '🛍️',
      TRAVEL: '✈️',
      EDUCATION: '📚',
      RETIREMENT: '🏖️',
      CUSTOM: '🎯'
    };
    return icons[type] || '🎯';
  };

  const getGoalColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      SAVING: colors.success,
      SPENDING_REDUCTION: colors.warning,
      DEBT_REPAYMENT: colors.error,
      EMERGENCY_FUND: colors.info,
      INVESTMENT: colors.primary,
      PURCHASE: colors.transfer,
      TRAVEL: colors.primary,
      EDUCATION: colors.primary,
      RETIREMENT: colors.textSecondary,
      CUSTOM: colors.primary
    };
    return colorMap[type] || colors.primary;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return colors.primary;
      case 'COMPLETED': return colors.success;
      case 'PAUSED': return colors.warning;
      case 'CANCELLED': return colors.textSecondary;
      case 'EXPIRED': return colors.error;
      default: return colors.primary;
    }
  };

  const renderGoalItem = ({ item }: { item: Goal }) => (
    <ThemedCard
      variant="default"
      style={styles.goalCard}
      onPress={() => updateGoalProgress(item.id, 10000)}
      onLongPress={() => deleteGoal(item.id)}
    >
      <View style={styles.goalHeader}>
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <ThemedText style={styles.iconText}>{item.icon || '🎯'}</ThemedText>
        </View>
        <View style={styles.goalInfo}>
          <ThemedText type="body" weight="semibold">{item.name}</ThemedText>
          <ThemedText type="caption" variant="secondary">
            {getGoalTypeText(item.goalType)}
          </ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <ThemedText type="caption" variant="inverse" weight="semibold">
            {item.status === 'ACTIVE' ? '진행중' : 
             item.status === 'COMPLETED' ? '완료' : item.status}
          </ThemedText>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <ThemedText type="body" variant="secondary">
            ₩{item.currentAmount.toLocaleString()} / ₩{item.targetAmount.toLocaleString()}
          </ThemedText>
          <ThemedText type="body" weight="semibold" style={{ color: item.color }}>
            {item.progressPercentage.toFixed(1)}%
          </ThemedText>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(item.progressPercentage, 100)}%`,
                backgroundColor: item.color || getStatusColor(item.status)
              }
            ]} 
          />
        </View>
      </View>

      <View style={styles.goalFooter}>
        <ThemedText type="caption" variant="tertiary">
          목표일: {new Date(item.targetDate).toLocaleDateString('ko-KR')}
        </ThemedText>
        <ThemedText type="caption" variant="tertiary">
          남은 금액: ₩{Math.max(0, item.targetAmount - item.currentAmount).toLocaleString()}
        </ThemedText>
      </View>
    </ThemedCard>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]} >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="subtitle" weight="semibold">재정 목표</ThemedText>
        <TouchableOpacity 
          onPress={() => setShowAddModal(true)}
          style={styles.headerButton}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        renderItem={renderGoalItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="flag-outline" size={64} color={colors.textTertiary} />
            <ThemedText type="body" variant="tertiary" style={styles.emptyText}>
              아직 설정한 목표가 없습니다
            </ThemedText>
            <ThemedButton
              variant="primary"
              onPress={() => setShowAddModal(true)}
              style={styles.createButton}
            >
              첫 목표 만들기
            </ThemedButton>
          </View>
        }
      />

      {/* 목표 추가 모달 */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddModal(false);
          setNewGoal({ 
            goalType: 'SAVING', 
            status: 'ACTIVE',
            targetDate: new Date().toISOString().split('T')[0]
          });
          setTargetAmountString('');
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" weight="semibold">새 목표 추가</ThemedText>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setNewGoal({ 
                  goalType: 'SAVING', 
                  status: 'ACTIVE',
                  targetDate: new Date().toISOString().split('T')[0]
                });
                setTargetAmountString('');
              }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <ThemedInput
                  label="목표 이름"
                  placeholder="예: 비상금 마련"
                  value={newGoal.name}
                  onChangeText={(text) => setNewGoal({ ...newGoal, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedInput
                  label="목표 금액"
                  placeholder="0"
                  keyboardType="numeric"
                  value={targetAmountString}
                  onChangeText={(text) => {
                    const formatted = formatAmountInput(text);
                    setTargetAmountString(formatted);
                  }}
                />
                {targetAmountString && (
                  <ThemedText type="caption" variant="secondary" style={styles.amountInWords}>
                    {formatKoreanAmount(targetAmountString)}
                  </ThemedText>
                )}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="body" weight="medium" style={styles.inputLabel}>
                  목표 유형
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['SAVING', 'SPENDING_REDUCTION', 'INVESTMENT', 'PURCHASE', 'TRAVEL', 'EDUCATION'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        { 
                          backgroundColor: newGoal.goalType === type ? colors.primary : colors.backgroundSecondary,
                          borderColor: colors.border,
                        }
                      ]}
                      onPress={() => setNewGoal({ ...newGoal, goalType: type })}
                    >
                      <ThemedText style={styles.typeIcon}>{getGoalIcon(type)}</ThemedText>
                      <ThemedText 
                        type="caption"
                        variant={newGoal.goalType === type ? 'inverse' : 'secondary'}
                      >
                        {getGoalTypeText(type)}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.dateHeader}>
                  <ThemedText type="body" weight="medium" style={styles.inputLabel}>
                    목표 날짜
                  </ThemedText>
                  <View style={styles.datePickerToggle}>
                    <TouchableOpacity
                      style={[
                        styles.datePickerButton,
                        datePickerMode === 'input' && styles.datePickerButtonActive,
                        { backgroundColor: datePickerMode === 'input' ? colors.primary : colors.card }
                      ]}
                      onPress={() => {
                        setDatePickerMode('input');
                        setShowDatePicker(false);
                      }}
                    >
                      <Ionicons 
                        name="keypad" 
                        size={16} 
                        color={datePickerMode === 'input' ? 'white' : colors.text} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.datePickerButton,
                        datePickerMode === 'calendar' && styles.datePickerButtonActive,
                        { backgroundColor: datePickerMode === 'calendar' ? colors.primary : colors.card }
                      ]}
                      onPress={() => {
                        setDatePickerMode('calendar');
                        setShowDatePicker(true);
                      }}
                    >
                      <Ionicons 
                        name="calendar" 
                        size={16} 
                        color={datePickerMode === 'calendar' ? 'white' : colors.text} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {datePickerMode === 'input' ? (
                  <TextInput
                    style={[styles.dateInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                    value={newGoal.targetDate}
                    onChangeText={(text) => {
                      // Basic format validation for YYYY-MM-DD
                      if (text.length <= 10) {
                        // Auto-insert hyphens
                        if (text.length === 4 || text.length === 7) {
                          if (!text.endsWith('-')) {
                            text += '-';
                          }
                        }
                        // Only allow numbers and hyphens
                        if (/^[0-9-]*$/.test(text)) {
                          setNewGoal({ ...newGoal, targetDate: text });
                        }
                      }
                    }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textTertiary}
                    maxLength={10}
                    keyboardType="numeric"
                  />
                ) : (
                  <TouchableOpacity
                    style={[styles.selectButton, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <View style={styles.selectButtonContent}>
                      <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />
                      <ThemedText type="body" variant={newGoal.targetDate ? 'default' : 'tertiary'}>
                        {newGoal.targetDate || '날짜를 선택하세요'}
                      </ThemedText>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            <ThemedButton
              variant="primary"
              size="large"
              onPress={handleAddGoal}
              style={styles.saveButton}
            >
              목표 추가
            </ThemedButton>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 날짜 선택 캘린더 모달 */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity 
          style={styles.calendarModalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDatePicker(false)}
        >
          <TouchableOpacity 
            style={[styles.calendarModalContent, { backgroundColor: colors.background }]} 
            activeOpacity={1}
            onPress={() => {}}
          >
            <ThemedText type="subtitle" weight="semibold" style={styles.calendarModalTitle}>
              목표 날짜 선택
            </ThemedText>
            
            <Calendar
              current={newGoal.targetDate || new Date().toISOString().split('T')[0]}
              onDayPress={(day: any) => {
                setNewGoal({ ...newGoal, targetDate: day.dateString });
                setShowDatePicker(false);
              }}
              markedDates={{
                [newGoal.targetDate || '']: { selected: true, selectedColor: colors.primary }
              }}
              minDate={new Date().toISOString().split('T')[0]}
              theme={{
                backgroundColor: colors.background,
                calendarBackground: colors.background,
                textSectionTitleColor: colors.text,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: 'white',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textTertiary,
                dotColor: colors.primary,
                selectedDotColor: 'white',
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14
              }}
            />

            <TouchableOpacity
              style={[styles.calendarCloseButton, { backgroundColor: colors.card }]}
              onPress={() => setShowDatePicker(false)}
            >
              <ThemedText type="body" weight="semibold" variant="default">닫기</ThemedText>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerButton: {
    padding: 8,
  },
  listContent: {
    padding: 20,
  },
  goalCard: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  goalInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginVertical: 20,
    textAlign: 'center',
  },
  createButton: {
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    marginBottom: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  saveButton: {
    marginTop: 20,
  },
  amountInWords: {
    marginTop: 4,
    marginLeft: 4,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  datePickerToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  datePickerButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  dateInput: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  selectButton: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  calendarModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  calendarModalTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  calendarCloseButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
});