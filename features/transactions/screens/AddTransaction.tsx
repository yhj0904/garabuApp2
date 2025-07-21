import { Colors } from '@/constants/Colors';
import apiService from '@/core/api/client';
import { notification } from '@/core/notifications/local';
import { useColorScheme } from '@/hooks/useColorScheme';
import syncService from '@/services/syncService';
import { useAssetStore } from '@/stores/assetStore';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { formatAmountInput, parseFormattedNumber, formatKoreanAmount } from '@/utils/numberFormat';
import axios from 'axios';
import config from '@/config/config';


export default function AddTransactionScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [memo, setMemo] = useState('');
  const [spender, setSpender] = useState('');
  const [amountType, setAmountType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCategoryEmoji, setSelectedCategoryEmoji] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [selectedFromAssetId, setSelectedFromAssetId] = useState<number | null>(null);
  const [selectedToAssetId, setSelectedToAssetId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFromAssetModal, setShowFromAssetModal] = useState(false);
  const [showToAssetModal, setShowToAssetModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newPayment, setNewPayment] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('KRW');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [bookCurrencies, setBookCurrencies] = useState<any[]>([]);
  
  // Refs for scrolling to fields
  const scrollViewRef = useRef<ScrollView>(null);
  const amountRef = useRef<View>(null);
  const descriptionRef = useRef<View>(null);
  const categoryRef = useRef<View>(null);
  const assetRef = useRef<View>(null);

  const { token, user } = useAuthStore();
  const { currentBook, createLedger, isLoading } = useBookStore();
  const { categories, payments, fetchCategoriesByBook, fetchPaymentsByBook, createCategoryForBook, createPaymentForBook } = useCategoryStore();
  const { assets, assetTypes, fetchAssetsByBook, updateAssetBalance } = useAssetStore();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (token && currentBook) {
      fetchCategoriesByBook(currentBook.id, token);
      fetchPaymentsByBook(currentBook.id, token);
      fetchAssetsByBook(currentBook.id, token);
      fetchTags();
      fetchCurrencies();
    }
  }, [token, currentBook]);

  const fetchTags = async () => {
    if (!token || !currentBook?.id) return;
    
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/api/v2/tags/book/${currentBook.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTags(response.data);
    } catch (error) {
      console.error('태그 조회 실패:', error);
    }
  };

  const fetchCurrencies = async () => {
    if (!token || !currentBook?.id) return;
    
    try {
      // 가계부의 통화 설정 조회
      const bookCurrenciesResponse = await axios.get(
        `${config.API_BASE_URL}/api/v2/currencies/book/${currentBook.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setBookCurrencies(bookCurrenciesResponse.data);
      
      // 활성화된 통화만 필터링
      const activeCurrencies = bookCurrenciesResponse.data.map((bc: any) => bc.currency);
      setCurrencies(activeCurrencies);
      
      // 기본 통화 설정
      const defaultCurrency = bookCurrenciesResponse.data.find((bc: any) => bc.isDefault);
      if (defaultCurrency) {
        setSelectedCurrency(defaultCurrency.currency.code);
      }
    } catch (error) {
      console.error('통화 조회 실패:', error);
    }
  };

  const handleSubmit = async () => {
    // Validate all required fields
    const validationErrors = [];
    let firstErrorRef: any = null;
    
    if (!amount?.trim()) {
      validationErrors.push('금액');
      if (!firstErrorRef) firstErrorRef = amountRef;
    }
    if (!description?.trim()) {
      validationErrors.push('내용');
      if (!firstErrorRef) firstErrorRef = descriptionRef;
    }
    if (!date) validationErrors.push('날짜');
    if (!amountType) validationErrors.push('수입/지출 구분');
    
    // Transfer validation
    if (amountType === 'TRANSFER') {
      if (!selectedFromAssetId && !selectedToAssetId) {
        validationErrors.push('출금 자산 또는 입금 자산 중 하나');
      }
      if (selectedFromAssetId && selectedToAssetId && selectedFromAssetId === selectedToAssetId) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('입력 오류', '출금 자산과 입금 자산은 다른 자산이어야 합니다.');
        return;
      }
    } else {
      // Income/Expense validation
      if (!selectedCategory?.trim()) {
        validationErrors.push('카테고리');
        if (!firstErrorRef) firstErrorRef = categoryRef;
      }
      if (!selectedPayment?.trim()) {
        validationErrors.push('결제 수단');
        if (!firstErrorRef) firstErrorRef = assetRef;
      }
    }
    
    if (validationErrors.length > 0) {
      // 진동 피드백
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // 첫 번째 누락된 필드로 스크롤
      if (firstErrorRef?.current && scrollViewRef.current) {
        firstErrorRef.current.measureLayout(
          scrollViewRef.current as any,
          (x: number, y: number) => {
            scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
          },
          () => {}
        );
      }
      
      Alert.alert('입력 오류', `다음 필수 필드를 입력해주세요:\n• ${validationErrors.join('\n• ')}`);
      return;
    }

    if (!currentBook?.id) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '가계부를 선택해주세요.');
      return;
    }

    const numericAmount = parseFormattedNumber(amount);
    if (numericAmount <= 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '올바른 금액을 입력해주세요. (0보다 큰 숫자)');
      return;
    }

    // Validate date is not in the future for server @PastOrPresent validation
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today
    
    if (selectedDate > today) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '기록 날짜는 오늘 이전 날짜여야 합니다.');
      return;
    }

    let result: any;
    
    if (amountType === 'TRANSFER') {
      // Transfer handling
      if (selectedFromAssetId && selectedToAssetId) {
        // 양방향 이체 (기존 로직)
        const transferData = {
          date,
          amount: Math.floor(numericAmount),
          description: description.trim(),
          memo: memo && memo.trim() ? memo.trim() : '',
          bookId: currentBook.id,
          fromAssetId: selectedFromAssetId,
          toAssetId: selectedToAssetId,
          transferer: spender && spender.trim() ? spender.trim() : (user?.name || user?.username || ''),
        };

        console.log('=== 이체 생성 데이터 ===');
        console.log('transferData:', JSON.stringify(transferData, null, 2));
        console.log('token 존재:', !!token);
        console.log('user 정보:', user ? { id: user.id, name: user.name, username: user.username } : 'null');
        console.log('======================');

        try {
          await apiService.createTransfer(transferData, token!);
          result = { success: true };
        } catch (error: any) {
          console.error('이체 생성 실패:', error);
          result = { success: false, error: 'transfer', message: error.message || '이체 생성에 실패했습니다.' };
        }
      } else {
        // 단방향 이체 (일반 거래로 처리)
        const isWithdrawal = selectedFromAssetId && !selectedToAssetId;
        const selectedAsset = isWithdrawal ? selectedFromAssetId : selectedToAssetId;
        const assetName = assets.find(asset => asset.id === selectedAsset)?.name || '자산';
        
        const ledgerData = {
          date,
          amount: Math.floor(numericAmount),
          description: description.trim() + (isWithdrawal ? ' (출금)' : ' (입금)'),
          memo: memo && memo.trim() ? memo.trim() : '',
          amountType: isWithdrawal ? 'EXPENSE' : 'INCOME',
          bookId: currentBook.id,
          payment: assetName,
          category: isWithdrawal ? '출금' : '입금',
          spender: spender && spender.trim() ? spender.trim() : (user?.name || user?.username || ''),
        };

        console.log('=== 단방향 이체 데이터 ===');
        console.log('ledgerData:', JSON.stringify(ledgerData, null, 2));
        console.log('token 존재:', !!token);
        console.log('user 정보:', user ? { id: user.id, name: user.name, username: user.username } : 'null');
        console.log('======================');

        result = await createLedger(ledgerData, token!);
        
        // 자산 잔액 업데이트
        if (selectedAsset && token) {
          try {
            const operation = isWithdrawal ? 'SUBTRACT' : 'ADD';
            await updateAssetBalance(selectedAsset, Math.floor(numericAmount), operation, token);
          } catch (error) {
            console.error('자산 잔액 업데이트 실패:', error);
          }
        }
      }
    } else {
      // Income/Expense handling
      const ledgerData = {
        date, // Keep as string in YYYY-MM-DD format - server will parse to LocalDate
        amount: Math.floor(numericAmount), // Convert to integer for server validation
        description: description.trim(),
        memo: memo && memo.trim() ? memo.trim() : '',
        amountType,
        bookId: currentBook.id,
        payment: selectedPayment.trim(),
        category: selectedCategory.trim(),
        spender: spender && spender.trim() ? spender.trim() : (user?.name || user?.username || ''),
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        currency: selectedCurrency !== 'KRW' ? selectedCurrency : undefined,
      };

      console.log('=== 거래 생성 데이터 ===');
      console.log('ledgerData:', JSON.stringify(ledgerData, null, 2));
      console.log('token 존재:', !!token);
      console.log('user 정보:', user ? { id: user.id, name: user.name, username: user.username } : 'null');
      console.log('======================');

      result = await createLedger(ledgerData, token!);
    }
    
    if (result.success) {
      // 자산 잔액 업데이트 (자산이 선택된 경우, 이체는 제외)
      if (amountType !== 'TRANSFER' && selectedAssetId && token) {
        try {
          const operation = amountType === 'INCOME' ? 'ADD' : 'SUBTRACT';
          await updateAssetBalance(selectedAssetId, Math.floor(numericAmount), operation, token);
        } catch (error) {
          console.error('자산 잔액 업데이트 실패:', error);
          // 자산 업데이트가 실패해도 거래는 이미 성공했으므로 알림만 표시
        }
      }
      
      // 실시간 동기화 이벤트 전송
      await syncService.sendUpdate('LEDGER_CREATED', {
        ...ledgerData,
        id: Date.now(), // Mock ID
        memberId: user?.id || 1,
        bookId: currentBook.id,
        categoryId: 1,
        paymentId: 1
      });
      
      // 푸시 알림 전송 (다른 사용자들에게)
      await notification.sendNewTransactionAlert(
        user?.id?.toString() || '1',
        {
          ...ledgerData,
          amount: numericAmount
        }
      );
      
      const successMessage = amountType === 'TRANSFER' ? 
        (selectedFromAssetId && selectedToAssetId ? '이체가 완료되었습니다.' : '거래가 추가되었습니다.') : 
        '거래가 추가되었습니다.';
      
      Alert.alert('성공', successMessage, [
        { text: '확인', onPress: () => router.back() }
      ]);
    } else {
      // Show specific error messages based on error type
      if (result.error === 'validation') {
        Alert.alert('입력 오류', `입력 데이터를 확인해주세요:\n${result.message}`);
      } else if (result.message) {
        Alert.alert('오류', result.message);
      } else {
        Alert.alert('오류', '거래 추가에 실패했습니다.');
      }
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert('오류', '카테고리명을 입력해주세요.');
      return;
    }

    const result = await createCategoryForBook(currentBook!.id, { category: newCategory.trim() }, token!);
    
    if (result.success) {
      setNewCategory('');
      setShowCategoryModal(false);
      setSelectedCategory(newCategory.trim());
    } else {
      // Show specific error messages based on error type
      if (result.error === 'duplicate') {
        Alert.alert('알림', '이미 존재하는 카테고리입니다.\n다른 이름을 사용해주세요.');
      } else if (result.message) {
        Alert.alert('오류', result.message);
      } else {
        Alert.alert('오류', '카테고리 추가에 실패했습니다.');
      }
    }
  };

  const handleAddPayment = async () => {
    if (!newPayment.trim()) {
      Alert.alert('오류', '결제 수단명을 입력해주세요.');
      return;
    }

    const result = await createPaymentForBook(currentBook!.id, { payment: newPayment.trim() }, token!);
    
    if (result.success) {
      setNewPayment('');
      setShowPaymentModal(false);
      setSelectedPayment(newPayment.trim());
    } else {
      // Show specific error messages based on error type
      if (result.error === 'duplicate') {
        Alert.alert('알림', '이미 존재하는 결제 수단입니다.\n다른 이름을 사용해주세요.');
      } else if (result.message) {
        Alert.alert('오류', result.message);
      } else {
        Alert.alert('오류', '결제 수단 추가에 실패했습니다.');
      }
    }
  };

  // 금액 포맷팅 함수 (유틸리티 함수 사용)
  const formatAmount = (value: string) => {
    return formatAmountInput(value);
  };

  // 금액을 한글 단위로 변환 (유틸리티 함수 사용)
  const formatKoreanAmount = (value: string) => {
    return formatKoreanAmount(value);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.tint} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>거래 추가</Text>
          </View>

          {/* 수입/지출/이체 타입 선택 */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                amountType === 'EXPENSE' && styles.activeTypeButton,
                { backgroundColor: amountType === 'EXPENSE' ? '#FF3B30' : colors.card }
              ]}
              onPress={() => setAmountType('EXPENSE')}
            >
              <Ionicons 
                name="remove-circle" 
                size={24} 
                color={amountType === 'EXPENSE' ? 'white' : colors.text} 
              />
              <Text style={[
                styles.typeButtonText,
                { color: amountType === 'EXPENSE' ? 'white' : colors.text }
              ]}>지출</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                amountType === 'INCOME' && styles.activeTypeButton,
                { backgroundColor: amountType === 'INCOME' ? '#4CAF50' : colors.card }
              ]}
              onPress={() => setAmountType('INCOME')}
            >
              <Ionicons 
                name="add-circle" 
                size={24} 
                color={amountType === 'INCOME' ? 'white' : colors.text} 
              />
              <Text style={[
                styles.typeButtonText,
                { color: amountType === 'INCOME' ? 'white' : colors.text }
              ]}>수입</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                amountType === 'TRANSFER' && styles.activeTypeButton,
                { backgroundColor: amountType === 'TRANSFER' ? '#FF9800' : colors.card }
              ]}
              onPress={() => setAmountType('TRANSFER')}
            >
              <Ionicons 
                name="swap-horizontal" 
                size={24} 
                color={amountType === 'TRANSFER' ? 'white' : colors.text} 
              />
              <Text style={[
                styles.typeButtonText,
                { color: amountType === 'TRANSFER' ? 'white' : colors.text }
              ]}>이체</Text>
            </TouchableOpacity>
          </View>

          {/* 폼 */}
          <View style={styles.form}>
            {/* 금액 */}
            <View ref={amountRef} style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>금액 *</Text>
              <View style={styles.amountContainer}>
                <TouchableOpacity
                  style={[styles.currencyButton, { backgroundColor: colors.card }]}
                  onPress={() => currencies.length > 1 && setShowCurrencyModal(true)}
                  disabled={currencies.length <= 1}
                >
                  <Text style={[styles.currencyButtonText, { color: colors.text }]}>
                    {selectedCurrency}
                  </Text>
                  {currencies.length > 1 && (
                    <Ionicons name="chevron-down" size={16} color={colors.icon} />
                  )}
                </TouchableOpacity>
                <TextInput
                  style={[styles.amountInput, { color: colors.text, borderColor: colors.card }]}
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                  value={amount}
                  onChangeText={(text) => {
                    const formattedText = formatAmountInput(text);
                    setAmount(formattedText);
                  }}
                  keyboardType="numeric"
                />
              </View>
              {amount && selectedCurrency === 'KRW' && (
                <Text style={[styles.amountInWords, { color: colors.icon }]}>
                  {formatKoreanAmount(amount)}
                </Text>
              )}
            </View>

            {/* 설명 */}
            <View ref={descriptionRef} style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>설명 *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="거래 설명을 입력하세요"
                placeholderTextColor={colors.icon}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* 카테고리 (수입/지출만) */}
            {amountType !== 'TRANSFER' && (
              <View ref={categoryRef} style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>카테고리 *</Text>
                <TouchableOpacity
                  style={[styles.selectButton, { backgroundColor: colors.card }]}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <View style={styles.selectButtonContent}>
                    {selectedCategoryEmoji && (
                      <Text style={styles.selectButtonEmoji}>{selectedCategoryEmoji}</Text>
                    )}
                    <Text style={[styles.selectButtonText, { color: selectedCategory ? colors.text : colors.icon }]}>
                      {selectedCategory || '카테고리 선택'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color={colors.icon} />
                </TouchableOpacity>
              </View>
            )}

            {/* 자산 선택 (수입/지출만) */}
            {amountType !== 'TRANSFER' && (
              <View ref={assetRef} style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>자산 *</Text>
                <TouchableOpacity
                  style={[styles.selectButton, { backgroundColor: colors.card }]}
                  onPress={() => setShowPaymentModal(true)}
                >
                  <View style={styles.selectButtonContent}>
                    {selectedAssetId && (
                      <View style={styles.assetIndicator}>
                        {(() => {
                          const selectedAsset = assets.find(asset => asset.id === selectedAssetId);
                          if (selectedAsset) {
                            const assetType = assetTypes.find(type => type.type === selectedAsset.assetType);
                            return (
                              <>
                                <View style={[styles.assetIcon, { backgroundColor: assetType?.color || '#007AFF' }]}>
                                  <Ionicons name={assetType?.icon as any || 'card'} size={16} color="white" />
                                </View>
                                <View style={styles.assetInfo}>
                                  <Text style={[styles.assetName, { color: colors.text }]}>{selectedAsset.name}</Text>
                                  <Text style={[styles.assetBalance, { color: colors.icon }]}>
                                    ₩{selectedAsset.balance.toLocaleString()}
                                  </Text>
                                </View>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </View>
                    )}
                    <Text style={[styles.selectButtonText, { 
                      color: selectedAssetId ? colors.text : colors.icon,
                      flex: selectedAssetId ? 0 : 1
                    }]}>
                      {selectedAssetId ? '' : '자산 선택'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color={colors.icon} />
                </TouchableOpacity>
              </View>
            )}

            {/* 태그 선택 (수입/지출만) */}
            {amountType !== 'TRANSFER' && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>태그 (선택)</Text>
                <TouchableOpacity
                  style={[styles.selectButton, { backgroundColor: colors.card }]}
                  onPress={() => setShowTagModal(true)}
                >
                  <View style={styles.selectButtonContent}>
                    {selectedTags.length > 0 ? (
                      <View style={styles.tagsContainer}>
                        {selectedTags.map((tagId) => {
                          const tag = tags.find(t => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <View key={tagId} style={[styles.tagChip, { backgroundColor: tag.color + '20' }]}>
                              <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                              <Text style={[styles.tagText, { color: colors.text }]}>{tag.name}</Text>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={[styles.selectButtonText, { color: colors.icon }]}>
                        태그를 선택하세요
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-down" size={20} color={colors.icon} />
                </TouchableOpacity>
              </View>
            )}

            {/* 출금 자산 선택 (이체만) */}
            {amountType === 'TRANSFER' && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>출금 자산</Text>
                <Text style={[styles.helperText, { color: colors.icon }]}>출금 또는 입금 자산 중 하나는 반드시 선택해야 합니다</Text>
                <TouchableOpacity
                  style={[styles.selectButton, { backgroundColor: colors.card }]}
                  onPress={() => setShowFromAssetModal(true)}
                >
                  <View style={styles.selectButtonContent}>
                    {selectedFromAssetId && (
                      <View style={styles.assetIndicator}>
                        {(() => {
                          const selectedAsset = assets.find(asset => asset.id === selectedFromAssetId);
                          if (selectedAsset) {
                            const assetType = assetTypes.find(type => type.type === selectedAsset.assetType);
                            return (
                              <>
                                <View style={[styles.assetIcon, { backgroundColor: assetType?.color || '#007AFF' }]}>
                                  <Ionicons name={assetType?.icon as any || 'card'} size={16} color="white" />
                                </View>
                                <View style={styles.assetInfo}>
                                  <Text style={[styles.assetName, { color: colors.text }]}>{selectedAsset.name}</Text>
                                  <Text style={[styles.assetBalance, { color: colors.icon }]}>
                                    ₩{selectedAsset.balance.toLocaleString()}
                                  </Text>
                                </View>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </View>
                    )}
                    <Text style={[styles.selectButtonText, { 
                      color: selectedFromAssetId ? colors.text : colors.icon,
                      flex: selectedFromAssetId ? 0 : 1
                    }]}>
                      {selectedFromAssetId ? '' : '출금 자산 선택'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color={colors.icon} />
                </TouchableOpacity>
              </View>
            )}

            {/* 입금 자산 선택 (이체만) */}
            {amountType === 'TRANSFER' && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>입금 자산</Text>
                <TouchableOpacity
                  style={[styles.selectButton, { backgroundColor: colors.card }]}
                  onPress={() => setShowToAssetModal(true)}
                >
                  <View style={styles.selectButtonContent}>
                    {selectedToAssetId && (
                      <View style={styles.assetIndicator}>
                        {(() => {
                          const selectedAsset = assets.find(asset => asset.id === selectedToAssetId);
                          if (selectedAsset) {
                            const assetType = assetTypes.find(type => type.type === selectedAsset.assetType);
                            return (
                              <>
                                <View style={[styles.assetIcon, { backgroundColor: assetType?.color || '#007AFF' }]}>
                                  <Ionicons name={assetType?.icon as any || 'card'} size={16} color="white" />
                                </View>
                                <View style={styles.assetInfo}>
                                  <Text style={[styles.assetName, { color: colors.text }]}>{selectedAsset.name}</Text>
                                  <Text style={[styles.assetBalance, { color: colors.icon }]}>
                                    ₩{selectedAsset.balance.toLocaleString()}
                                  </Text>
                                </View>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </View>
                    )}
                    <Text style={[styles.selectButtonText, { 
                      color: selectedToAssetId ? colors.text : colors.icon,
                      flex: selectedToAssetId ? 0 : 1
                    }]}>
                      {selectedToAssetId ? '' : '입금 자산 선택'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color={colors.icon} />
                </TouchableOpacity>
              </View>
            )}

            {/* 날짜 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>날짜</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={date}
                onChangeText={(text) => {
                  // Basic format validation for YYYY-MM-DD
                  if (text.length <= 10 && /^[0-9-]*$/.test(text)) {
                    setDate(text);
                  }
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.icon}
                maxLength={10}
                keyboardType="numeric"
              />
            </View>

            {/* 지출자 (선택사항) */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>지출자</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="지출자를 입력하세요 (선택사항)"
                placeholderTextColor={colors.icon}
                value={spender}
                onChangeText={setSpender}
              />
            </View>

            {/* 메모 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>메모</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="추가 메모를 입력하세요 (선택사항)"
                placeholderTextColor={colors.icon}
                value={memo}
                onChangeText={setMemo}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* 저장 버튼 */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.tint, opacity: isLoading ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Ionicons name="save" size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {isLoading ? '저장 중...' : '거래 저장'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 카테고리 선택 모달 */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCategoryModal(false)}
        >
          <TouchableOpacity 
            style={[
              styles.modalContent, 
              { 
                backgroundColor: colors.background,
                minHeight: categories.length > 5 ? 500 : 300,
                maxHeight: categories.length > 10 ? '90%' : '80%'
              }
            ]} 
            activeOpacity={1}
            onPress={() => {}} // 모달 내부 터치 시 닫히지 않도록 빈 함수
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>카테고리 선택</Text>
            
            <ScrollView style={[
              styles.modalList,
              { maxHeight: categories.length > 8 ? 350 : 250 }
            ]}>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.modalItem, { backgroundColor: colors.card }]}
                    onPress={() => {
                      setSelectedCategory(category.category);
                      setSelectedCategoryEmoji(category.emoji || '📝');
                      setShowCategoryModal(false);
                    }}
                  >
                    <View style={styles.modalItemContent}>
                      <Text style={styles.modalItemEmoji}>
                        {category.emoji || '📝'}
                      </Text>
                      <Text style={[styles.modalItemText, { color: colors.text }]}>
                        {category.category}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.icon }]}>
                    등록된 카테고리가 없습니다.
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: colors.icon }]}>
                    아래에서 새로운 카테고리를 추가해주세요.
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalAddSection}>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="새 카테고리 추가"
                placeholderTextColor={colors.icon}
                value={newCategory}
                onChangeText={setNewCategory}
              />
              <TouchableOpacity
                style={[styles.modalAddButton, { backgroundColor: colors.tint }]}
                onPress={handleAddCategory}
              >
                <Text style={styles.modalAddButtonText}>추가</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.card }]}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>닫기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 자산 선택 모달 */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowPaymentModal(false)}
        >
          <TouchableOpacity 
            style={[
              styles.modalContent, 
              { 
                backgroundColor: colors.background,
                minHeight: assets.length > 5 ? 500 : 300,
                maxHeight: assets.length > 10 ? '90%' : '80%'
              }
            ]} 
            activeOpacity={1}
            onPress={() => {}} // 모달 내부 터치 시 닫히지 않도록 빈 함수
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>자산 선택</Text>
            
            <ScrollView style={[
              styles.modalList,
              { maxHeight: assets.length > 8 ? 350 : 250 }
            ]}>
              {assets.filter(asset => asset.isActive).length > 0 ? (
                assets.filter(asset => asset.isActive).map((asset) => {
                  const assetType = assetTypes.find(type => type.type === asset.assetType);
                  return (
                    <TouchableOpacity
                      key={asset.id}
                      style={[styles.modalItem, { backgroundColor: colors.card }]}
                      onPress={() => {
                        setSelectedAssetId(asset.id);
                        setSelectedPayment(asset.name);
                        setShowPaymentModal(false);
                      }}
                    >
                      <View style={styles.modalAssetItem}>
                        <View style={[styles.modalAssetIcon, { backgroundColor: assetType?.color || '#007AFF' }]}>
                          <Ionicons name={assetType?.icon as any || 'card'} size={20} color="white" />
                        </View>
                        <View style={styles.modalAssetInfo}>
                          <Text style={[styles.modalAssetName, { color: colors.text }]}>
                            {asset.name}
                          </Text>
                          <Text style={[styles.modalAssetType, { color: colors.icon }]}>
                            {assetType?.name} • ₩{asset.balance.toLocaleString()}
                          </Text>
                          {asset.description && (
                            <Text style={[styles.modalAssetDescription, { color: colors.icon }]}>
                              {asset.description}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.icon }]}>
                    등록된 자산이 없습니다.
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: colors.icon }]}>
                    자산 탭에서 자산을 추가해주세요.
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalAddButton, { backgroundColor: colors.tint, marginVertical: 10 }]}
              onPress={() => {
                setShowPaymentModal(false);
                router.push('/(modals)/add-asset');
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text style={[styles.modalAddButtonText, { marginLeft: 8 }]}>새 자산 추가</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.card }]}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>닫기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 출금 자산 선택 모달 */}
      <Modal
        visible={showFromAssetModal}
        transparent
        animationType="slide"
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowFromAssetModal(false)}
        >
          <TouchableOpacity 
            style={[
              styles.modalContent, 
              { 
                backgroundColor: colors.background,
                minHeight: assets.length > 5 ? 500 : 300,
                maxHeight: assets.length > 10 ? '90%' : '80%'
              }
            ]} 
            activeOpacity={1}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>출금 자산 선택</Text>
            
            <ScrollView style={[
              styles.modalList,
              { maxHeight: assets.length > 8 ? 350 : 250 }
            ]}>
              {assets.filter(asset => asset.isActive).length > 0 ? (
                assets.filter(asset => asset.isActive).map((asset) => {
                  const assetType = assetTypes.find(type => type.type === asset.assetType);
                  return (
                    <TouchableOpacity
                      key={asset.id}
                      style={[styles.modalItem, { backgroundColor: colors.card }]}
                      onPress={() => {
                        setSelectedFromAssetId(asset.id);
                        setShowFromAssetModal(false);
                      }}
                    >
                      <View style={styles.modalAssetItem}>
                        <View style={[styles.modalAssetIcon, { backgroundColor: assetType?.color || '#007AFF' }]}>
                          <Ionicons name={assetType?.icon as any || 'card'} size={20} color="white" />
                        </View>
                        <View style={styles.modalAssetInfo}>
                          <Text style={[styles.modalAssetName, { color: colors.text }]}>
                            {asset.name}
                          </Text>
                          <Text style={[styles.modalAssetType, { color: colors.icon }]}>
                            {assetType?.name} • ₩{asset.balance.toLocaleString()}
                          </Text>
                          {asset.description && (
                            <Text style={[styles.modalAssetDescription, { color: colors.icon }]}>
                              {asset.description}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.icon }]}>
                    등록된 자산이 없습니다.
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: colors.icon }]}>
                    자산 탭에서 자산을 추가해주세요.
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalAddButton, { backgroundColor: colors.tint, marginVertical: 10 }]}
              onPress={() => {
                setShowFromAssetModal(false);
                router.push('/(modals)/add-asset');
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text style={[styles.modalAddButtonText, { marginLeft: 8 }]}>새 자산 추가</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.card }]}
              onPress={() => setShowFromAssetModal(false)}
            >
              <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>닫기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 입금 자산 선택 모달 */}
      <Modal
        visible={showToAssetModal}
        transparent
        animationType="slide"
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowToAssetModal(false)}
        >
          <TouchableOpacity 
            style={[
              styles.modalContent, 
              { 
                backgroundColor: colors.background,
                minHeight: assets.length > 5 ? 500 : 300,
                maxHeight: assets.length > 10 ? '90%' : '80%'
              }
            ]} 
            activeOpacity={1}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>입금 자산 선택</Text>
            
            <ScrollView style={[
              styles.modalList,
              { maxHeight: assets.length > 8 ? 350 : 250 }
            ]}>
              {assets.filter(asset => asset.isActive).length > 0 ? (
                assets.filter(asset => asset.isActive).map((asset) => {
                  const assetType = assetTypes.find(type => type.type === asset.assetType);
                  return (
                    <TouchableOpacity
                      key={asset.id}
                      style={[styles.modalItem, { backgroundColor: colors.card }]}
                      onPress={() => {
                        setSelectedToAssetId(asset.id);
                        setShowToAssetModal(false);
                      }}
                    >
                      <View style={styles.modalAssetItem}>
                        <View style={[styles.modalAssetIcon, { backgroundColor: assetType?.color || '#007AFF' }]}>
                          <Ionicons name={assetType?.icon as any || 'card'} size={20} color="white" />
                        </View>
                        <View style={styles.modalAssetInfo}>
                          <Text style={[styles.modalAssetName, { color: colors.text }]}>
                            {asset.name}
                          </Text>
                          <Text style={[styles.modalAssetType, { color: colors.icon }]}>
                            {assetType?.name} • ₩{asset.balance.toLocaleString()}
                          </Text>
                          {asset.description && (
                            <Text style={[styles.modalAssetDescription, { color: colors.icon }]}>
                              {asset.description}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.icon }]}>
                    등록된 자산이 없습니다.
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: colors.icon }]}>
                    자산 탭에서 자산을 추가해주세요.
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalAddButton, { backgroundColor: colors.tint, marginVertical: 10 }]}
              onPress={() => {
                setShowToAssetModal(false);
                router.push('/(modals)/add-asset');
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text style={[styles.modalAddButtonText, { marginLeft: 8 }]}>새 자산 추가</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.card }]}
              onPress={() => setShowToAssetModal(false)}
            >
              <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>닫기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 태그 선택 모달 */}
      <Modal
        visible={showTagModal}
        transparent
        animationType="slide"
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowTagModal(false)}
        >
          <TouchableOpacity 
            style={[
              styles.modalContent, 
              { 
                backgroundColor: colors.background,
                minHeight: tags.length > 5 ? 500 : 300,
                maxHeight: tags.length > 10 ? '90%' : '80%'
              }
            ]} 
            activeOpacity={1}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>태그 선택</Text>
            
            <ScrollView style={[
              styles.modalList,
              { maxHeight: tags.length > 8 ? 350 : 250 }
            ]}>
              {tags.length > 0 ? (
                tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.modalItem, 
                        { 
                          backgroundColor: isSelected ? tag.color + '20' : colors.card,
                          borderWidth: isSelected ? 1 : 0,
                          borderColor: isSelected ? tag.color : 'transparent'
                        }
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedTags(selectedTags.filter(id => id !== tag.id));
                        } else {
                          setSelectedTags([...selectedTags, tag.id]);
                        }
                      }}
                    >
                      <View style={styles.modalItemContent}>
                        <View style={[styles.tagModalDot, { backgroundColor: tag.color }]} />
                        <Text style={[styles.modalItemText, { color: colors.text }]}>
                          {tag.name}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color={tag.color} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.icon }]}>
                    등록된 태그가 없습니다.
                  </Text>
                  <TouchableOpacity
                    style={[styles.modalAddButton, { backgroundColor: colors.tint, marginTop: 16 }]}
                    onPress={() => {
                      setShowTagModal(false);
                      router.push('/(modals)/tags');
                    }}
                  >
                    <Text style={styles.modalAddButtonText}>태그 관리로 이동</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.card }]}
              onPress={() => setShowTagModal(false)}
            >
              <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>완료</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 통화 선택 모달 */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="slide"
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCurrencyModal(false)}
        >
          <TouchableOpacity 
            style={[styles.modalContent, { backgroundColor: colors.background }]} 
            activeOpacity={1}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>통화 선택</Text>
            
            <ScrollView style={styles.modalList}>
              {currencies.map((currency) => (
                <TouchableOpacity
                  key={currency.id}
                  style={[
                    styles.modalItem, 
                    { 
                      backgroundColor: selectedCurrency === currency.code ? colors.tint + '20' : colors.card,
                      borderWidth: selectedCurrency === currency.code ? 1 : 0,
                      borderColor: selectedCurrency === currency.code ? colors.tint : 'transparent'
                    }
                  ]}
                  onPress={() => {
                    setSelectedCurrency(currency.code);
                    setShowCurrencyModal(false);
                  }}
                >
                  <View style={styles.modalItemContent}>
                    <Text style={[styles.currencyCode, { color: colors.text }]}>
                      {currency.code}
                    </Text>
                    <Text style={[styles.currencyName, { color: colors.icon }]}>
                      {currency.name} ({currency.symbol})
                    </Text>
                    {selectedCurrency === currency.code && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.card }]}
              onPress={() => setShowCurrencyModal(false)}
            >
              <Text style={[styles.modalCloseButtonText, { color: colors.text }]}>닫기</Text>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
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
  typeSelector: {
    flexDirection: 'row',
    margin: 16,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  activeTypeButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  helperText: {
    fontSize: 12,
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 8,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    padding: 0,
  },
  amountInWords: {
    fontSize: 14,
    marginTop: 4,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  selectButton: {
    height: 50,
    borderRadius: 12,
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
  selectButtonEmoji: {
    fontSize: 18,
  },
  selectButtonText: {
    fontSize: 16,
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalList: {
    maxHeight: 400,
    flex: 1,
  },
  modalItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalItemEmoji: {
    fontSize: 20,
  },
  modalItemText: {
    fontSize: 16,
    flex: 1,
  },
  modalAddSection: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  modalInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  modalAddButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAddButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalCloseButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  assetIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assetIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 14,
    fontWeight: '500',
  },
  assetBalance: {
    fontSize: 12,
    marginTop: 2,
  },
  modalAssetItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAssetIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalAssetInfo: {
    flex: 1,
  },
  modalAssetName: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalAssetType: {
    fontSize: 12,
    marginTop: 2,
  },
  modalAssetDescription: {
    fontSize: 11,
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagModalDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    gap: 4,
  },
  currencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: '600',
  },
  currencyName: {
    fontSize: 14,
    flex: 1,
  },
});