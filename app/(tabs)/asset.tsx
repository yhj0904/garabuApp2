import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAssetStore } from '@/stores/assetStore';
import type { Asset } from '@/core/api/client';
import { useBudgetStore } from '@/stores/budgetStore';
import { useBookStore } from '@/stores/bookStore';
import { useAuthStore } from '@/stores/authStore';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import config from '@/config/config';

export default function AssetScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { currentBook } = useBookStore();
  const { token } = useAuthStore();
  const { 
    assets, 
    assetTypes, 
    getAssetTypeStats, 
    getAssetsByType,
    fetchAssetsByBook,
    fetchAssetTypes,
    deleteAsset 
  } = useAssetStore();
  const { 
    budgetSummary, 
    fetchBudgetsByBook, 
    getBudgetSummary 
  } = useBudgetStore();

  // 스플래시 화면에서 이미 데이터를 로드했으므로 제거
  // 월 변경 시에만 예산 데이터 다시 로드
  useEffect(() => {
    if (currentBook && token && currentMonth) {
      loadBudgetDataForMonth();
    }
  }, [currentMonth]);

  // 통화 데이터 로드
  useEffect(() => {
    if (currentBook && token) {
      fetchCurrencies();
    }
  }, [currentBook, token]);

  // 특정 월의 예산 데이터만 로드
  const loadBudgetDataForMonth = async () => {
    if (!currentBook || !token) return;
    
    try {
      await getBudgetSummary(currentBook.id, currentMonth, token);
    } catch (error) {
      console.error('예산 데이터 로드 실패:', error);
    }
  };

  // 통화 정보 가져오기
  const fetchCurrencies = async () => {
    try {
      // 가계부의 통화 설정 조회
      const bookCurrenciesResponse = await axios.get(
        `${config.API_BASE_URL}/api/v2/currencies/book/${currentBook?.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const activeCurrencies = bookCurrenciesResponse.data.map((bc: any) => bc.currency);
      setCurrencies(activeCurrencies);
      
      // 환율 정보 조회
      if (activeCurrencies.length > 1) {
        const ratesResponse = await axios.get(
          `${config.API_BASE_URL}/api/v2/currencies/exchange-rates?from=KRW`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setExchangeRates(ratesResponse.data);
      }
    } catch (error) {
      console.error('통화 정보 조회 실패:', error);
    }
  };

  // 새로고침 핸들러
  const onRefresh = async () => {
    try {
      // 햅틱 피드백
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      setRefreshing(true);
      
      // 데이터 새로고침
      if (currentBook && token) {
        await Promise.all([
          fetchBudgetsByBook(currentBook.id, token),
          getBudgetSummary(currentBook.id, currentMonth, token),
          fetchAssetTypes(token),
          fetchAssetsByBook(currentBook.id, token)
        ]);
      }
      
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 예산 설정 화면으로 이동
  const navigateToBudgetSettings = () => {
    router.push('/(modals)/budget-settings');
  };

  // 자산 추가 화면으로 이동
  const navigateToAddAsset = () => {
    router.push('/(modals)/add-asset');
  };

  // 자산 분석 화면으로 이동
  const navigateToAssetAnalysis = () => {
    router.push('/(tabs)/explore'); // 통계 탭으로 이동
  };

  // 자산 삭제 핸들러
  const handleDeleteAsset = async (asset: Asset) => {
    if (!token) return;
    
    Alert.alert(
      '자산 삭제',
      `"${asset.name}" 자산을 삭제하시겠습니까?\n\n삭제된 자산은 복구할 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await deleteAsset(asset.id, token);
              console.log('자산 삭제 완료:', asset.name);
            } catch (error) {
              console.error('자산 삭제 실패:', error);
              Alert.alert('오류', '자산을 삭제하는 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  // 예산 달성률 계산
  const getAchievementRate = (actual: number, budget: number) => {
    if (!budget || budget === 0) return 0;
    return Math.round((actual / budget) * 100);
  };

  // 예산 달성률 색상 결정
  const getAchievementColor = (rate: number) => {
    if (rate <= 80) return '#4CAF50'; // 녹색 (좋음)
    if (rate <= 100) return '#FF9800'; // 주황색 (주의)
    return '#F44336'; // 빨간색 (초과)
  };

  // 통화별 자산 필터링
  const getAssetsByCurrency = (currency?: string) => {
    if (!currency || currency === 'ALL') {
      return assets;
    }
    return assets.filter(asset => asset.currency === currency);
  };

  // 통화별 총 자산 계산 (환율 적용)
  const getTotalAssetsByCurrency = (currency?: string) => {
    const filteredAssets = getAssetsByCurrency(currency);
    
    if (!currency || currency === 'ALL') {
      // 모든 통화의 자산을 KRW로 환산
      return filteredAssets.reduce((total, asset) => {
        if (asset.currency === 'KRW' || !asset.currency) {
          return total + asset.balance;
        }
        
        // 환율 적용
        const rate = exchangeRates.find(r => r.toCurrency === asset.currency);
        if (rate) {
          return total + (asset.balance / rate.rate);
        }
        return total + asset.balance;
      }, 0);
    }
    
    // 특정 통화의 자산만 합산
    return filteredAssets.reduce((total, asset) => total + asset.balance, 0);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
            colors={[colors.tint]}
            progressBackgroundColor={colors.background}
          />
        }
      >
        {/* 통화 필터 */}
        {currencies.length > 1 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.currencyFilter}
            contentContainerStyle={styles.currencyFilterContent}
          >
            <TouchableOpacity
              style={[
                styles.currencyChip,
                { 
                  backgroundColor: selectedCurrency === 'ALL' ? colors.tint : colors.card,
                  borderColor: selectedCurrency === 'ALL' ? colors.tint : colors.border
                }
              ]}
              onPress={() => setSelectedCurrency('ALL')}
            >
              <ThemedText style={{ 
                color: selectedCurrency === 'ALL' ? 'white' : colors.text,
                fontWeight: selectedCurrency === 'ALL' ? '600' : '400'
              }}>
                전체
              </ThemedText>
            </TouchableOpacity>
            {currencies.map((currency) => (
              <TouchableOpacity
                key={currency.id}
                style={[
                  styles.currencyChip,
                  { 
                    backgroundColor: selectedCurrency === currency.code ? colors.tint : colors.card,
                    borderColor: selectedCurrency === currency.code ? colors.tint : colors.border
                  }
                ]}
                onPress={() => setSelectedCurrency(currency.code)}
              >
                <ThemedText style={{ 
                  color: selectedCurrency === currency.code ? 'white' : colors.text,
                  fontWeight: selectedCurrency === currency.code ? '600' : '400'
                }}>
                  {currency.code} ({currency.symbol})
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* 총 자산 카드 */}
        <View style={[styles.totalAssetCard, { backgroundColor: colors.card }]}>
          <View style={styles.totalAssetHeader}>
            <ThemedText type="subtitle">
              {selectedCurrency === 'ALL' ? '총 자산' : `${selectedCurrency} 자산`}
            </ThemedText>
            <Ionicons name="wallet" size={24} color={colors.tint} />
          </View>
          <ThemedText type="title" style={styles.totalAssetAmount}>
            {selectedCurrency === 'ALL' || selectedCurrency === 'KRW' ? '₩' : 
             currencies.find(c => c.code === selectedCurrency)?.symbol || ''}
            {getTotalAssetsByCurrency(selectedCurrency).toLocaleString()}
          </ThemedText>
          <View style={styles.assetChange}>
            <Ionicons name="wallet-outline" size={16} color={colors.tint} />
            <ThemedText style={[styles.changeText, { color: colors.tint }]}>
              {selectedCurrency === 'ALL' ? 
                `총 ${assets.length}개 자산` : 
                `${getAssetsByCurrency(selectedCurrency).length}개 자산`}
            </ThemedText>
          </View>
          {selectedCurrency !== 'ALL' && selectedCurrency !== 'KRW' && (
            <ThemedText style={[styles.exchangeRateText, { color: colors.icon }]}>
              ₩{getTotalAssetsByCurrency('ALL').toLocaleString()} (환율 적용)
            </ThemedText>
          )}
        </View>

        {/* 예산 섹션 */}
        <View style={styles.budgetSection}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>이번 달 예산</ThemedText>
            <TouchableOpacity 
              style={styles.budgetSettingsButton}
              onPress={navigateToBudgetSettings}
            >
              <Ionicons name="settings-outline" size={20} color={colors.tint} />
            </TouchableOpacity>
          </View>

          {budgetSummary ? (
            <View style={[styles.budgetCard, { backgroundColor: colors.card }]}>
              {/* 수입 예산 */}
              {budgetSummary.incomeBudget && (
                <View style={styles.budgetItem}>
                  <View style={styles.budgetHeader}>
                    <Ionicons name="trending-up" size={20} color="#4CAF50" />
                    <ThemedText type="defaultSemiBold">수입 예산</ThemedText>
                  </View>
                  <View style={styles.budgetAmounts}>
                    <ThemedText type="defaultSemiBold">
                      ₩{budgetSummary.actualIncome?.toLocaleString() || 0}
                    </ThemedText>
                    <ThemedText style={styles.budgetTarget}>
                      / ₩{budgetSummary.incomeBudget.toLocaleString()}
                    </ThemedText>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${Math.min(budgetSummary.incomeAchievementRate, 100)}%`,
                            backgroundColor: getAchievementColor(budgetSummary.incomeAchievementRate)
                          }
                        ]} 
                      />
                    </View>
                    <ThemedText style={[
                      styles.achievementRate,
                      { color: getAchievementColor(budgetSummary.incomeAchievementRate) }
                    ]}>
                      {budgetSummary.incomeAchievementRate}%
                    </ThemedText>
                  </View>
                </View>
              )}

              {/* 지출 예산 */}
              {budgetSummary.expenseBudget && (
                <View style={styles.budgetItem}>
                  <View style={styles.budgetHeader}>
                    <Ionicons name="trending-down" size={20} color="#F44336" />
                    <ThemedText type="defaultSemiBold">지출 예산</ThemedText>
                  </View>
                  <View style={styles.budgetAmounts}>
                    <ThemedText type="defaultSemiBold">
                      ₩{budgetSummary.actualExpense?.toLocaleString() || 0}
                    </ThemedText>
                    <ThemedText style={styles.budgetTarget}>
                      / ₩{budgetSummary.expenseBudget.toLocaleString()}
                    </ThemedText>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${Math.min(budgetSummary.expenseAchievementRate, 100)}%`,
                            backgroundColor: getAchievementColor(budgetSummary.expenseAchievementRate)
                          }
                        ]} 
                      />
                    </View>
                    <ThemedText style={[
                      styles.achievementRate,
                      { color: getAchievementColor(budgetSummary.expenseAchievementRate) }
                    ]}>
                      {budgetSummary.expenseAchievementRate}%
                    </ThemedText>
                  </View>
                </View>
              )}

              {/* 예산 메모 */}
              {budgetSummary.memo && (
                <View style={styles.budgetMemo}>
                  <ThemedText style={styles.memoText}>{budgetSummary.memo}</ThemedText>
                </View>
              )}
            </View>
          ) : (
            // 예산이 설정되지 않은 경우
            <View style={[styles.budgetCard, { backgroundColor: colors.card }]}>
              <View style={styles.noBudgetContainer}>
                <Ionicons name="calculator-outline" size={48} color={colors.icon} />
                <ThemedText type="defaultSemiBold" style={[styles.noBudgetTitle, { color: colors.text }]}>
                  예산이 설정되지 않았습니다
                </ThemedText>
                <ThemedText style={[styles.noBudgetMessage, { color: colors.icon }]}>
                  이번 달 예산을 설정하여 지출을 관리해보세요
                </ThemedText>
                <TouchableOpacity 
                  style={[styles.setBudgetButton, { backgroundColor: colors.tint }]}
                  onPress={navigateToBudgetSettings}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <ThemedText style={styles.setBudgetButtonText}>예산 설정하기</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 자산 카테고리 */}
        <View style={styles.assetCategories}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>자산 분류</ThemedText>
          
          {getAssetTypeStats().length > 0 ? (
            getAssetTypeStats().map((stat) => {
              const assetType = assetTypes.find(type => type.type === stat.type);
              const typeAssets = getAssetsByType(stat.type).filter(asset => 
                selectedCurrency === 'ALL' || asset.currency === selectedCurrency || (!asset.currency && selectedCurrency === 'KRW')
              );
              
              if (!assetType || typeAssets.length === 0) return null;
              
              return (
                <View key={stat.type} style={styles.assetTypeGroup}>
                  {/* 타입 헤더 */}
                  <View style={[styles.assetCard, { backgroundColor: colors.card }]}>
                    <View style={styles.assetHeader}>
                      <View style={[styles.assetIcon, { backgroundColor: assetType.color }]}>
                        <Ionicons name={assetType.icon as any} size={24} color="white" />
                      </View>
                      <View style={styles.assetInfo}>
                        <ThemedText type="defaultSemiBold">{assetType.name}</ThemedText>
                        <ThemedText style={styles.assetPercent}>
                          {stat.percentage.toFixed(1)}% • {stat.count}개
                        </ThemedText>
                      </View>
                      <ThemedText type="defaultSemiBold">₩{stat.amount.toLocaleString()}</ThemedText>
                    </View>
                  </View>
                  
                  {/* 개별 자산 목록 */}
                  {typeAssets.map((asset) => (
                    <View key={asset.id} style={[styles.individualAssetCard, { backgroundColor: colors.card }]}>
                      <TouchableOpacity
                        style={styles.individualAssetTouchable}
                        onPress={() => router.push(`/(modals)/asset-detail?assetId=${asset.id}`)}
                      >
                        <View style={styles.individualAssetHeader}>
                          <View style={styles.individualAssetInfo}>
                            <ThemedText style={[styles.assetName, { color: colors.text }]}>
                              {asset.name}
                            </ThemedText>
                            {asset.description && (
                              <ThemedText style={[styles.assetDescription, { color: colors.tabIconDefault }]}>
                                {asset.description}
                              </ThemedText>
                            )}
                          </View>
                          <View style={styles.assetBalanceSection}>
                            {asset.currency && asset.currency !== 'KRW' && (
                              <ThemedText style={[styles.assetCurrency, { color: colors.tint }]}>
                                {asset.currency}
                              </ThemedText>
                            )}
                            <ThemedText style={[styles.assetBalance, { color: colors.text }]}>
                              {asset.currency && asset.currency !== 'KRW' ? 
                                currencies.find(c => c.code === asset.currency)?.symbol || '' : '₩'}
                              {asset.balance.toLocaleString()}
                            </ThemedText>
                            <Ionicons name="chevron-forward" size={16} color={colors.tabIconDefault} />
                          </View>
                        </View>
                      </TouchableOpacity>
                      
                      {/* 삭제 버튼 */}
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteAsset(asset)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              );
            })
          ) : (
            <View style={[styles.emptyAssetCard, { backgroundColor: colors.card }]}>
              <Ionicons name="wallet-outline" size={48} color={colors.text} style={styles.emptyIcon} />
              <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                등록된 자산이 없습니다
              </ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                자산을 추가하여 관리를 시작해보세요
              </ThemedText>
              <TouchableOpacity 
                style={[styles.addFirstAssetButton, { backgroundColor: colors.tint }]}
                onPress={navigateToAddAsset}
              >
                <ThemedText style={styles.addFirstAssetButtonText}>첫 자산 추가하기</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 빠른 액션 */}
        <View style={styles.quickActions}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>빠른 액션</ThemedText>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={navigateToAddAsset}
            >
              <Ionicons name="add-circle" size={28} color={colors.tint} />
              <ThemedText type="defaultSemiBold" style={styles.actionButtonText}>자산 추가</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={navigateToAssetAnalysis}
            >
              <Ionicons name="analytics" size={28} color={colors.tint} />
              <ThemedText type="defaultSemiBold" style={styles.actionButtonText}>자산 분석</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  totalAssetCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  totalAssetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalAssetAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  assetChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  budgetSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 0,
  },
  budgetSettingsButton: {
    padding: 8,
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
  budgetItem: {
    marginBottom: 20,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  budgetAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  budgetTarget: {
    fontSize: 14,
    color: '#8E8E93',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  achievementRate: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  budgetMemo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  memoText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  noBudgetContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noBudgetTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  noBudgetMessage: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  setBudgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  setBudgetButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  assetCategories: {
    marginBottom: 24,
  },
  assetCard: {
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
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  assetInfo: {
    flex: 1,
  },
  assetPercent: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  quickActions: {
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyAssetCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstAssetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstAssetButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  assetTypeGroup: {
    marginBottom: 16,
  },
  individualAssetCard: {
    borderRadius: 8,
    marginTop: 4,
    marginLeft: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  individualAssetTouchable: {
    flex: 1,
    padding: 12,
  },
  individualAssetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  individualAssetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 15,
    fontWeight: '500',
  },
  assetDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  assetBalanceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assetBalance: {
    fontSize: 14,
    fontWeight: '500',
  },
  currencyFilter: {
    marginBottom: 16,
    maxHeight: 50,
  },
  currencyFilterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  currencyChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  exchangeRateText: {
    fontSize: 12,
    marginTop: 4,
  },
  assetCurrency: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
}); 