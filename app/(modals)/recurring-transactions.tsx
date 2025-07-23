import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../stores/authStore';
import { useBookStore } from '../../stores/bookStore';
import apiService from '../../services/api';

interface RecurringTransaction {
  id: number;
  name: string;
  amountType: 'INCOME' | 'EXPENSE';
  amount: number;
  recurrenceType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
  description?: string;
  isActive: boolean;
  lastExecutedDate?: string;
  nextExecutionDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function RecurringTransactionsScreen() {
  const authStore = useAuthStore();
  const bookStore = useBookStore();
  
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [amountType, setAmountType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const currentBook = bookStore.currentBook;
      if (!currentBook?.id) return;

      const transactions = await apiService.getRecurringTransactions(currentBook.id);
      setTransactions(transactions || []);
    } catch (error: any) {
      console.error('반복 거래 목록 조회 실패:', error);
      if (error.response?.status !== 404) {
        Alert.alert('오류', '반복 거래 목록을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !amount) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('오류', '이름과 금액은 필수 입력 항목입니다.');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const currentBook = bookStore.currentBook;
      if (!currentBook?.id) return;

      const data = {
        name,
        amountType,
        amount: parseFloat(amount),
        recurrenceType,
        startDate: startDate.toISOString().split('T')[0],
        endDate: hasEndDate && endDate ? endDate.toISOString().split('T')[0] : undefined,
        description: description || undefined,
        recurrenceInterval: 1,
        autoCreate: true,
      };

      if (editingTransaction) {
        const updateData = {
          name: data.name,
          description: data.description,
          amount: data.amount,
          recurrenceInterval: data.recurrenceInterval,
          endDate: data.endDate,
          autoCreate: data.autoCreate,
        };
        await apiService.updateRecurringTransaction(editingTransaction.id, updateData);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('성공', '반복 거래가 수정되었습니다.');
      } else {
        await apiService.createRecurringTransaction(currentBook.id, data);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('성공', '반복 거래가 등록되었습니다.');
      }

      resetForm();
      setModalVisible(false);
      fetchTransactions();
    } catch (error) {
      console.error('반복 거래 저장 실패:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '반복 거래 저장에 실패했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      '삭제 확인',
      '이 반복 거래를 삭제하시겠습니까?',
      [
        { 
          text: '취소', 
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteRecurringTransaction(id);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('성공', '반복 거래가 삭제되었습니다.');
              fetchTransactions();
            } catch (error) {
              console.error('반복 거래 삭제 실패:', error);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('오류', '반복 거래 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (transaction: RecurringTransaction) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (transaction.isActive) {
        await apiService.pauseRecurringTransaction(transaction.id);
      } else {
        await apiService.resumeRecurringTransaction(transaction.id);
      }
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchTransactions();
    } catch (error) {
      console.error('반복 거래 상태 변경 실패:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '반복 거래 상태 변경에 실패했습니다.');
    }
  };

  const handleEdit = async (transaction: RecurringTransaction) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingTransaction(transaction);
    setName(transaction.name);
    setAmountType(transaction.amountType);
    setAmount(transaction.amount.toString());
    setRecurrenceType(transaction.recurrenceType);
    setStartDate(new Date(transaction.startDate));
    if (transaction.endDate) {
      setHasEndDate(true);
      setEndDate(new Date(transaction.endDate));
    }
    setDescription(transaction.description || '');
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingTransaction(null);
    setName('');
    setAmountType('EXPENSE');
    setAmount('');
    setRecurrenceType('MONTHLY');
    setStartDate(new Date());
    setEndDate(null);
    setHasEndDate(false);
    setDescription('');
  };

  const getRecurrenceTypeText = (type: string) => {
    switch (type) {
      case 'DAILY': return '매일';
      case 'WEEKLY': return '매주';
      case 'MONTHLY': return '매월';
      case 'YEARLY': return '매년';
      default: return type;
    }
  };

  const renderTransaction = ({ item }: { item: RecurringTransaction }) => (
    <View style={[styles.transactionCard, !item.isActive && styles.inactiveCard]}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionName, !item.isActive && styles.inactiveText]}>
            {item.name}
          </Text>
          <Text style={[
            styles.amount,
            item.amountType === 'INCOME' ? styles.incomeAmount : styles.expenseAmount,
            !item.isActive && styles.inactiveText
          ]}>
            {item.amountType === 'INCOME' ? '+' : '-'}
            {item.amount.toLocaleString()}원
          </Text>
        </View>
        <Switch
          value={item.isActive}
          onValueChange={() => handleToggleActive(item)}
        />
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={[styles.detailText, !item.isActive && styles.inactiveText]}>
          {getRecurrenceTypeText(item.recurrenceType)} • 시작일: {item.startDate}
        </Text>
        {item.endDate && (
          <Text style={[styles.detailText, !item.isActive && styles.inactiveText]}>
            종료일: {item.endDate}
          </Text>
        )}
        {item.nextExecutionDate && item.isActive && (
          <Text style={styles.nextExecutionText}>
            다음 실행: {item.nextExecutionDate}
          </Text>
        )}
      </View>

      <View style={styles.transactionActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEdit(item)}
        >
          <Ionicons name="pencil" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>반복 거래</Text>
        <TouchableOpacity 
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setModalVisible(true);
          }}
          style={styles.headerAddButton}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.innerContainer}>
        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="repeat" size={64} color="#CCC" />
            <Text style={styles.emptyText}>등록된 반복 거래가 없습니다</Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
          />
        )}

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            resetForm();
            setModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>
                  {editingTransaction ? '반복 거래 수정' : '반복 거래 등록'}
                </Text>

                <Text style={styles.label}>이름</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="예: 월급, 월세, 보험료"
                />

                <Text style={styles.label}>거래 유형</Text>
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      amountType === 'INCOME' && styles.activeTypeButton,
                    ]}
                    onPress={() => setAmountType('INCOME')}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        amountType === 'INCOME' && styles.activeTypeButtonText,
                      ]}
                    >
                      수입
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      amountType === 'EXPENSE' && styles.activeTypeButton,
                    ]}
                    onPress={() => setAmountType('EXPENSE')}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        amountType === 'EXPENSE' && styles.activeTypeButtonText,
                      ]}
                    >
                      지출
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>금액</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0"
                  keyboardType="numeric"
                />

                <Text style={styles.label}>반복 주기</Text>
                <View style={styles.recurrenceButtons}>
                  {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.recurrenceButton,
                        recurrenceType === type && styles.activeRecurrenceButton,
                      ]}
                      onPress={() => setRecurrenceType(type)}
                    >
                      <Text
                        style={[
                          styles.recurrenceButtonText,
                          recurrenceType === type && styles.activeRecurrenceButtonText,
                        ]}
                      >
                        {getRecurrenceTypeText(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>시작일</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text>{startDate.toLocaleDateString()}</Text>
                  <Ionicons name="calendar" size={20} color="#666" />
                </TouchableOpacity>

                {showStartDatePicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (selectedDate) {
                        setStartDate(selectedDate);
                      }
                    }}
                  />
                )}

                <View style={styles.endDateContainer}>
                  <Text style={styles.label}>종료일 설정</Text>
                  <Switch value={hasEndDate} onValueChange={setHasEndDate} />
                </View>

                {hasEndDate && (
                  <>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <Text>{endDate?.toLocaleDateString() || '종료일 선택'}</Text>
                      <Ionicons name="calendar" size={20} color="#666" />
                    </TouchableOpacity>

                    {showEndDatePicker && (
                      <DateTimePicker
                        value={endDate || new Date()}
                        mode="date"
                        display="default"
                        minimumDate={startDate}
                        onChange={(event, selectedDate) => {
                          setShowEndDatePicker(false);
                          if (selectedDate) {
                            setEndDate(selectedDate);
                          }
                        }}
                      />
                    )}
                  </>
                )}

                <Text style={styles.label}>설명 (선택)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="메모를 입력하세요"
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      resetForm();
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>저장</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerAddButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerBackButton: {
    padding: 8,
    borderRadius: 8,
  },
  innerContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
  incomeAmount: {
    color: '#34C759',
  },
  expenseAmount: {
    color: '#FF3B30',
  },
  inactiveText: {
    color: '#999',
  },
  transactionDetails: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  nextExecutionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 4,
  },
  transactionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  activeTypeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  activeTypeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  recurrenceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recurrenceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  activeRecurrenceButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  recurrenceButtonText: {
    fontSize: 14,
    color: '#333',
  },
  activeRecurrenceButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
  },
  endDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
}); 