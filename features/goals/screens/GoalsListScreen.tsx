import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { useBookStore } from '../../../stores/bookStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { currentBook } = useBookStore();
  const bookId = currentBook?.id;
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    goalType: 'SAVING',
    status: 'ACTIVE',
  });

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
    if (!newGoal.name || !newGoal.targetAmount) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('입력 오류', '목표 이름과 목표 금액을 입력해주세요.');
      return;
    }

    const goal: Goal = {
      id: Date.now(),
      name: newGoal.name,
      goalType: newGoal.goalType || 'SAVING',
      targetAmount: newGoal.targetAmount,
      currentAmount: 0,
      progressPercentage: 0,
      status: 'ACTIVE',
      targetDate: newGoal.targetDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      icon: getGoalIcon(newGoal.goalType || 'SAVING'),
      color: getGoalColor(newGoal.goalType || 'SAVING'),
    };

    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    await saveGoalsToStorage(updatedGoals);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAddModal(false);
    setNewGoal({ goalType: 'SAVING', status: 'ACTIVE' });
  };

  const updateGoalProgress = async (goalId: number, amount: number) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const newAmount = goal.currentAmount + amount;
        const progress = Math.min((newAmount / goal.targetAmount) * 100, 100);
        return {
          ...goal,
          currentAmount: newAmount,
          progressPercentage: progress,
          status: progress >= 100 ? 'COMPLETED' : goal.status,
        };
      }
      return goal;
    });
    setGoals(updatedGoals);
    await saveGoalsToStorage(updatedGoals);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      SAVING: '#4CAF50',
      SPENDING_REDUCTION: '#FF5722',
      DEBT_REPAYMENT: '#F44336',
      EMERGENCY_FUND: '#FF9800',
      INVESTMENT: '#2196F3',
      PURCHASE: '#9C27B0',
      TRAVEL: '#00BCD4',
      EDUCATION: '#3F51B5',
      RETIREMENT: '#795548',
      CUSTOM: colors.tint
    };
    return colorMap[type] || colors.tint;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return colors.tint;
      case 'COMPLETED': return '#4CAF50';
      case 'PAUSED': return '#FFC107';
      case 'CANCELLED': return '#9E9E9E';
      case 'EXPIRED': return '#F44336';
      default: return colors.tint;
    }
  };

  const renderGoalItem = ({ item }: { item: Goal }) => (
    <TouchableOpacity
      style={[styles.goalCard, { backgroundColor: colors.card }]}
      onPress={() => updateGoalProgress(item.id, 10000)}
      onLongPress={() => deleteGoal(item.id)}
    >
      <View style={styles.goalHeader}>
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <Text style={styles.iconText}>{item.icon || '🎯'}</Text>
        </View>
        <View style={styles.goalInfo}>
          <Text style={[styles.goalName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.goalType, { color: colors.icon }]}>
            {getGoalTypeText(item.goalType)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {item.status === 'ACTIVE' ? '진행중' : 
             item.status === 'COMPLETED' ? '완료' : item.status}
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressAmount, { color: colors.text }]}>
            ₩{item.currentAmount.toLocaleString()} / ₩{item.targetAmount.toLocaleString()}
          </Text>
          <Text style={[styles.progressPercentage, { color: item.color }]}>
            {item.progressPercentage.toFixed(1)}%
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.targetDate, { color: colors.icon }]}>
          목표일: {new Date(item.targetDate).toLocaleDateString('ko-KR')}
        </Text>
        <Text style={[styles.remainingAmount, { color: colors.icon }]}>
          남은 금액: ₩{Math.max(0, item.targetAmount - item.currentAmount).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>재정 목표</Text>
        <TouchableOpacity 
          onPress={() => setShowAddModal(true)}
          style={styles.headerButton}
        >
          <Ionicons name="add" size={24} color={colors.tint} />
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
            tintColor={colors.tint}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="flag-outline" size={64} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              아직 설정한 목표가 없습니다
            </Text>
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: colors.tint }]}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.createButtonText}>첫 목표 만들기</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* 목표 추가 모달 */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>새 목표 추가</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>목표 이름</Text>
                <TextInput
                  style={[styles.input, { 
                    color: colors.text, 
                    borderColor: colors.border,
                    backgroundColor: colors.background 
                  }]}
                  placeholder="예: 비상금 마련"
                  placeholderTextColor={colors.icon}
                  value={newGoal.name}
                  onChangeText={(text) => setNewGoal({ ...newGoal, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>목표 금액</Text>
                <TextInput
                  style={[styles.input, { 
                    color: colors.text, 
                    borderColor: colors.border,
                    backgroundColor: colors.background 
                  }]}
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                  value={newGoal.targetAmount?.toString()}
                  onChangeText={(text) => setNewGoal({ ...newGoal, targetAmount: parseInt(text) || 0 })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>목표 유형</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['SAVING', 'SPENDING_REDUCTION', 'INVESTMENT', 'PURCHASE', 'TRAVEL', 'EDUCATION'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        { 
                          backgroundColor: newGoal.goalType === type ? colors.tint : colors.background,
                          borderColor: colors.border,
                        }
                      ]}
                      onPress={() => setNewGoal({ ...newGoal, goalType: type })}
                    >
                      <Text style={styles.typeIcon}>{getGoalIcon(type)}</Text>
                      <Text style={{ 
                        color: newGoal.goalType === type ? 'white' : colors.text,
                        fontSize: 12,
                      }}>
                        {getGoalTypeText(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.tint }]}
              onPress={handleAddGoal}
            >
              <Text style={styles.saveButtonText}>목표 추가</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
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
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  goalCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  goalName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  goalType: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressAmount: {
    fontSize: 14,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
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
  targetDate: {
    fontSize: 12,
  },
  remainingAmount: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginVertical: 20,
    textAlign: 'center',
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});