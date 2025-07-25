import apiService from '@/core/api/client';
import { notification } from '@/core/notifications/local';
import { useTheme } from '@/contexts/ThemeContext';
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
import { Calendar, LocaleConfig } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { firebaseService } from '@/services/firebaseService';
import { AnalyticsEvents } from '@/utils/analytics';

// 한국어 달력 설정
LocaleConfig.locales['kr'] = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';


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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'calendar' | 'input'>('input');
  
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
  const { colors } = useTheme();

  useEffect(() => {
    if (token && currentBook) {
      fetchCategoriesByBook(currentBook.id, token);
      fetchPaymentsByBook(currentBook.id, token);
      fetchAssetsByBook(currentBook.id, token);
      fetchTags();
      fetchCurrencies();
    }
  }, [token, currentBook, fetchCategoriesByBook, fetchPaymentsByBook, fetchAssetsByBook]);

  // Analytics: Track modal open
  useEffect(() => {
    firebaseService.logEvent(AnalyticsEvents.MODAL_OPEN, {
      modal_type: 'add_transaction',
      book_id: currentBook?.id
    });
    
    firebaseService.logScreenView('AddTransactionModal', 'Modal');
  }, []);

  const fetchTags = async () => {
    if (!token || !currentBook?.id) return;
    
    try {
      const tags = await apiService.getTagsByBook(currentBook.id);
      setTags(tags || []);
    } catch (error: any) {
      console.error('태그 조회 실패:', error);
      // 404는 정상적인 경우 (태그가 없음)
      if (error.response?.status === 404) {
        setTags([]);
      }
    }
  };

  const fetchCurrencies = async () => {
    if (!token || !currentBook?.id) return;
    
    try {
      // 가계부의 통화 설정 조회
      const bookCurrencySettings = await apiService.getBookCurrencySettings(currentBook.id);
      setBookCurrencies([bookCurrencySettings]);
      
      // 전체 통화 목록 조회
      const currencies = await apiService.getCurrencies();
      setCurrencies(currencies);
      
      // 기본 통화 설정
      if (bookCurrencySettings.defaultCurrency) {
        setSelectedCurrency(bookCurrencySettings.defaultCurrency);
      } else {
        setSelectedCurrency('KRW');
      }
    } catch (error: any) {
      console.error('통화 조회 실패:', error);
      // 에러 발생 시 기본값 설정
      setSelectedCurrency('KRW');
      setCurrencies([]);
      setBookCurrencies([]);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    // 이미 저장 중이면 중복 실행 방지
    if (isSaving) return;
    
    setIsSaving(true);
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
        setIsSaving(false);
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
      setIsSaving(false);
      return;
    }

    if (!currentBook?.id) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '가계부를 선택해주세요.');
      setIsSaving(false);
      return;
    }

    const numericAmount = parseFormattedNumber(amount);
    if (numericAmount <= 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '올바른 금액을 입력해주세요. (0보다 큰 숫자)');
      setIsSaving(false);
      return;
    }

    // Validate date is not in the future for server @PastOrPresent validation
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today
    
    if (selectedDate > today) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '기록 날짜는 오늘 이전 날짜여야 합니다.');
      setIsSaving(false);
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
      // Analytics: Track successful transaction creation
      await firebaseService.logEvent(AnalyticsEvents.TRANSACTION_ADD, {
        amount_type: amountType,
        amount: Math.floor(numericAmount),
        category: selectedCategory || null,
        payment_method: selectedPayment || null,
        has_tags: selectedTags.length > 0,
        tags_count: selectedTags.length,
        currency: selectedCurrency,
        book_id: currentBook?.id,
        is_transfer: amountType === 'TRANSFER',
        transfer_type: amountType === 'TRANSFER' ? 
          (selectedFromAssetId && selectedToAssetId ? 'bidirectional' : 'unidirectional') : null
      });

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
      
      // 성공 피드백
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // 홈 화면의 데이터 새로고침
      if (token && currentBook) {
        // 캘린더 데이터 강제 새로고침을 위해 ledgers 다시 불러오기
        const { fetchLedgers } = useBookStore.getState();
        await fetchLedgers({
          bookId: currentBook.id,
          page: 0,
          size: 1000
        }, token);
      }
      
      // 모달 닫기
      setIsSaving(false);
      router.back();
    } else {
      // Analytics: Track transaction creation failure
      await firebaseService.logEvent('transaction_add_failed', {
        error_type: result.error || 'unknown',
        error_message: result.message || 'unknown error',
        amount_type: amountType,
        book_id: currentBook?.id
      });

      // Show specific error messages based on error type
      if (result.error === 'validation') {
        Alert.alert('입력 오류', result.message || '입력 데이터를 확인해주세요.');
      } else if (result.error === 'server') {
        Alert.alert('서버 오류', result.message || '서버 오류가 발생했습니다.');
      } else if (result.message) {
        Alert.alert('오류', result.message);
      } else {
        Alert.alert('오류', '거래 추가에 실패했습니다.');
      }
      setIsSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert('오류', '카테고리명을 입력해주세요.');
      return;
    }

    const result = await createCategoryForBook(currentBook!.id, { category: newCategory.trim() }, token!);
    
    if (result.success) {
      // Analytics: Track category creation
      await firebaseService.logEvent(AnalyticsEvents.CATEGORY_CREATE, {
        category_name: newCategory.trim(),
        book_id: currentBook?.id,
        created_from: 'transaction_modal'
      });
      
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
      // Analytics: Track payment method creation
      await firebaseService.logEvent('payment_method_create', {
        payment_name: newPayment.trim(),
        book_id: currentBook?.id,
        created_from: 'transaction_modal'
      });
      
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
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>거래 추가</Text>
          </View>

          {/* 수입/지출/이체 타입 선택 */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                amountType === 'EXPENSE' && styles.activeTypeButton,
                { backgroundColor: amountType === 'EXPENSE' ? colors.expense : colors.card }
              ]}
              onPress={() => {
                setAmountType('EXPENSE');
                // Analytics: Track transaction type selection
                firebaseService.logEvent('transaction_type_selected', {
                  type: 'EXPENSE',
                  book_id: currentBook?.id
                });
              }}
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
                { backgroundColor: amountType === 'INCOME' ? colors.income : colors.card }
              ]}
              onPress={() => {
                setAmountType('INCOME');
                // Analytics: Track transaction type selection
                firebaseService.logEvent('transaction_type_selected', {
                  type: 'INCOME',
                  book_id: currentBook?.id
                });
              }}
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
                { backgroundColor: amountType === 'TRANSFER' ? colors.transfer : colors.card }
              ]}
              onPress={() => {
                setAmountType('TRANSFER');
                // Analytics: Track transaction type selection
                firebaseService.logEvent('transaction_type_selected', {
                  type: 'TRANSFER',
                  book_id: currentBook?.id
                });
              }}
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
                  onPress={() => {
                    if (currencies.length > 1) {
                      setShowCurrencyModal(true);
                      // Analytics: Track currency modal open
                      firebaseService.logEvent('modal_opened', {
                        modal_type: 'currency_selection',
                        context: 'add_transaction'
                      });
                    }
                  }}
                  disabled={currencies.length <= 1}
                >
                  <Text style={[styles.currencyButtonText, { color: colors.text }]}>
                    {selectedCurrency}
                  </Text>
                  {currencies.length > 1 && (
                    <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
                <TextInput
                  style={[styles.amountInput, { color: colors.text, borderColor: colors.card }]}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  value={amount}
                  onChangeText={(text) => {
                    const formattedText = formatAmountInput(text);
                    setAmount(formattedText);
                  }}
                  keyboardType="numeric"
                />
              </View>
              {amount && selectedCurrency === 'KRW' && (
                <Text style={[styles.amountInWords, { color: colors.textTertiary }]}>
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
                placeholderTextColor={colors.textTertiary}
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
                  onPress={() => {
                    setShowCategoryModal(true);
                    // Analytics: Track category modal open
                    firebaseService.logEvent('modal_opened', {
                      modal_type: 'category_selection',
                      context: 'add_transaction'
                    });
                  }}
                >
                  <View style={styles.selectButtonContent}>
                    {selectedCategoryEmoji && (
                      <Text style={styles.selectButtonEmoji}>{selectedCategoryEmoji}</Text>
                    )}
                    <Text style={[styles.selectButtonText, { color: selectedCategory ? colors.text : colors.icon }]}>
                      {selectedCategory || '카테고리 선택'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            )}

            {/* 자산 선택 (수입/지출만) */}
            {amountType !== 'TRANSFER' && (
              <View ref={assetRef} style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>자산 *</Text>
                <TouchableOpacity
                  style={[styles.selectButton, { backgroundColor: colors.card }]}
                  onPress={() => {
                    setShowPaymentModal(true);
                    // Analytics: Track payment modal open
                    firebaseService.logEvent('modal_opened', {
                      modal_type: 'asset_selection',
                      context: 'add_transaction'
                    });
                  }}
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
                                <View style={[styles.assetIcon, { backgroundColor: assetType?.color || colors.primary }]}>
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
                  <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            )}

            {/* 태그 선택 (수입/지출만) */}
            {amountType !== 'TRANSFER' && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>태그 (선택)</Text>
                <TouchableOpacity
                  style={[styles.selectButton, { backgroundColor: colors.card }]}
                  onPress={() => {
                    setShowTagModal(true);
                    // Analytics: Track tag modal open
                    firebaseService.logEvent('modal_opened', {
                      modal_type: 'tag_selection',
                      context: 'add_transaction'
                    });
                  }}
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
                  <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            )}

            {/* 출금 자산 선택 (이체만) */}
            {amountType === 'TRANSFER' && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>출금 자산</Text>
                <Text style={[styles.helperText, { color: colors.textTertiary }]}>출금 또는 입금 자산 중 하나는 반드시 선택해야 합니다</Text>
                <TouchableOpacity
                  style={[styles.selectButton, { backgroundColor: colors.card }]}
                  onPress={() => {
                    setShowFromAssetModal(true);
                    // Analytics: Track from asset modal open
                    firebaseService.logEvent('modal_opened', {
                      modal_type: 'from_asset_selection',
                      context: 'add_transaction_transfer'
                    });
                  }}
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
                                <View style={[styles.assetIcon, { backgroundColor: assetType?.color || colors.primary }]}>
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
                  <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            )}

            {/* 입금 자산 선택 (이체만) */}
            {amountType === 'TRANSFER' && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>입금 자산</Text>
                <TouchableOpacity
                  style={[styles.selectButton, { backgroundColor: colors.card }]}
                  onPress={() => {
                    setShowToAssetModal(true);
                    // Analytics: Track to asset modal open
                    firebaseService.logEvent('modal_opened', {
                      modal_type: 'to_asset_selection',
                      context: 'add_transaction_transfer'
                    });
                  }}
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
                                <View style={[styles.assetIcon, { backgroundColor: assetType?.color || colors.primary }]}>
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
                  <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            )}

            {/* 날짜 */}
            <View style={styles.inputContainer}>
              <View style={styles.dateHeader}>
                <Text style={[styles.label, { color: colors.text }]}>날짜</Text>
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
                      // Analytics: Track date input mode selection
                      firebaseService.logEvent('date_picker_mode_changed', {
                        mode: 'input',
                        context: 'add_transaction'
                      });
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
                      // Analytics: Track date calendar mode selection
                      firebaseService.logEvent('date_picker_mode_changed', {
                        mode: 'calendar',
                        context: 'add_transaction'
                      });
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
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={date}
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
                        setDate(text);
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
                  style={[styles.selectButton, { backgroundColor: colors.card }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View style={styles.selectButtonContent}>
                    <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />
                    <Text style={[styles.selectButtonText, { color: date ? colors.text : colors.icon }]}>
                      {date || '날짜를 선택하세요'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            {/* 지출자 (선택사항) */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>지출자</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="지출자를 입력하세요 (선택사항)"
                placeholderTextColor={colors.textTertiary}
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
                placeholderTextColor={colors.textTertiary}
                value={memo}
                onChangeText={setMemo}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* 저장 버튼 */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={isSaving}
            >
              <Ionicons name="save" size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {isSaving ? '저장 중...' : '거래 저장'}
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
                      
                      // Analytics: Track category selection
                      firebaseService.logEvent('category_selected', {
                        category_name: category.category,
                        book_id: currentBook?.id,
                        selected_from: 'transaction_modal'
                      });
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
                placeholderTextColor={colors.textTertiary}
                value={newCategory}
                onChangeText={setNewCategory}
              />
              <TouchableOpacity
                style={[styles.modalAddButton, { backgroundColor: colors.primary }]}
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
                        
                        // Analytics: Track asset selection
                        firebaseService.logEvent('asset_selected', {
                          asset_id: asset.id,
                          asset_name: asset.name,
                          asset_type: asset.assetType,
                          asset_balance: asset.balance,
                          book_id: currentBook?.id,
                          selected_from: 'transaction_modal'
                        });
                      }}
                    >
                      <View style={styles.modalAssetItem}>
                        <View style={[styles.modalAssetIcon, { backgroundColor: assetType?.color || colors.primary }]}>
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
              style={[styles.modalAddButton, { backgroundColor: colors.primary, marginVertical: 10 }]}
              onPress={() => {
                setShowPaymentModal(false);
                // Analytics: Track navigation to add asset from transaction modal
                firebaseService.logEvent('navigate_to_add_asset', {
                  from_modal: 'transaction_payment_selection',
                  context: 'add_transaction'
                });
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
                        
                        // Analytics: Track from asset selection for transfer
                        firebaseService.logEvent('transfer_from_asset_selected', {
                          asset_id: asset.id,
                          asset_name: asset.name,
                          asset_type: asset.assetType,
                          asset_balance: asset.balance,
                          book_id: currentBook?.id
                        });
                      }}
                    >
                      <View style={styles.modalAssetItem}>
                        <View style={[styles.modalAssetIcon, { backgroundColor: assetType?.color || colors.primary }]}>
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
              style={[styles.modalAddButton, { backgroundColor: colors.primary, marginVertical: 10 }]}
              onPress={() => {
                setShowFromAssetModal(false);
                // Analytics: Track navigation to add asset from transfer modal
                firebaseService.logEvent('navigate_to_add_asset', {
                  from_modal: 'transfer_from_asset_selection',
                  context: 'add_transaction'
                });
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
                        
                        // Analytics: Track to asset selection for transfer
                        firebaseService.logEvent('transfer_to_asset_selected', {
                          asset_id: asset.id,
                          asset_name: asset.name,
                          asset_type: asset.assetType,
                          asset_balance: asset.balance,
                          book_id: currentBook?.id
                        });
                      }}
                    >
                      <View style={styles.modalAssetItem}>
                        <View style={[styles.modalAssetIcon, { backgroundColor: assetType?.color || colors.primary }]}>
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
              style={[styles.modalAddButton, { backgroundColor: colors.primary, marginVertical: 10 }]}
              onPress={() => {
                setShowToAssetModal(false);
                // Analytics: Track navigation to add asset from transfer modal
                firebaseService.logEvent('navigate_to_add_asset', {
                  from_modal: 'transfer_to_asset_selection',
                  context: 'add_transaction'
                });
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
                          // Analytics: Track tag deselection
                          firebaseService.logEvent('tag_deselected', {
                            tag_id: tag.id,
                            tag_name: tag.name,
                            book_id: currentBook?.id
                          });
                        } else {
                          setSelectedTags([...selectedTags, tag.id]);
                          // Analytics: Track tag selection
                          firebaseService.logEvent('tag_selected', {
                            tag_id: tag.id,
                            tag_name: tag.name,
                            book_id: currentBook?.id
                          });
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
                    style={[styles.modalAddButton, { backgroundColor: colors.primary, marginTop: 16 }]}
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
                      backgroundColor: selectedCurrency === currency.code ? colors.primary + '20' : colors.card,
                      borderWidth: selectedCurrency === currency.code ? 1 : 0,
                      borderColor: selectedCurrency === currency.code ? colors.primary : 'transparent'
                    }
                  ]}
                  onPress={() => {
                    const previousCurrency = selectedCurrency;
                    setSelectedCurrency(currency.code);
                    setShowCurrencyModal(false);
                    
                    // Analytics: Track currency selection
                    firebaseService.logEvent('currency_selected', {
                      from_currency: previousCurrency,
                      to_currency: currency.code,
                      book_id: currentBook?.id
                    });
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
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
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

      {/* 날짜 선택 모달 */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDatePicker(false)}
        >
          <TouchableOpacity 
            style={[styles.modalContent, { backgroundColor: colors.background }]} 
            activeOpacity={1}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>날짜 선택</Text>
            
            <Calendar
              current={date || new Date().toISOString().split('T')[0]}
              onDayPress={(day: any) => {
                setDate(day.dateString);
                setShowDatePicker(false);
              }}
              markedDates={{
                [date]: { selected: true, selectedColor: colors.primary }
              }}
              maxDate={new Date().toISOString().split('T')[0]}
              theme={{
                backgroundColor: colors.background,
                calendarBackground: colors.background,
                textSectionTitleColor: colors.text,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: 'white',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.icon,
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
              style={[styles.modalCloseButton, { backgroundColor: colors.card }]}
              onPress={() => setShowDatePicker(false)}
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
});