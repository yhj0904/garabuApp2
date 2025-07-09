import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { Ledger } from '@/services/api';

const tabs = ['통계', '예산', '내역'];
const types = ['수입', '지출'];

export default function ExploreScreen() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedType, setSelectedType] = useState(1); // 기본: 지출
  const [currentDate, setCurrentDate] = useState(new Date());
  const [historyLedgers, setHistoryLedgers] = useState<Ledger[]>([]);
  
  const { token } = useAuthStore();
  const { ledgers, fetchLedgers, currentBook } = useBookStore();
  const { categories } = useCategoryStore();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const month = currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

  // 내역 탭일 때 전체 거래 내역 로드
  useEffect(() => {
    if (selectedTab === 2 && token && currentBook) {
      fetchLedgers({ page: 0, size: 100 }, token).then(() => {
        setHistoryLedgers(ledgers);
      });
    }
  }, [selectedTab, token, currentBook]);

  // 현재 월의 거래 내역만 필터링
  const currentMonthLedgers = ledgers.filter(ledger => {
    const ledgerDate = new Date(ledger.date);
    return ledgerDate.getMonth() === currentDate.getMonth() && 
           ledgerDate.getFullYear() === currentDate.getFullYear();
  });

  // 수입/지출 분리
  const incomeAmount = currentMonthLedgers
    .filter(ledger => ledger.amountType === 'INCOME')
    .reduce((sum, ledger) => sum + ledger.amount, 0);

  const expenseAmount = currentMonthLedgers
    .filter(ledger => ledger.amountType === 'EXPENSE')
    .reduce((sum, ledger) => sum + ledger.amount, 0);

  // 카테고리별 집계
  const categoryStats = categories.map(category => {
    const categoryLedgers = currentMonthLedgers.filter(ledger => 
      ledger.categoryId === category.id && ledger.amountType === 'EXPENSE'
    );
    const total = categoryLedgers.reduce((sum, ledger) => sum + ledger.amount, 0);
    const percentage = expenseAmount > 0 ? (total / expenseAmount) * 100 : 0;
    
    return {
      category: category.category,
      total,
      percentage: Math.round(percentage),
      icon: getCategoryIcon(category.category),
      color: getCategoryColor(category.category)
    };
  }).filter(stat => stat.total > 0).sort((a, b) => b.total - a.total);

  // 월 변경 함수
  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

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
  const getCategoryColor = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('식') || name.includes('음식')) return '#FF9500';
    if (name.includes('교통')) return '#5856D6';
    if (name.includes('주거') || name.includes('집')) return '#34C759';
    if (name.includes('쇼핑')) return '#AF52DE';
    if (name.includes('의료')) return '#FF3B30';
    if (name.includes('교육')) return '#007AFF';
    return '#8E8E93';
  };

  // 금액 포맷팅
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    });
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
    if (lowercaseDesc.includes('식') || lowercaseDesc.includes('음식')) return '#FF9500';
    if (lowercaseDesc.includes('급여') || lowercaseDesc.includes('월급')) return '#007AFF';
    if (lowercaseDesc.includes('주유') || lowercaseDesc.includes('기름')) return '#5856D6';
    if (lowercaseDesc.includes('교통') || lowercaseDesc.includes('지하철')) return '#FF3B30';
    if (lowercaseDesc.includes('쇼핑') || lowercaseDesc.includes('구매')) return '#AF52DE';
    return colors.tint;
  };

  // 내역 탭에서 표시할 거래 내역 필터링
  const getFilteredLedgers = () => {
    const filtered = historyLedgers.filter(ledger => {
      const ledgerDate = new Date(ledger.date);
      const isCurrentMonth = ledgerDate.getMonth() === currentDate.getMonth() && 
                            ledgerDate.getFullYear() === currentDate.getFullYear();
      const isCorrectType = selectedType === 0 ? ledger.amountType === 'INCOME' : ledger.amountType === 'EXPENSE';
      return isCurrentMonth && isCorrectType;
    });
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // 렌더링할 거래 내역 아이템
  const renderLedgerItem = ({ item }: { item: Ledger }) => (
    <View style={[styles.transactionItem, { backgroundColor: colors.card }]}>
      <View style={styles.transactionIcon}>
        <Ionicons 
          name={getTransactionIcon(item.description) as any} 
          size={24} 
          color={getTransactionColor(item.description)} 
        />
      </View>
      <View style={styles.transactionInfo}>
        <ThemedText type="defaultSemiBold">{item.description}</ThemedText>
        <ThemedText style={styles.transactionDate}>
          {formatDate(item.date)}
        </ThemedText>
        {item.memo && (
          <ThemedText style={styles.transactionMemo}>{item.memo}</ThemedText>
        )}
      </View>
      <View style={styles.transactionRight}>
        <ThemedText style={[
          styles.transactionAmount, 
          { color: item.amountType === 'INCOME' ? '#4CAF50' : '#FF3B30' }
        ]}>
          {item.amountType === 'INCOME' ? '+' : '-'}₩{formatAmount(item.amount)}
        </ThemedText>
        {item.spender && (
          <ThemedText style={styles.transactionSpender}>{item.spender}</ThemedText>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {/* 상단 월 선택 */}
          <View style={styles.monthRow}>
            <TouchableOpacity style={styles.arrowButton} onPress={() => changeMonth('prev')}>
              <Ionicons name="chevron-back" size={24} color={colors.icon} />
            </TouchableOpacity>
            <ThemedText type="subtitle" style={styles.month}>{month}</ThemedText>
            <TouchableOpacity style={styles.arrowButton} onPress={() => changeMonth('next')}>
              <Ionicons name="chevron-forward" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* 탭 */}
          <View style={[styles.tabRow, { borderBottomColor: colors.card }]}>
            {tabs.map((tab, idx) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, selectedTab === idx && { borderBottomColor: colors.tint }]}
                onPress={() => setSelectedTab(idx)}>
                <ThemedText 
                  style={[
                    styles.tabText, 
                    { color: selectedTab === idx ? colors.tint : colors.icon },
                    selectedTab === idx && styles.tabTextActive
                  ]}
                >
                  {tab}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* 수입/지출 구분 */}
          <View style={styles.typeRow}>
            {types.map((type, idx) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeBtn, 
                  { backgroundColor: selectedType === idx ? colors.card : 'rgba(0,0,0,0.05)' }
                ]}
                onPress={() => setSelectedType(idx)}>
                <ThemedText 
                  style={[
                    styles.typeText, 
                    { color: selectedType === idx ? colors.tint : colors.icon },
                    selectedType === idx && styles.typeTextActive
                  ]}
                >
                  {type}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* 대시보드/통계 영역 */}
          <View style={styles.content}>
            {selectedTab === 0 && (
              <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={styles.statHeader}>
                    <Ionicons name="trending-down" size={24} color="#FF3B30" />
                    <ThemedText type="subtitle">이번 달 총 지출</ThemedText>
                  </View>
                  <ThemedText type="title" style={styles.statAmount}>₩{formatAmount(expenseAmount)}</ThemedText>
                  <ThemedText style={[styles.statChange, { color: '#8E8E93' }]}>
                    {currentMonthLedgers.filter(l => l.amountType === 'EXPENSE').length}건의 지출
                  </ThemedText>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={styles.statHeader}>
                    <Ionicons name="trending-up" size={24} color="#4CAF50" />
                    <ThemedText type="subtitle">이번 달 총 수입</ThemedText>
                  </View>
                  <ThemedText type="title" style={styles.statAmount}>₩{formatAmount(incomeAmount)}</ThemedText>
                  <ThemedText style={[styles.statChange, { color: '#8E8E93' }]}>
                    {currentMonthLedgers.filter(l => l.amountType === 'INCOME').length}건의 수입
                  </ThemedText>
                </View>

                <View style={[styles.categoryCard, { backgroundColor: colors.card }]}>
                  <ThemedText type="subtitle" style={styles.categoryTitle}>카테고리별 지출</ThemedText>
                  {categoryStats.length === 0 ? (
                    <ThemedText style={styles.emptyText}>이번 달 지출 내역이 없습니다.</ThemedText>
                  ) : (
                    categoryStats.slice(0, 5).map((stat, index) => (
                      <View key={index} style={styles.categoryItem}>
                        <View style={styles.categoryIcon}>
                          <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                        </View>
                        <View style={styles.categoryInfo}>
                          <ThemedText type="defaultSemiBold">{stat.category}</ThemedText>
                          <ThemedText style={styles.categoryPercent}>{stat.percentage}%</ThemedText>
                        </View>
                        <ThemedText type="defaultSemiBold">₩{formatAmount(stat.total)}</ThemedText>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}

            {selectedTab === 1 && (
              <View style={styles.budgetContainer}>
                <View style={[styles.budgetCard, { backgroundColor: colors.card }]}>
                  <ThemedText type="subtitle">이번 달 예산</ThemedText>
                  <ThemedText type="title" style={styles.budgetAmount}>₩2,000,000</ThemedText>
                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min((expenseAmount / 2000000) * 100, 100)}%`, 
                        backgroundColor: expenseAmount > 2000000 ? '#FF3B30' : '#4CAF50' 
                      }
                    ]} />
                  </View>
                  <ThemedText style={styles.budgetStatus}>
                    {Math.round((expenseAmount / 2000000) * 100)}% 사용됨 (₩{formatAmount(expenseAmount)})
                  </ThemedText>
                  <ThemedText style={styles.budgetRemaining}>
                    잔여 예산: ₩{formatAmount(Math.max(2000000 - expenseAmount, 0))}
                  </ThemedText>
                </View>
              </View>
            )}

            {selectedTab === 2 && (
              <View style={styles.historyContainer}>
                {getFilteredLedgers().length === 0 ? (
                  <ThemedText style={styles.emptyText}>
                    {selectedType === 0 ? '수입' : '지출'} 내역이 없습니다.
                  </ThemedText>
                ) : (
                  <FlatList
                    data={getFilteredLedgers()}
                    renderItem={renderLedgerItem}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                  />
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: { 
    flex: 1, 
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  monthRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 16, 
    marginBottom: 16,
  },
  month: { 
    marginHorizontal: 16,
  },
  arrowButton: {
    padding: 8,
  },
  tabRow: { 
    flexDirection: 'row', 
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tab: { 
    flex: 1, 
    padding: 12, 
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { 
    fontSize: 16,
  },
  tabTextActive: { 
    fontWeight: 'bold',
  },
  typeRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginBottom: 24,
  },
  typeBtn: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginHorizontal: 4,
  },
  typeText: { 
    fontSize: 14,
  },
  typeTextActive: { 
    fontWeight: 'bold',
  },
  content: { 
    flex: 1,
  },
  statsContainer: {
    gap: 16,
  },
  statCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryTitle: {
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryPercent: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  budgetContainer: {
    gap: 16,
  },
  budgetCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  budgetAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    marginVertical: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetStatus: {
    fontSize: 14,
    color: '#8E8E93',
  },
  budgetRemaining: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  historyContainer: {
    flex: 1,
    minHeight: 300,
  },
  emptyText: { 
    color: '#bbb', 
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  transactionMemo: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
    fontStyle: 'italic',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionSpender: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
}); 