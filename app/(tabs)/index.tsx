import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';

import CommentSection from '@/components/CommentSection';
import { ThemedText } from '@/components/ThemedText';
import { ThemedCard } from '@/components/ThemedCard';
import { ThemedButton } from '@/components/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import syncService from '@/services/syncService';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { useCategoryStore } from '@/stores/categoryStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config/config';
import apiService from '@/services/api';

// 한국어 달력 설정
LocaleConfig.locales['kr'] = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';

export default function HomeScreen() {
  const { user, token, logout } = useAuthStore();
  const { currentBook, ledgers, bookMembers, fetchBooks, fetchLedgers, fetchBookMembers } = useBookStore();
  const { fetchCategoriesByBook, fetchPaymentsByBook } = useCategoryStore();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedLedgerId, setSelectedLedgerId] = useState<number | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [todayRecurringTransactions, setTodayRecurringTransactions] = useState<any[]>([]);
  const [expandCalendar, setExpandCalendar] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarMarkedDates, setCalendarMarkedDates] = useState<any>({});

  // 새로고침 핸들러
  const onRefresh = async () => {
    try {
      // 햅틱 피드백
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      setRefreshing(true);
      
      if (token) {
        // 모든 데이터 다시 불러오기
        await fetchBooks(token);
        
        // 현재 가계부의 카테고리와 결제수단 다시 로드
        if (currentBook) {
          await Promise.all([
            fetchCategoriesByBook(currentBook.id, token),
            fetchPaymentsByBook(currentBook.id, token)
          ]);
        }
        
        // 현재 가계부의 최근 거래 내역 다시 로드
        if (currentBook) {
          await fetchLedgers({
            bookId: currentBook.id,
            page: 0,
            size: 5
          }, token);
        }
        
        // 동기화 수행
        await syncService.forceSync();
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
      Alert.alert('새로고침 실패', '데이터를 새로고침하는 중 오류가 발생했습니다.');
    } finally {
      setRefreshing(false);
    }
  };

  // 스플래시 화면에서 이미 데이터를 로드했으므로, 
  // 여기서는 실시간 업데이트 리스너만 유지
  useEffect(() => {
    // 실시간 동기화는 스플래시에서 이미 연결됨
    // 여기서는 연결 상태만 확인
    if (token && user?.id && currentBook?.id) {
      console.log('실시간 동기화 상태 확인');
    }
    // 목표 데이터 로드
    loadGoals();
    // 오늘의 반복거래 로드
    loadTodayRecurringTransactions();
    // 캘린더 데이터 로드
    loadCalendarData(new Date().toISOString().substring(0, 7));
  }, [token, currentBook, user]);

  // 실시간 동기화 이벤트 리스너
  useEffect(() => {
    const handleLedgerCreated = (ledger: any) => {
      console.log('New ledger created:', ledger);
      // 거래 목록 새로고침
      if (token && currentBook) {
        fetchLedgers({ bookId: currentBook.id, page: 0, size: 5 }, token);
        // 캘린더 데이터도 새로고침
        const currentMonth = new Date().toISOString().substring(0, 7);
        loadCalendarData(currentMonth);
      }
    };

    const handleSyncStatusChanged = (status: any) => {
      console.log('Sync status changed:', status);
      // 동기화 상태 UI 업데이트
    };

    syncService.on('ledger-created', handleLedgerCreated);
    syncService.on('sync-status-changed', handleSyncStatusChanged);

    return () => {
      syncService.off('ledger-created', handleLedgerCreated);
      syncService.off('sync-status-changed', handleSyncStatusChanged);
    };
  }, [token, currentBook]);

  // 화면에 포커스될 때 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      if (token && currentBook) {
        // 최근 거래 내역 새로고침
        fetchLedgers({ bookId: currentBook.id, page: 0, size: 5 }, token);
        // 캘린더 데이터 새로고침
        const currentMonth = new Date().toISOString().substring(0, 7);
        loadCalendarData(currentMonth);
      }
    }, [token, currentBook])
  );

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('로그아웃 실패', '로그아웃 중 오류가 발생했습니다.');
    }
  };

  const openModal = () => {
    router.push('/(modals)/add-transaction');
  };

  const calculateBalance = () => {
    if (!ledgers || ledgers.length === 0) return 0;
    
    return ledgers.reduce((total, ledger) => {
      if (ledger.amountType === 'INCOME') {
        return total + ledger.amount;
      } else {
        return total - ledger.amount;
      }
    }, 0);
  };

  const calculateMonthlyChange = () => {
    if (!ledgers || ledgers.length === 0) return { income: 0, expense: 0 };
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyLedgers = ledgers.filter(ledger => {
      const ledgerDate = new Date(ledger.transactionDate);
      return ledgerDate.getMonth() === currentMonth && 
             ledgerDate.getFullYear() === currentYear;
    });
    
    const income = monthlyLedgers
      .filter(ledger => ledger.amountType === 'INCOME')
      .reduce((sum, ledger) => sum + ledger.amount, 0);
    
    const expense = monthlyLedgers
      .filter(ledger => ledger.amountType === 'EXPENSE')
      .reduce((sum, ledger) => sum + ledger.amount, 0);
    
    return { income, expense };
  };

  // 거래 내역 아이콘 매핑
  const getTransactionIcon = (description: string) => {
    const lowercaseDesc = description.toLowerCase();
    if (lowercaseDesc.includes('식') || lowercaseDesc.includes('음식')) return 'restaurant';
    if (lowercaseDesc.includes('급여') || lowercaseDesc.includes('월급')) return 'card';
    if (lowercaseDesc.includes('주유') || lowercaseDesc.includes('기름')) return 'car';
    if (lowercaseDesc.includes('교통') || lowercaseDesc.includes('지하철')) return 'train';
    if (lowercaseDesc.includes('쇼핑') || lowercaseDesc.includes('구매')) return 'bag';
    return 'wallet';
  };

  // 거래 내역 아이콘 색상 매핑
  const getTransactionColor = (description: string) => {
    const lowercaseDesc = description.toLowerCase();
    if (lowercaseDesc.includes('식') || lowercaseDesc.includes('음식')) return colors.warning;
    if (lowercaseDesc.includes('급여') || lowercaseDesc.includes('월급')) return colors.success;
    if (lowercaseDesc.includes('주유') || lowercaseDesc.includes('기름')) return colors.info;
    if (lowercaseDesc.includes('교통') || lowercaseDesc.includes('지하철')) return colors.error;
    if (lowercaseDesc.includes('쇼핑') || lowercaseDesc.includes('구매')) return colors.transfer;
    return colors.primary;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const getSelectedLedger = () => {
    if (!selectedLedgerId || !ledgers) return null;
    return ledgers.find(ledger => ledger.id === selectedLedgerId);
  };

  const loadGoals = async () => {
    try {
      // 목표 기능은 아직 구현되지 않았으므로 빈 배열 반환
      setGoals([]);
    } catch (error) {
      console.error('Failed to load goals:', error);
    }
  };

  const loadTodayRecurringTransactions = async () => {
    if (!token || !currentBook?.id) return;
    
    try {
      const transactions = await apiService.getRecurringTransactions(currentBook.id, true);
      
      // 오늘 실행될 거래만 필터링
      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = transactions.filter((transaction: any) => {
        return transaction.isActive && transaction.nextExecutionDate === today;
      });
      
      setTodayRecurringTransactions(todayTransactions);
    } catch (error) {
      console.error('Failed to load recurring transactions:', error);
    }
  };

  const balance = calculateBalance();
  const monthlyChange = calculateMonthlyChange();

  // 캘린더 데이터 로드
  const loadCalendarData = async (month: string) => {
    if (!token || !currentBook) return;
    
    try {
      // 해당 월의 모든 거래 내역 가져오기
      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0];
      
      // API를 통해 특정 기간의 거래 내역 가져오기
      const apiClient = (await import('@/core/api/client')).default;
      const response = await apiClient.getLedgerList(
        { 
          bookId: currentBook.id, 
          page: 0, 
          size: 1000 
        },
        token
      );
      
      // 날짜 범위로 필터링
      const filteredLedgers = response.filter((ledger: any) => {
        const ledgerDate = ledger.transactionDate.split('T')[0];
        return ledgerDate >= startDate && ledgerDate <= endDate;
      });
      
      // 날짜별로 거래 내역 그룹화
      const dateGroups: any = {};
      filteredLedgers.forEach((ledger: any) => {
        const date = ledger.transactionDate.split('T')[0];
        if (!dateGroups[date]) {
          dateGroups[date] = { income: 0, expense: 0, total: 0, dots: [] };
        }
        
        if (ledger.amountType === 'INCOME') {
          dateGroups[date].income += ledger.amount;
          dateGroups[date].total += ledger.amount;
        } else {
          dateGroups[date].expense += ledger.amount;
          dateGroups[date].total -= ledger.amount;
        }
      });
      
      // 마크된 날짜 생성
      const marked: any = {};
      Object.keys(dateGroups).forEach(date => {
        const dayData = dateGroups[date];
        const dots = [];
        
        if (dayData.income > 0) {
          dots.push({ key: 'income', color: colors.success });
        }
        if (dayData.expense > 0) {
          dots.push({ key: 'expense', color: colors.error });
        }
        
        marked[date] = {
          marked: true,
          dots,
          customStyles: {
            container: {
              backgroundColor: date === selectedDate ? colors.primary : 'transparent',
            },
            text: {
              color: date === selectedDate ? 'white' : colors.text,
              fontSize: 10,
            }
          },
          income: dayData.income,
          expense: dayData.expense,
          total: dayData.total
        };
      });
      
      // 선택된 날짜 표시
      if (!marked[selectedDate]) {
        marked[selectedDate] = {
          selected: true,
          selectedColor: colors.primary,
        };
      } else {
        marked[selectedDate].selected = true;
        marked[selectedDate].selectedColor = colors.primary;
      }
      
      setCalendarMarkedDates(marked);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 섹션 */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <ThemedText type="subtitle" variant="secondary">
                안녕하세요, {user?.username || '사용자'}님
              </ThemedText>
              <ThemedText type="title">
                {currentBook?.title || '가계부'}
              </ThemedText>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => router.push('/(modals)/book-sharing')}
              >
                <Ionicons name="share-social" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => router.push('/(modals)/profile')}
              >
                <Ionicons name="person" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 캘린더 */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <ThemedText type="subtitle">가계부 달력</ThemedText>
            <TouchableOpacity onPress={() => setExpandCalendar(!expandCalendar)}>
              <Ionicons 
                name={expandCalendar ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          
          {expandCalendar && (
            <Calendar
              key={`calendar-${isDarkMode ? 'dark' : 'light'}`}
              current={selectedDate}
              onDayPress={(day: any) => {
                setSelectedDate(day.dateString);
                // 선택된 날짜의 거래 내역으로 이동
                router.push({
                  pathname: '/(tabs)/explore',
                  params: { date: day.dateString }
                });
              }}
              onMonthChange={(month: any) => {
                loadCalendarData(month.dateString.substring(0, 7));
              }}
              markedDates={calendarMarkedDates}
              theme={{
                backgroundColor: colors.background,
                calendarBackground: colors.card,
                textSectionTitleColor: colors.text,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: 'white',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textTertiary,
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14
              }}
              style={styles.calendar}
              dayComponent={({ date, state, marking }: any) => {
                const isSelected = date.dateString === selectedDate;
                const isToday = state === 'today';
                const dayData = marking;
                
                // 금액 포맷팅 함수
                const formatDayAmount = (amount: number) => {
                  if (amount >= 100000000) {
                    return `${Math.floor(amount/100000000)}억`;
                  } else if (amount >= 10000) {
                    const man = Math.floor(amount/10000);
                    const remainder = Math.floor((amount % 10000) / 1000);
                    return remainder > 0 ? `${man}.${remainder}만` : `${man}만`;
                  } else if (amount >= 1000) {
                    return `${(amount/1000).toFixed(1)}천`;
                  }
                  return amount.toString();
                };
                
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedDate(date.dateString);
                      // 컬린더 데이터 업데이트로 포커스 표시
                      const newMarked = { ...calendarMarkedDates };
                      Object.keys(newMarked).forEach(key => {
                        if (newMarked[key]) {
                          newMarked[key].selected = false;
                        }
                      });
                      if (newMarked[date.dateString]) {
                        newMarked[date.dateString].selected = true;
                      } else {
                        newMarked[date.dateString] = {
                          selected: true,
                          selectedColor: colors.primary,
                        };
                      }
                      setCalendarMarkedDates(newMarked);
                      
                      // 날짜 클릭 시 포커스만 이동, 화면 전환 없음
                    }}
                    style={[
                      styles.dayContainer,
                      isSelected && { backgroundColor: colors.primary },
                      isToday && !isSelected && { borderWidth: 1, borderColor: colors.primary },
                      state === 'disabled' && { opacity: 0.3 }
                    ]}
                  >
                    <Text style={[
                      styles.dayText,
                      { color: isSelected ? 'white' : colors.text },
                      isToday && !isSelected && { color: colors.primary, fontWeight: 'bold' }
                    ]}>
                      {date.day}
                    </Text>
                    
                    {dayData && (dayData.income > 0 || dayData.expense > 0) && (
                      <View style={styles.dayDataContainer}>
                        {dayData.income > 0 && (
                          <Text style={[styles.dayDataText, { color: colors.success }]}>
                            +{formatDayAmount(dayData.income)}
                          </Text>
                        )}
                        {dayData.expense > 0 && (
                          <Text style={[styles.dayDataText, { color: colors.error }]}>
                            -{formatDayAmount(dayData.expense)}
                          </Text>
                        )}
                        <Text style={[
                          styles.dayTotalText, 
                          { color: dayData.total >= 0 ? colors.text : colors.error }
                        ]}>
                          {dayData.total >= 0 ? '+' : ''}{formatDayAmount(Math.abs(dayData.total))}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        {/* 잔액 카드 */}
        <ThemedCard variant="elevated" style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <ThemedText type="subtitle" variant="secondary">
              현재 잔액
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ThemedText type="title" style={styles.balanceAmount}>
            ₩{formatAmount(balance)}
          </ThemedText>
          
          <View style={styles.monthlyStats}>
            <View style={styles.statItem}>
              <ThemedText type="caption" variant="success">
                +₩{formatAmount(monthlyChange.income)}
              </ThemedText>
              <ThemedText type="caption" variant="tertiary">
                이번 달 수입
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="caption" variant="error">
                -₩{formatAmount(monthlyChange.expense)}
              </ThemedText>
              <ThemedText type="caption" variant="tertiary">
                이번 달 지출
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        {/* 빠른 액션 버튼들 */}
        <View style={styles.quickActions}>
          <ThemedButton
            variant="primary"
            size="large"
            style={styles.addButton}
            onPress={openModal}
          >
            <Ionicons name="add" size={20} color={colors.textInverse} style={{ marginRight: 8 }} />
            거래 추가
          </ThemedButton>
          
          <View style={styles.secondaryActions}>
            <ThemedButton
              variant="outline"
              size="medium"
              style={styles.secondaryButton}
              onPress={() => router.push('/(modals)/budget-settings')}
            >
              <Ionicons name="pie-chart" size={16} color={colors.primary} style={{ marginRight: 4 }} />
              예산
            </ThemedButton>
            
            <ThemedButton
              variant="outline"
              size="medium"
              style={styles.secondaryButton}
              onPress={() => router.push('/(modals)/goals')}
            >
              <Ionicons name="flag" size={16} color={colors.primary} style={{ marginRight: 4 }} />
              목표
            </ThemedButton>
          </View>
        </View>

        {/* 최근 거래 내역 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">최근 거래</ThemedText>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <ThemedText type="caption" variant="primary">
                모두 보기
              </ThemedText>
            </TouchableOpacity>
          </View>
          
          {ledgers && ledgers.length > 0 ? (
            ledgers.slice(0, 5).map((ledger) => (
              <ThemedCard
                key={ledger.id}
                variant="default"
                style={styles.transactionCard}
                onPress={() => {
                  setSelectedLedgerId(ledger.id);
                }}
              >
                <View style={styles.transactionContent}>
                  <View style={[styles.iconContainer, { backgroundColor: getTransactionColor(ledger.description) + '20' }]}>
                    <Ionicons 
                      name={getTransactionIcon(ledger.description) as any} 
                      size={20} 
                      color={getTransactionColor(ledger.description)} 
                    />
                  </View>
                  
                  <View style={styles.transactionInfo}>
                    <ThemedText type="body" weight="medium">
                      {ledger.description}
                    </ThemedText>
                    <ThemedText type="caption" variant="tertiary">
                      {formatDate(ledger.transactionDate)}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.transactionAmount}>
                    <ThemedText 
                      type="body" 
                      weight="semibold"
                      variant={ledger.amountType === 'INCOME' ? 'success' : 'error'}
                    >
                      {ledger.amountType === 'INCOME' ? '+' : '-'}₩{formatAmount(ledger.amount)}
                    </ThemedText>
                  </View>
                </View>
              </ThemedCard>
            ))
          ) : (
            <ThemedCard variant="outlined" style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
              <ThemedText type="body" variant="tertiary" style={{ marginTop: 12 }}>
                거래 내역이 없습니다
              </ThemedText>
            </ThemedCard>
          )}
        </View>

        {/* 목표 섹션 */}
        {goals && goals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">목표</ThemedText>
              <TouchableOpacity onPress={() => router.push('/(modals)/goals')}>
                <ThemedText type="caption" variant="primary">
                  모두 보기
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            {goals.slice(0, 3).map((goal) => (
              <ThemedCard
                key={goal.goalId}
                variant="default"
                style={styles.goalCard}
                onPress={() => router.push(`/goal/${goal.goalId}`)}
              >
                <View style={styles.goalContent}>
                  <View style={styles.goalInfo}>
                    <ThemedText type="body" weight="medium">
                      {goal.title}
                    </ThemedText>
                    <ThemedText type="caption" variant="secondary">
                      ₩{formatAmount(goal.currentAmount)} / ₩{formatAmount(goal.targetAmount)}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            backgroundColor: colors.success,
                            width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%`
                          }
                        ]} 
                      />
                    </View>
                    <ThemedText type="caption" variant="success">
                      {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                    </ThemedText>
                  </View>
                </View>
              </ThemedCard>
            ))}
          </View>
        )}

        {/* 오늘의 반복 거래 */}
        {todayRecurringTransactions && todayRecurringTransactions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">오늘의 반복 거래</ThemedText>
              <TouchableOpacity onPress={() => router.push('/(modals)/recurring-transactions')}>
                <ThemedText type="caption" variant="primary">
                  모두 보기
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            {todayRecurringTransactions.map((transaction) => (
              <ThemedCard
                key={transaction.id}
                variant="default"
                style={styles.recurringCard}
              >
                <View style={styles.transactionContent}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.infoLight }]}>
                    <Ionicons name="repeat" size={20} color={colors.info} />
                  </View>
                  
                  <View style={styles.transactionInfo}>
                    <ThemedText type="body" weight="medium">
                      {transaction.name}
                    </ThemedText>
                    <ThemedText type="caption" variant="tertiary">
                      반복 거래
                    </ThemedText>
                  </View>
                  
                  <View style={styles.transactionAmount}>
                    <ThemedText 
                      type="body" 
                      weight="semibold"
                      variant={transaction.type === 'INCOME' ? 'success' : 'error'}
                    >
                      {transaction.type === 'INCOME' ? '+' : '-'}₩{formatAmount(transaction.amount)}
                    </ThemedText>
                  </View>
                </View>
              </ThemedCard>
            ))}
          </View>
        )}

        {/* 댓글 섹션은 모달에서 처리 */}
      </ScrollView>

      {/* 거래 댓글 모달 */}
      <Modal
        visible={!!selectedLedgerId}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedLedgerId(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.modalHeaderLeft}>
              <ThemedText type="subtitle">거래 상세</ThemedText>
              {getSelectedLedger() && (
                <ThemedText type="caption" variant="secondary">
                  {getSelectedLedger()?.description}
                </ThemedText>
              )}
            </View>
            <TouchableOpacity onPress={() => setSelectedLedgerId(null)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {getSelectedLedger() && (
            <ScrollView style={styles.modalContent}>
              <ThemedCard variant="elevated" style={styles.ledgerDetailCard}>
                <View style={styles.ledgerDetailRow}>
                  <ThemedText type="body" variant="secondary">날짜</ThemedText>
                  <ThemedText type="body">
                    {formatDate(getSelectedLedger()!.transactionDate)}
                  </ThemedText>
                </View>
                <View style={styles.ledgerDetailRow}>
                  <ThemedText type="body" variant="secondary">금액</ThemedText>
                  <ThemedText 
                    type="body" 
                    weight="semibold"
                    variant={getSelectedLedger()!.amountType === 'INCOME' ? 'success' : 'error'}
                  >
                    {getSelectedLedger()!.amountType === 'INCOME' ? '+' : '-'}₩{formatAmount(getSelectedLedger()!.amount)}
                  </ThemedText>
                </View>
                {getSelectedLedger()!.memo && (
                  <View style={[styles.ledgerDetailMemo, { borderTopColor: colors.border }]}>
                    <ThemedText type="body" variant="secondary">메모</ThemedText>
                    <ThemedText type="body" style={styles.memoText}>
                      {getSelectedLedger()!.memo}
                    </ThemedText>
                  </View>
                )}
              </ThemedCard>
              
              <View style={styles.commentSectionContainer}>
                <ThemedText type="subtitle" style={styles.commentSectionTitle}>
                  댓글
                </ThemedText>
                <CommentSection 
                  type="ledger" 
                  targetId={selectedLedgerId} 
                />
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendar: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingBottom: 10,
  },
  dayContainer: {
    width: 48,
    height: 85,
    padding: 4,
    margin: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dayText: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  dayDataContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  dayDataText: {
    fontSize: 10,
    fontWeight: '600',
    marginVertical: 1,
  },
  dayTotalText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  monthlyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  addButton: {
    marginBottom: 16,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionCard: {
    marginBottom: 12,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  goalCard: {
    marginBottom: 12,
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalInfo: {
    flex: 1,
  },
  progressContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  progressBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  recurringCard: {
    marginBottom: 12,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  ledgerDetailCard: {
    margin: 16,
    padding: 16,
  },
  ledgerDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ledgerDetailMemo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  memoText: {
    marginTop: 8,
    lineHeight: 20,
  },
  commentSectionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  commentSectionTitle: {
    marginBottom: 16,
  },
});