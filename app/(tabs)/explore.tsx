import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, RefreshControl, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedCard } from '@/components/ThemedCard';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import SearchFilter, { SearchFilters } from '@/components/SearchFilter';
import { useTheme } from '@/contexts/ThemeContext';
import { Ledger } from '@/core/api/client';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useBudgetStore } from '@/stores/budgetStore';
import PieChart from '@/features/analytics/components/Charts/PieChart';
import BarChart from '@/features/analytics/components/Charts/BarChart';
import LineChart from '@/features/analytics/components/Charts/LineChart';
import DonutChart from '@/features/analytics/components/Charts/DonutChart';
import HeatMapChart from '@/features/analytics/components/Charts/HeatMapChart';
import StackedAreaChart from '@/features/analytics/components/Charts/StackedAreaChart';
import CommentSection from '@/components/CommentSection';
import MemoSection from '@/components/MemoSection';

const tabs = ['통계', '예산', '내역'];
const types = ['수입', '지출'];

// 카테고리 아이콘 매핑
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('식') || name.includes('음식')) return 'restaurant';
  if (name.includes('교통')) return 'car';
  if (name.includes('주거') || name.includes('집')) return 'home';
  if (name.includes('쇼핑')) return 'bag';
  if (name.includes('의료')) return 'medical';
  if (name.includes('교육')) return 'school';
  return 'wallet';
};

// 카테고리 색상 매핑
const getCategoryColor = (categoryName: string, colors: any) => {
  const name = categoryName.toLowerCase();
  if (name.includes('식') || name.includes('음식')) return colors.warning;
  if (name.includes('교통')) return colors.info;
  if (name.includes('주거') || name.includes('집')) return colors.success;
  if (name.includes('쇼핑')) return colors.transfer;
  if (name.includes('의료')) return colors.error;
  if (name.includes('교육')) return colors.primary;
  return colors.textSecondary;
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
const getTransactionColor = (description: string, colors: any) => {
  const lowercaseDesc = description.toLowerCase();
  if (lowercaseDesc.includes('식') || lowercaseDesc.includes('음식')) return colors.warning;
  if (lowercaseDesc.includes('급여') || lowercaseDesc.includes('월급')) return colors.success;
  if (lowercaseDesc.includes('주유') || lowercaseDesc.includes('기름')) return colors.info;
  if (lowercaseDesc.includes('교통') || lowercaseDesc.includes('지하철')) return colors.error;
  if (lowercaseDesc.includes('쇼핑') || lowercaseDesc.includes('구매')) return colors.transfer;
  return colors.primary;
};

export default function ExploreScreen() {
  const { token } = useAuthStore();
  const { currentBook, ledgers, fetchLedgers, deleteLedger } = useBookStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { budgetSummary, getBudgetSummary } = useBudgetStore();
  const { colors, isDarkMode } = useTheme();
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedType, setSelectedType] = useState(1); // 기본값: 지출
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [historyLedgers, setHistoryLedgers] = useState<Ledger[]>([]);
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'line' | 'donut' | 'area'>('pie'); // 차트 타입 선택
  const [chartTimeRange, setChartTimeRange] = useState<'month' | 'week' | 'day'>('month'); // 시간 범위 선택
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedLedgerId, setSelectedLedgerId] = useState<number | null>(null);
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  
  const month = currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

  // 내역 탭일 때 전체 거래 내역 로드
  useEffect(() => {
    if (selectedTab === 2 && token && currentBook) {
      fetchLedgers({ bookId: currentBook.id, page: 0, size: 100 }, token).then(() => {
        setHistoryLedgers(ledgers);
      });
    }
  }, [selectedTab, token, currentBook]);

  // 통계 탭일 때 데이터 확인
  useEffect(() => {
    if (selectedTab === 0 && token && currentBook) {
      console.log('Statistics tab - ledgers:', ledgers);
      console.log('Statistics tab - categories:', categories);
      console.log('Statistics tab - filtered ledgers:', getFilteredLedgers());
    }
  }, [selectedTab, ledgers, categories, currentDate]);

  // 예산 탭일 때 예산 데이터 로드
  useEffect(() => {
    if (selectedTab === 1 && token && currentBook) {
      const currentMonth = currentDate.toISOString().slice(0, 7);
      console.log('Loading budget for:', currentMonth, 'bookId:', currentBook.id);
      getBudgetSummary(currentBook.id, currentMonth, token).then((result) => {
        console.log('Budget summary result:', result);
        console.log('Budget summary data:', budgetSummary);
      });
    }
  }, [selectedTab, currentDate, token, currentBook]);

  // 카테고리 및 결제 수단 데이터 로드
  useEffect(() => {
    if (token && currentBook) {
      // 거래 내역 로드 (모든 탭에서 필요)
      fetchLedgers({ bookId: currentBook.id, page: 0, size: 100 }, token);
      
      // 카테고리 로드
      fetchCategories(currentBook.id, token);
      
      // 결제 수단 데이터 가져오기 (API 클라이언트에서 직접 호출)
      const fetchPaymentMethods = async () => {
        try {
          const apiService = (await import('@/core/api/client')).default;
          const payments = await apiService.getPaymentListByBook(currentBook.id, token);
          setPaymentMethods(payments);
        } catch (error) {
          console.error('결제 수단 조회 실패:', error);
          setPaymentMethods([]);
        }
      };
      fetchPaymentMethods();
    }
  }, [token, currentBook]);

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const onRefresh = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRefreshing(true);
      
      if (token && currentBook) {
        await Promise.all([
          fetchLedgers({ bookId: currentBook.id, page: 0, size: 100 }, token),
          fetchCategories(currentBook.id, token)
        ]);
        
        if (selectedTab === 1) {
          const currentMonth = currentDate.toISOString().slice(0, 7);
          await getBudgetSummary(currentBook.id, currentMonth, token);
        }
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
      Alert.alert('새로고침 실패', '데이터를 새로고침하는 중 오류가 발생했습니다.');
    } finally {
      setRefreshing(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
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

  const getFilteredLedgers = () => {
    if (!ledgers || ledgers.length === 0) {
      console.log('No ledgers available');
      return [];
    }
    
    console.log('Total ledgers:', ledgers.length);
    console.log('Current date:', currentDate);
    console.log('Selected tab:', selectedTab);
    console.log('Selected type:', selectedType);
    
    const filtered = ledgers.filter(ledger => {
      const ledgerDate = new Date(ledger.transactionDate);
      const isSameMonth = ledgerDate.getMonth() === currentDate.getMonth() && 
                         ledgerDate.getFullYear() === currentDate.getFullYear();
      
      if (selectedTab === 0) { // 통계 탭
        const matches = isSameMonth && ledger.amountType === (selectedType === 0 ? 'INCOME' : 'EXPENSE');
        if (matches) {
          console.log('Matching ledger for statistics:', ledger);
        }
        return matches;
      } else if (selectedTab === 2) { // 내역 탭
        // 기본 텍스트 검색
        if (searchQuery && !Object.keys(searchFilters).length) {
          return ledger.description.toLowerCase().includes(searchQuery.toLowerCase());
        }
        
        // 고급 필터 검색
        if (Object.keys(searchFilters).length > 0) {
          // 기간 필터
          if (searchFilters.startDate || searchFilters.endDate) {
            const ledgerDateStr = ledger.transactionDate.split('T')[0]; // YYYY-MM-DD 형식으로 변환
            if (searchFilters.startDate && ledgerDateStr < searchFilters.startDate) return false;
            if (searchFilters.endDate && ledgerDateStr > searchFilters.endDate) return false;
          }
          
          // 거래 유형 필터
          if (searchFilters.amountType && ledger.amountType !== searchFilters.amountType) return false;
          
          // 카테고리 필터 (카테고리 이름으로 비교)
          if (searchFilters.category) {
            const ledgerCategory = categories.find(cat => cat.id === ledger.categoryId);
            if (!ledgerCategory || ledgerCategory.category !== searchFilters.category) return false;
          }
          
          // 결제 수단 필터 (결제 수단 이름으로 비교)
          if (searchFilters.payment) {
            const ledgerPayment = paymentMethods.find(pay => pay.id === ledger.paymentId);
            if (!ledgerPayment || ledgerPayment.payment !== searchFilters.payment) return false;
          }
          
          // 설명 검색
          if (searchFilters.description && 
              !ledger.description.toLowerCase().includes(searchFilters.description.toLowerCase())) {
            return false;
          }
          
          return true;
        }
        
        return true;
      }
      return isSameMonth;
    });
    
    console.log('Filtered ledgers count:', filtered.length);
    return filtered.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchFilters({});
    setIsSearchVisible(false);
  };

  const handleSearchToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery('');
      setSearchFilters({});
    }
  };

  const handleFilterApply = (filters: SearchFilters) => {
    setSearchFilters(filters);
    setSearchQuery(''); // 고급 필터 사용 시 기본 검색 비우기
  };

  const handleShowAdvancedSearch = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSearchFilter(true);
  };

  const handleDeleteLedger = async (ledger: Ledger) => {
    Alert.alert(
      '거래 삭제',
      '이 거래를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              if (token && currentBook) {
                await deleteLedger(ledger.id, token);
                await fetchLedgers({ bookId: currentBook.id, page: 0, size: 100 }, token);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              console.error('Failed to delete ledger:', error);
              Alert.alert('삭제 실패', '거래를 삭제하는 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const getSelectedLedger = () => {
    if (!selectedLedgerId || !ledgers) return null;
    return ledgers.find(ledger => ledger.id === selectedLedgerId);
  };

  const HighlightedText = ({ text, query, style }: { text: string; query: string; style: any }) => {
    if (!query.trim()) {
      return <ThemedText style={style}>{text}</ThemedText>;
    }

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return (
      <ThemedText style={style}>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <ThemedText key={index} style={[style, { backgroundColor: colors.primary + '30' }]}>
              {part}
            </ThemedText>
          ) : (
            part
          )
        )}
      </ThemedText>
    );
  };

  const renderLedgerItem = ({ item }: { item: Ledger }) => (
    <ThemedCard
      variant="default"
      style={styles.ledgerItem}
      onPress={() => {
        setSelectedLedgerId(item.id);
      }}
    >
      <View style={styles.ledgerContent}>
        <View style={[styles.iconContainer, { backgroundColor: getTransactionColor(item.description, colors) + '20' }]}>
          <Ionicons 
            name={getTransactionIcon(item.description) as any} 
            size={20} 
            color={getTransactionColor(item.description, colors)} 
          />
        </View>
        
        <View style={styles.ledgerInfo}>
          <HighlightedText
            text={item.description}
            query={searchQuery}
            style={[styles.ledgerDescription, { color: colors.text }]}
          />
          <ThemedText type="caption" variant="tertiary">
            {formatDate(item.transactionDate)}
          </ThemedText>
        </View>
        
        <View style={styles.ledgerActions}>
          <ThemedText 
            type="body" 
            weight="semibold"
            variant={item.amountType === 'INCOME' ? 'success' : 'error'}
          >
            {item.amountType === 'INCOME' ? '+' : '-'}₩{formatAmount(item.amount)}
          </ThemedText>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteLedger(item)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </ThemedCard>
  );

  const renderTabButton = (index: number, title: string) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.tabButton,
        {
          backgroundColor: selectedTab === index ? colors.primary : colors.backgroundSecondary,
          borderColor: selectedTab === index ? colors.primary : colors.border,
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedTab(index);
      }}
    >
      <ThemedText
        type="body"
        weight="medium"
        variant={selectedTab === index ? 'inverse' : 'secondary'}
      >
        {title}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderTypeButton = (index: number, title: string) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.typeButton,
        {
          backgroundColor: selectedType === index ? colors.primary : colors.backgroundSecondary,
          borderColor: selectedType === index ? colors.primary : colors.border,
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedType(index);
      }}
    >
      <ThemedText
        type="body"
        weight="medium"
        variant={selectedType === index ? 'inverse' : 'secondary'}
      >
        {title}
      </ThemedText>
    </TouchableOpacity>
  );

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
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ThemedText type="title">통계 & 분석</ThemedText>
            <ThemedText type="body" variant="secondary">
              {currentBook?.title || '가계부'}
            </ThemedText>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setShowComments(true)}
            >
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 탭 버튼들 */}
        <View style={styles.tabContainer}>
          {tabs.map((tab, index) => renderTabButton(index, tab))}
        </View>

        {/* 통계 탭 */}
        {selectedTab === 0 && (
          <View style={styles.tabContent}>
            {/* 월 선택 */}
            <View style={styles.monthSelector}>
              <TouchableOpacity
                style={[styles.monthButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => changeMonth('prev')}
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </TouchableOpacity>
              
              <ThemedText type="subtitle" style={styles.monthText}>
                {month}
              </ThemedText>
              
              <TouchableOpacity
                style={[styles.monthButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => changeMonth('next')}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* 수입/지출 선택 */}
            <View style={styles.typeContainer}>
              {types.map((type, index) => renderTypeButton(index, type))}
            </View>

            {/* 차트 타입 선택 */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.chartTypeContainer}
              contentContainerStyle={styles.chartTypeContent}
            >
              <TouchableOpacity
                style={[
                  styles.chartTypeButton,
                  {
                    backgroundColor: chartType === 'pie' ? colors.primary : colors.backgroundSecondary,
                    borderColor: chartType === 'pie' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setChartType('pie')}
              >
                <Ionicons 
                  name="pie-chart" 
                  size={20} 
                  color={chartType === 'pie' ? colors.textInverse : colors.text} 
                />
                <ThemedText
                  type="caption"
                  variant={chartType === 'pie' ? 'inverse' : 'secondary'}
                  style={{ marginLeft: 4 }}
                >
                  파이
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.chartTypeButton,
                  {
                    backgroundColor: chartType === 'bar' ? colors.primary : colors.backgroundSecondary,
                    borderColor: chartType === 'bar' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setChartType('bar')}
              >
                <Ionicons 
                  name="bar-chart" 
                  size={20} 
                  color={chartType === 'bar' ? colors.textInverse : colors.text} 
                />
                <ThemedText
                  type="caption"
                  variant={chartType === 'bar' ? 'inverse' : 'secondary'}
                  style={{ marginLeft: 4 }}
                >
                  막대
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.chartTypeButton,
                  {
                    backgroundColor: chartType === 'donut' ? colors.primary : colors.backgroundSecondary,
                    borderColor: chartType === 'donut' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setChartType('donut')}
              >
                <Ionicons 
                  name="pie-chart" 
                  size={20} 
                  color={chartType === 'donut' ? colors.textInverse : colors.text} 
                />
                <ThemedText
                  type="caption"
                  variant={chartType === 'donut' ? 'inverse' : 'secondary'}
                  style={{ marginLeft: 4 }}
                >
                  도넛
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.chartTypeButton,
                  {
                    backgroundColor: chartType === 'line' ? colors.primary : colors.backgroundSecondary,
                    borderColor: chartType === 'line' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setChartType('line')}
              >
                <Ionicons 
                  name="trending-up" 
                  size={20} 
                  color={chartType === 'line' ? colors.textInverse : colors.text} 
                />
                <ThemedText
                  type="caption"
                  variant={chartType === 'line' ? 'inverse' : 'secondary'}
                  style={{ marginLeft: 4 }}
                >
                  라인
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.chartTypeButton,
                  {
                    backgroundColor: chartType === 'area' ? colors.primary : colors.backgroundSecondary,
                    borderColor: chartType === 'area' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setChartType('area')}
              >
                <Ionicons 
                  name="analytics" 
                  size={20} 
                  color={chartType === 'area' ? colors.textInverse : colors.text} 
                />
                <ThemedText
                  type="caption"
                  variant={chartType === 'area' ? 'inverse' : 'secondary'}
                  style={{ marginLeft: 4 }}
                >
                  영역
                </ThemedText>
              </TouchableOpacity>
            </ScrollView>

            {/* 차트 */}
            <ThemedCard variant="elevated" style={styles.chartCard}>
              {(() => {
                const filteredLedgers = getFilteredLedgers();
                console.log('Chart - filtered ledgers:', filteredLedgers);
                console.log('Chart - categories:', categories);
                
                // 카테고리별로 집계
                const categoryMap = new Map<number, { name: string; total: number }>();
                
                filteredLedgers.forEach(ledger => {
                  const category = categories.find(cat => cat.id === ledger.categoryId);
                  if (category) {
                    const current = categoryMap.get(category.id) || { name: category.category, total: 0 };
                    current.total += ledger.amount;
                    categoryMap.set(category.id, current);
                  }
                });
                
                const chartData = Array.from(categoryMap.values())
                  .filter(item => item.total > 0)
                  .map(item => ({
                    label: item.name,
                    value: item.total,
                    color: getCategoryColor(item.name, colors)
                  }));
                
                console.log('Category map:', categoryMap);
                console.log('Chart data processed:', chartData);

                if (chartType === 'pie') {
                  return <PieChart data={chartData} />;
                } else if (chartType === 'bar') {
                  return <BarChart data={chartData} height={250} />;
                } else if (chartType === 'donut') {
                  const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0);
                  return (
                    <DonutChart 
                      data={chartData} 
                      size={240}
                      centerText={`₩${formatAmount(totalAmount)}`}
                    />
                  );
                } else if (chartType === 'line') {
                  // 라인 차트용 데이터 준비 (최근 7일간 추이)
                  const lineData = [];
                  for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dayLedgers = filteredLedgers.filter(ledger => {
                      const ledgerDate = new Date(ledger.transactionDate);
                      return ledgerDate.toDateString() === date.toDateString();
                    });
                    const dayTotal = dayLedgers.reduce((sum, ledger) => sum + ledger.amount, 0);
                    lineData.push({
                      label: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
                      value: dayTotal
                    });
                  }
                  return <LineChart data={lineData} height={250} curved gradient showDots />;
                } else if (chartType === 'area') {
                  // 영역 차트용 데이터 준비 (최근 7일간 카테고리별)
                  const areaData = [];
                  for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    
                    const dayLedgers = filteredLedgers.filter(ledger => {
                      const ledgerDate = new Date(ledger.transactionDate);
                      return ledgerDate.toDateString() === date.toDateString();
                    });
                    
                    // 카테고리별로 집계
                    const categoriesData = [];
                    const categoryMap = new Map<string, number>();
                    
                    dayLedgers.forEach(ledger => {
                      const category = categories.find(cat => cat.id === ledger.categoryId);
                      if (category) {
                        const current = categoryMap.get(category.category) || 0;
                        categoryMap.set(category.category, current + ledger.amount);
                      }
                    });
                    
                    categoryMap.forEach((value, name) => {
                      categoriesData.push({
                        name,
                        value,
                        color: getCategoryColor(name, colors)
                      });
                    });
                    
                    areaData.push({
                      date: date.toISOString(),
                      categories: categoriesData
                    });
                  }
                  
                  return <StackedAreaChart data={areaData} height={250} />;
                }
              })()}
            </ThemedCard>

            {/* 월간 히트맵 - 지출 타입일 때만 표시 */}
            {selectedType === 1 && (
              <ThemedCard variant="elevated" style={styles.heatMapCard}>
                <ThemedText type="subtitle" style={styles.heatMapTitle}>
                  일일 지출 패턴
                </ThemedText>
                <HeatMapChart
                  data={(() => {
                    const heatMapData = [];
                    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                    
                    for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
                      const dayLedgers = ledgers.filter(ledger => {
                        const ledgerDate = new Date(ledger.transactionDate);
                        return ledgerDate.toDateString() === date.toDateString() && 
                               ledger.amountType === 'EXPENSE';
                      });
                      
                      const dayTotal = dayLedgers.reduce((sum, ledger) => sum + ledger.amount, 0);
                      if (dayTotal > 0) {
                        heatMapData.push({
                          date: date.toISOString().split('T')[0],
                          value: dayTotal
                        });
                      }
                    }
                    
                    return heatMapData;
                  })()}
                  year={currentDate.getFullYear()}
                  month={currentDate.getMonth()}
                />
              </ThemedCard>
            )}

            {/* 카테고리별 상세 */}
            <View style={styles.categoryDetails}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                카테고리별 상세
              </ThemedText>
              
              {(() => {
                const filteredLedgers = getFilteredLedgers();
                const categoryStats = new Map<number, { category: any; ledgers: any[]; total: number }>();
                
                // 거래 내역을 카테고리별로 그룹화
                filteredLedgers.forEach(ledger => {
                  const category = categories.find(cat => cat.id === ledger.categoryId);
                  if (category) {
                    if (!categoryStats.has(category.id)) {
                      categoryStats.set(category.id, { category, ledgers: [], total: 0 });
                    }
                    const stat = categoryStats.get(category.id)!;
                    stat.ledgers.push(ledger);
                    stat.total += ledger.amount;
                  }
                });
                
                return Array.from(categoryStats.values())
                  .filter(stat => stat.total > 0)
                  .sort((a, b) => b.total - a.total)
                  .map(({ category, ledgers, total }) => (
                    <ThemedCard key={category.id} variant="default" style={styles.categoryItem}>
                      <View style={styles.categoryContent}>
                        <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(category.category, colors) + '20' }]}>
                          <Ionicons 
                            name={getCategoryIcon(category.category) as any} 
                            size={20} 
                            color={getCategoryColor(category.category, colors)} 
                          />
                        </View>
                        
                        <View style={styles.categoryInfo}>
                          <ThemedText type="body" weight="medium">
                            {category.category}
                          </ThemedText>
                          <ThemedText type="caption" variant="tertiary">
                            {ledgers.length}건
                          </ThemedText>
                        </View>
                        
                        <ThemedText 
                          type="body" 
                          weight="semibold"
                          variant={selectedType === 0 ? 'success' : 'error'}
                        >
                          {selectedType === 0 ? '+' : '-'}₩{formatAmount(total)}
                        </ThemedText>
                      </View>
                    </ThemedCard>
                  ));
              })()}
            </View>
          </View>
        )}

        {/* 예산 탭 */}
        {selectedTab === 1 && (
          <View style={styles.tabContent}>
            {/* 월 선택 */}
            <View style={styles.monthSelector}>
              <TouchableOpacity
                style={[styles.monthButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => changeMonth('prev')}
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </TouchableOpacity>
              
              <ThemedText type="subtitle" style={styles.monthText}>
                {month}
              </ThemedText>
              
              <TouchableOpacity
                style={[styles.monthButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => changeMonth('next')}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ThemedCard variant="elevated" style={styles.budgetCard}>
              <ThemedText type="subtitle" style={styles.budgetTitle}>
                이번 달 예산 현황
              </ThemedText>
              
              {budgetSummary ? (
                <View style={styles.budgetSummary}>
                  <View style={styles.budgetItem}>
                    <ThemedText type="body" variant="secondary">
                      지출 예산
                    </ThemedText>
                    <ThemedText type="subtitle" weight="semibold">
                      ₩{formatAmount(budgetSummary.expenseBudget || 0)}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.budgetItem}>
                    <ThemedText type="body" variant="secondary">
                      실제 지출
                    </ThemedText>
                    <ThemedText type="subtitle" weight="semibold" variant="error">
                      ₩{formatAmount(budgetSummary.actualExpense || 0)}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.budgetItem}>
                    <ThemedText type="body" variant="secondary">
                      남은 예산
                    </ThemedText>
                    <ThemedText 
                      type="subtitle" 
                      weight="semibold"
                      variant={(budgetSummary.expenseBudget || 0) - (budgetSummary.actualExpense || 0) >= 0 ? 'success' : 'error'}
                    >
                      ₩{formatAmount((budgetSummary.expenseBudget || 0) - (budgetSummary.actualExpense || 0))}
                    </ThemedText>
                  </View>

                  <View style={[styles.budgetItem, { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <ThemedText type="body" variant="secondary">
                      수입 예산
                    </ThemedText>
                    <ThemedText type="subtitle" weight="semibold">
                      ₩{formatAmount(budgetSummary.incomeBudget || 0)}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.budgetItem}>
                    <ThemedText type="body" variant="secondary">
                      실제 수입
                    </ThemedText>
                    <ThemedText type="subtitle" weight="semibold" variant="success">
                      ₩{formatAmount(budgetSummary.actualIncome || 0)}
                    </ThemedText>
                  </View>

                  <View style={styles.budgetItem}>
                    <ThemedText type="body" variant="secondary">
                      지출 달성률
                    </ThemedText>
                    <ThemedText type="subtitle" weight="semibold" variant={(budgetSummary.expenseAchievementRate || 0) <= 100 ? 'success' : 'error'}>
                      {(budgetSummary.expenseAchievementRate || 0).toFixed(1)}%
                    </ThemedText>
                  </View>
                </View>
              ) : (
                <ThemedText type="body" variant="tertiary" style={styles.noBudgetText}>
                  예산 데이터가 없습니다.
                </ThemedText>
              )}
            </ThemedCard>
          </View>
        )}

        {/* 내역 탭 */}
        {selectedTab === 2 && (
          <View style={styles.tabContent}>
            {/* 검색 */}
            <View style={styles.searchContainer}>
              {isSearchVisible ? (
                <View style={styles.searchInputContainer}>
                  <ThemedInput
                    placeholder="거래 내역 검색..."
                    placeholderTextColor={colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    leftIcon="search"
                    rightIcon="close"
                    onRightIconPress={handleClearSearch}
                  />
                  <TouchableOpacity
                    style={[styles.advancedSearchButton, { 
                      backgroundColor: Object.keys(searchFilters).length > 0 ? colors.primary : colors.backgroundSecondary,
                      borderColor: Object.keys(searchFilters).length > 0 ? colors.primary : colors.border
                    }]}
                    onPress={handleShowAdvancedSearch}
                  >
                    <Ionicons 
                      name="options" 
                      size={16} 
                      color={Object.keys(searchFilters).length > 0 ? colors.textInverse : colors.textSecondary} 
                    />
                    {Object.keys(searchFilters).length > 0 && (
                      <View style={[styles.filterBadge, { backgroundColor: colors.textInverse }]}>
                        <ThemedText type="caption" variant="primary" weight="medium">
                          {Object.keys(searchFilters).length}
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.searchButtonContainer}>
                  <TouchableOpacity
                    style={[styles.searchButton, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={handleSearchToggle}
                  >
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <ThemedText type="body" variant="secondary" style={{ marginLeft: 8 }}>
                      거래 내역 검색
                    </ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.filterOnlyButton, { 
                      backgroundColor: Object.keys(searchFilters).length > 0 ? colors.primary : colors.backgroundSecondary,
                      borderColor: Object.keys(searchFilters).length > 0 ? colors.primary : colors.border
                    }]}
                    onPress={handleShowAdvancedSearch}
                  >
                    <Ionicons 
                      name="options" 
                      size={20} 
                      color={Object.keys(searchFilters).length > 0 ? colors.textInverse : colors.textSecondary} 
                    />
                    {Object.keys(searchFilters).length > 0 && (
                      <View style={[styles.filterBadgeSmall, { backgroundColor: colors.textInverse }]}>
                        <ThemedText type="caption" variant="primary" weight="medium">
                          {Object.keys(searchFilters).length}
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 거래 내역 목록 */}
            {getFilteredLedgers().length === 0 ? (
              <ThemedCard variant="outlined" style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
                <ThemedText type="body" variant="tertiary" style={{ marginTop: 12 }}>
                  {searchQuery || Object.keys(searchFilters).length > 0 ? '검색 결과가 없습니다' : '거래 내역이 없습니다'}
                </ThemedText>
              </ThemedCard>
            ) : (
              getFilteredLedgers().map((item) => renderLedgerItem({ item }))
            )}
          </View>
        )}

      </ScrollView>
      
      {/* 검색 필터 모달 */}
      <SearchFilter
        visible={showSearchFilter}
        onClose={() => setShowSearchFilter(false)}
        onApply={handleFilterApply}
        categories={categories}
        paymentMethods={paymentMethods}
        currentFilters={searchFilters}
      />
      
      {/* 메모 모달 */}
      <Modal
        visible={showComments && !selectedLedgerId}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComments(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <ThemedText type="subtitle">가계부 메모</ThemedText>
            <TouchableOpacity onPress={() => setShowComments(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          {currentBook && (
            <MemoSection bookId={currentBook.id} />
          )}
        </View>
      </Modal>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  commentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabContent: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    textAlign: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  chartTypeContainer: {
    marginBottom: 24,
  },
  chartTypeContent: {
    paddingRight: 20,
    gap: 8,
  },
  chartTypeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCard: {
    marginBottom: 24,
    minHeight: 300,
  },
  heatMapCard: {
    marginBottom: 24,
  },
  heatMapTitle: {
    marginBottom: 16,
  },
  categoryDetails: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  categoryItem: {
    marginBottom: 12,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  budgetCard: {
    marginBottom: 24,
  },
  budgetTitle: {
    marginBottom: 16,
  },
  budgetSummary: {
    gap: 16,
  },
  budgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noBudgetText: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchInputContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  searchButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  advancedSearchButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterOnlyButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeSmall: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  ledgerItem: {
    marginBottom: 12,
  },
  ledgerContent: {
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
  ledgerInfo: {
    flex: 1,
  },
  ledgerDescription: {
    marginBottom: 4,
  },
  ledgerActions: {
    alignItems: 'flex-end',
  },
  deleteButton: {
    padding: 4,
    marginTop: 4,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
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
}); 