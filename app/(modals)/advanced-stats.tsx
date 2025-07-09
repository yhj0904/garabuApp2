import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useBookStore } from '@/stores/bookStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ledger } from '@/services/api';

const { width: screenWidth } = Dimensions.get('window');

interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
}

interface CategoryStats {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  averageAmount: number;
  color: string;
}

interface DailyStats {
  date: string;
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
}

interface TrendData {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  description: string;
}

export default function AdvancedStatsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [trends, setTrends] = useState<{ income: TrendData; expense: TrendData; balance: TrendData }>();
  const [isLoading, setIsLoading] = useState(false);

  const { token } = useAuthStore();
  const { ledgers, currentBook } = useBookStore();
  const { categories } = useCategoryStore();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    generateStats();
  }, [ledgers, selectedPeriod, categories]);

  const generateStats = () => {
    setIsLoading(true);
    
    // 월별 통계 생성
    const monthlyData = generateMonthlyStats();
    setMonthlyStats(monthlyData);
    
    // 카테고리별 통계 생성
    const categoryData = generateCategoryStats();
    setCategoryStats(categoryData);
    
    // 일별 통계 생성 (최근 30일)
    const dailyData = generateDailyStats();
    setDailyStats(dailyData);
    
    // 트렌드 분석
    const trendData = generateTrends(monthlyData);
    setTrends(trendData);
    
    setIsLoading(false);
  };

  const generateMonthlyStats = (): MonthlyStats[] => {
    const stats: MonthlyStats[] = [];
    const now = new Date();
    const monthCount = selectedPeriod === 'year' ? 12 : selectedPeriod === 'quarter' ? 3 : 6;
    
    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' });
      
      const monthLedgers = ledgers.filter(ledger => {
        const ledgerDate = new Date(ledger.date);
        return ledgerDate.getMonth() === date.getMonth() && 
               ledgerDate.getFullYear() === date.getFullYear();
      });
      
      const income = monthLedgers
        .filter(l => l.amountType === 'INCOME')
        .reduce((sum, l) => sum + l.amount, 0);
      
      const expense = monthLedgers
        .filter(l => l.amountType === 'EXPENSE')
        .reduce((sum, l) => sum + l.amount, 0);
      
      stats.push({
        month: monthStr,
        income,
        expense,
        balance: income - expense,
        transactionCount: monthLedgers.length
      });
    }
    
    return stats;
  };

  const generateCategoryStats = (): CategoryStats[] => {
    const categoryMap = new Map<number, CategoryStats>();
    
    // 현재 월의 지출만 분석
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthLedgers = ledgers.filter(ledger => {
      const ledgerDate = new Date(ledger.date);
      return ledgerDate.getMonth() === currentMonth && 
             ledgerDate.getFullYear() === currentYear &&
             ledger.amountType === 'EXPENSE';
    });
    
    const totalExpense = currentMonthLedgers.reduce((sum, l) => sum + l.amount, 0);
    
    currentMonthLedgers.forEach(ledger => {
      const category = categories.find(c => c.id === ledger.categoryId);
      if (!category) return;
      
      if (!categoryMap.has(ledger.categoryId)) {
        categoryMap.set(ledger.categoryId, {
          category: category.category,
          amount: 0,
          percentage: 0,
          transactionCount: 0,
          averageAmount: 0,
          color: getCategoryColor(category.category)
        });
      }
      
      const stat = categoryMap.get(ledger.categoryId)!;
      stat.amount += ledger.amount;
      stat.transactionCount++;
    });
    
    const stats = Array.from(categoryMap.values());
    
    // 백분율 및 평균 계산
    stats.forEach(stat => {
      stat.percentage = totalExpense > 0 ? (stat.amount / totalExpense) * 100 : 0;
      stat.averageAmount = stat.transactionCount > 0 ? stat.amount / stat.transactionCount : 0;
    });
    
    return stats.sort((a, b) => b.amount - a.amount);
  };

  const generateDailyStats = (): DailyStats[] => {
    const stats: DailyStats[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLedgers = ledgers.filter(ledger => ledger.date === dateStr);
      
      const income = dayLedgers
        .filter(l => l.amountType === 'INCOME')
        .reduce((sum, l) => sum + l.amount, 0);
      
      const expense = dayLedgers
        .filter(l => l.amountType === 'EXPENSE')
        .reduce((sum, l) => sum + l.amount, 0);
      
      stats.push({
        date: dateStr,
        income,
        expense,
        balance: income - expense,
        transactionCount: dayLedgers.length
      });
    }
    
    return stats;
  };

  const generateTrends = (monthlyData: MonthlyStats[]): { income: TrendData; expense: TrendData; balance: TrendData } => {
    if (monthlyData.length < 2) {
      return {
        income: { direction: 'stable', percentage: 0, description: '데이터 부족' },
        expense: { direction: 'stable', percentage: 0, description: '데이터 부족' },
        balance: { direction: 'stable', percentage: 0, description: '데이터 부족' }
      };
    }
    
    const current = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];
    
    const calculateTrend = (currentValue: number, previousValue: number): TrendData => {
      if (previousValue === 0) {
        return { direction: 'stable', percentage: 0, description: '이전 데이터 없음' };
      }
      
      const change = ((currentValue - previousValue) / previousValue) * 100;
      const absChange = Math.abs(change);
      
      if (absChange < 5) {
        return { direction: 'stable', percentage: absChange, description: '안정적' };
      }
      
      return {
        direction: change > 0 ? 'up' : 'down',
        percentage: absChange,
        description: change > 0 ? '증가' : '감소'
      };
    };
    
    return {
      income: calculateTrend(current.income, previous.income),
      expense: calculateTrend(current.expense, previous.expense),
      balance: calculateTrend(current.balance, previous.balance)
    };
  };

  const getCategoryColor = (categoryName: string): string => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatAmount = (amount: number): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toLocaleString();
  };

  const formatFullAmount = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable'): string => {
    switch (direction) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'remove';
      default: return 'remove';
    }
  };

  const getTrendColor = (direction: 'up' | 'down' | 'stable', isIncome: boolean = false): string => {
    if (direction === 'stable') return '#8E8E93';
    if (isIncome) {
      return direction === 'up' ? '#4CAF50' : '#FF9500';
    } else {
      return direction === 'up' ? '#FF3B30' : '#4CAF50';
    }
  };

  const renderSimpleChart = (data: MonthlyStats[]) => {
    if (data.length === 0) return null;
    
    const maxValue = Math.max(...data.map(d => Math.max(d.income, d.expense)));
    const chartHeight = 150;
    const barWidth = (screenWidth - 80) / data.length - 8;
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartArea}>
          {data.map((item, index) => (
            <View key={index} style={styles.chartBar}>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.incomeBar,
                    { 
                      height: (item.income / maxValue) * chartHeight,
                      width: barWidth / 2 - 2,
                      backgroundColor: '#4CAF50'
                    }
                  ]} 
                />
                <View 
                  style={[
                    styles.expenseBar,
                    { 
                      height: (item.expense / maxValue) * chartHeight,
                      width: barWidth / 2 - 2,
                      backgroundColor: '#FF3B30'
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.chartLabel, { color: colors.text }]}>
                {item.month.split(' ')[1]}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>수입</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF3B30' }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>지출</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCategoryChart = (data: CategoryStats[]) => {
    if (data.length === 0) return null;
    
    const topCategories = data.slice(0, 5);
    const maxAmount = Math.max(...topCategories.map(c => c.amount));
    
    return (
      <View style={styles.categoryChart}>
        {topCategories.map((category, index) => (
          <View key={index} style={styles.categoryBar}>
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryName, { color: colors.text }]}>{category.category}</Text>
              <Text style={[styles.categoryAmount, { color: colors.text }]}>
                ₩{formatFullAmount(category.amount)}
              </Text>
            </View>
            <View style={styles.categoryProgress}>
              <View 
                style={[
                  styles.categoryProgressBar,
                  { 
                    width: `${(category.amount / maxAmount) * 100}%`,
                    backgroundColor: category.color
                  }
                ]}
              />
            </View>
            <Text style={[styles.categoryPercentage, { color: colors.icon }]}>
              {category.percentage.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>고급 통계</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share" size={24} color={colors.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 기간 선택 */}
        <View style={styles.periodSelector}>
          {(['month', 'quarter', 'year'] as const).map(period => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                { backgroundColor: selectedPeriod === period ? colors.tint : colors.card }
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                { color: selectedPeriod === period ? 'white' : colors.text }
              ]}>
                {period === 'month' ? '월별' : period === 'quarter' ? '분기별' : '연도별'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 트렌드 요약 */}
        {trends && (
          <View style={[styles.trendSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>트렌드 분석</Text>
            
            <View style={styles.trendGrid}>
              <View style={styles.trendItem}>
                <View style={styles.trendHeader}>
                  <Ionicons 
                    name={getTrendIcon(trends.income.direction) as any}
                    size={20} 
                    color={getTrendColor(trends.income.direction, true)} 
                  />
                  <Text style={[styles.trendLabel, { color: colors.text }]}>수입</Text>
                </View>
                <Text style={[styles.trendValue, { color: getTrendColor(trends.income.direction, true) }]}>
                  {trends.income.percentage.toFixed(1)}%
                </Text>
                <Text style={[styles.trendDescription, { color: colors.icon }]}>
                  {trends.income.description}
                </Text>
              </View>
              
              <View style={styles.trendItem}>
                <View style={styles.trendHeader}>
                  <Ionicons 
                    name={getTrendIcon(trends.expense.direction) as any}
                    size={20} 
                    color={getTrendColor(trends.expense.direction, false)} 
                  />
                  <Text style={[styles.trendLabel, { color: colors.text }]}>지출</Text>
                </View>
                <Text style={[styles.trendValue, { color: getTrendColor(trends.expense.direction, false) }]}>
                  {trends.expense.percentage.toFixed(1)}%
                </Text>
                <Text style={[styles.trendDescription, { color: colors.icon }]}>
                  {trends.expense.description}
                </Text>
              </View>
              
              <View style={styles.trendItem}>
                <View style={styles.trendHeader}>
                  <Ionicons 
                    name={getTrendIcon(trends.balance.direction) as any}
                    size={20} 
                    color={getTrendColor(trends.balance.direction, false)} 
                  />
                  <Text style={[styles.trendLabel, { color: colors.text }]}>잔액</Text>
                </View>
                <Text style={[styles.trendValue, { color: getTrendColor(trends.balance.direction, false) }]}>
                  {trends.balance.percentage.toFixed(1)}%
                </Text>
                <Text style={[styles.trendDescription, { color: colors.icon }]}>
                  {trends.balance.description}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 월별 차트 */}
        <View style={[styles.chartSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>월별 수입/지출</Text>
          {renderSimpleChart(monthlyStats)}
        </View>

        {/* 카테고리별 분석 */}
        <View style={[styles.chartSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>카테고리별 지출</Text>
          {renderCategoryChart(categoryStats)}
        </View>

        {/* 상세 통계 */}
        <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>상세 통계</Text>
          
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.text }]}>평균 일일 지출</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              ₩{formatFullAmount(dailyStats.reduce((sum, d) => sum + d.expense, 0) / dailyStats.length)}
            </Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.text }]}>최대 일일 지출</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              ₩{formatFullAmount(Math.max(...dailyStats.map(d => d.expense)))}
            </Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.text }]}>총 거래 건수</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {ledgers.length}건
            </Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.text }]}>가장 많이 사용한 카테고리</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {categoryStats[0]?.category || '없음'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  trendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  trendLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  trendValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trendDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  chartSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    marginBottom: 12,
  },
  chartBar: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  incomeBar: {
    borderRadius: 2,
  },
  expenseBar: {
    borderRadius: 2,
  },
  chartLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 14,
  },
  categoryChart: {
    gap: 12,
  },
  categoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryProgress: {
    flex: 2,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
  detailSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  statLabel: {
    fontSize: 16,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});