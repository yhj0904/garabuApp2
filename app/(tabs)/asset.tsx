import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedCard } from '@/components/ThemedCard';
import { ThemedButton } from '@/components/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import { useAssetStore } from '@/stores/assetStore';
import { useBookStore } from '@/stores/bookStore';
import AssetDetailModal from '@/features/assets/components/AssetDetailModal';

export default function AssetScreen() {
  const { token } = useAuthStore();
  const { currentBook, ledgers } = useBookStore();
  const { assets, assetTypes, fetchAssetsByBook, deleteAsset, fetchAssetTypes } = useAssetStore();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [showAssetTypes, setShowAssetTypes] = useState(false);

  useEffect(() => {
    if (token) {
      // 자산 타입을 먼저 로드
      fetchAssetTypes(token);
      
      if (currentBook) {
        // 자산과 거래내역 모두 로드
        fetchAssetsByBook(currentBook.id, token);
        useBookStore.getState().fetchLedgers({ bookId: currentBook.id, page: 0, size: 100 }, token);
      }
    }
  }, [token, currentBook]);
  
  // ledgers가 변경될 때마다 자산도 다시 로드
  useEffect(() => {
    if (token && currentBook && ledgers) {
      fetchAssetsByBook(currentBook.id, token);
    }
  }, [ledgers?.length]);

  const onRefresh = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRefreshing(true);
      
      if (token && currentBook) {
        // 자산 목록과 거래 내역 모두 새로고침
        await Promise.all([
          fetchAssetsByBook(currentBook.id, token),
          useBookStore.getState().fetchLedgers({ bookId: currentBook.id, page: 0, size: 100 }, token)
        ]);
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
      Alert.alert('새로고침 실패', '데이터를 새로고침하는 중 오류가 발생했습니다.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddAsset = () => {
    router.push('/(modals)/add-asset');
  };

  const handleEditAsset = () => {
    if (selectedAsset) {
      router.push({
        pathname: '/(modals)/edit-asset',
        params: { assetId: selectedAsset.id }
      });
      setSelectedAsset(null);
    }
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;
    
    Alert.alert(
      '자산 삭제',
      `'${selectedAsset.name}' 자산을 삭제하시겠습니까?\n\n삭제된 자산은 복구할 수 없으며, 관련된 거래 내역은 유지됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              if (token) {
                await deleteAsset(selectedAsset.id, token);
                setSelectedAsset(null);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('성공', '자산이 삭제되었습니다.');
              }
            } catch (error) {
              console.error('Failed to delete asset:', error);
              Alert.alert('삭제 실패', '자산을 삭제하는 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric',
    });
  };

  const calculateTotalAssets = () => {
    return assets
      .filter(asset => asset.isActive)
      .reduce((sum, asset) => sum + asset.balance, 0);
  };

  const calculateMonthlyChange = () => {
    if (!assets || assets.length === 0) return 0;
    
    // 현재 총자산
    const currentTotal = calculateTotalAssets();
    
    // 이번달 초의 자산 계산 (거래내역 기반)
    if (!ledgers) return 0;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 이번달 거래로 인한 자산 변화량
    const monthlyTransactions = ledgers
      .filter(ledger => {
        const ledgerDate = new Date(ledger.transactionDate);
        return ledgerDate >= startOfMonth && ledgerDate <= now;
      })
      .reduce((sum, ledger) => {
        // 자산 계좌와 연결된 거래만 계산
        if (ledger.paymentId) {
          if (ledger.amountType === 'INCOME') return sum + ledger.amount;
          if (ledger.amountType === 'EXPENSE') return sum - ledger.amount;
        }
        return sum;
      }, 0);
    
    return monthlyTransactions;
  };

  const getAssetTransactions = (assetId: number) => {
    if (!ledgers) return [];
    
    return ledgers
      .filter(ledger => ledger.paymentId === assetId)
      .slice(0, 5);
  };

  const getFilteredAssets = () => {
    let filtered = assets.filter(asset => asset.isActive);
    
    if (selectedFilter !== 'ALL') {
      filtered = filtered.filter(asset => asset.assetType === selectedFilter);
    }
    
    return filtered.sort((a, b) => b.balance - a.balance);
  };

  const getAssetsByType = () => {
    const assetsByType: { [key: string]: { assets: any[], total: number } } = {};
    
    assets.filter(asset => asset.isActive).forEach(asset => {
      if (!assetsByType[asset.assetType]) {
        assetsByType[asset.assetType] = { assets: [], total: 0 };
      }
      assetsByType[asset.assetType].assets.push(asset);
      assetsByType[asset.assetType].total += asset.balance;
    });
    
    return assetsByType;
  };

  const totalAssets = calculateTotalAssets();
  const monthlyChange = calculateMonthlyChange();
  const changePercentage = totalAssets > 0 ? (monthlyChange / totalAssets) * 100 : 0;

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
          <View style={styles.headerTop}>
            <View>
              <ThemedText type="subtitle" variant="secondary">
                {currentBook?.title || '가계부'}
              </ThemedText>
              <ThemedText type="title">
                자산 관리
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={handleAddAsset}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 총 자산 요약 */}
        <ThemedCard variant="elevated" style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <ThemedText type="subtitle" variant="secondary">
              총 자산
            </ThemedText>
            <TouchableOpacity onPress={() => setShowAssetTypes(!showAssetTypes)}>
              <Ionicons 
                name={showAssetTypes ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          
          <ThemedText type="title" style={styles.balanceAmount}>
            ₩{formatAmount(totalAssets)}
          </ThemedText>
          
          <View style={styles.monthlyStats}>
            <View style={styles.statItem}>
              <ThemedText 
                type="caption" 
                variant={monthlyChange >= 0 ? 'success' : 'error'}
              >
                {monthlyChange >= 0 ? '+' : '-'}₩{formatAmount(Math.abs(monthlyChange))}
              </ThemedText>
              <ThemedText type="caption" variant="tertiary">
                이번 달 변화
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="caption" variant="secondary">
                {totalAssets > 0 ? (changePercentage >= 0 ? '+' : '') + changePercentage.toFixed(1) + '%' : '0.0%'}
              </ThemedText>
              <ThemedText type="caption" variant="tertiary">
                변화율
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        {/* 자산 유형별 현황 - 토글 가능 */}
        {showAssetTypes && (
          <View style={styles.assetTypesSummary}>
            {Object.entries(getAssetsByType()).map(([type, data]) => {
              const assetType = assetTypes.find(t => t.type === type);
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.assetTypeCard, { 
                    backgroundColor: colors.backgroundSecondary,
                    borderLeftColor: assetType?.color || colors.primary 
                  }]}
                  onPress={() => setSelectedFilter(type)}
                >
                  <View style={styles.assetTypeIcon}>
                    <Ionicons name={assetType?.icon as any || 'wallet'} size={20} color={assetType?.color || colors.primary} />
                  </View>
                  <View style={styles.assetTypeInfo}>
                    <ThemedText type="caption" variant="secondary">
                      {assetType?.name || type}
                    </ThemedText>
                    <ThemedText type="body" weight="medium">
                      ₩{formatAmount(data.total)}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* 자산 유형 필터 */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'ALL' && styles.filterChipActive,
              { 
                backgroundColor: selectedFilter === 'ALL' ? colors.primary : colors.backgroundSecondary,
                borderColor: selectedFilter === 'ALL' ? colors.primary : colors.border
              }
            ]}
            onPress={() => setSelectedFilter('ALL')}
          >
            <ThemedText 
              type="caption" 
              variant={selectedFilter === 'ALL' ? 'inverse' : 'secondary'}
              weight="medium"
            >
              전체
            </ThemedText>
          </TouchableOpacity>
          
          {assetTypes.map((type) => {
            // 해당 자산 타입을 가진 자산이 있는지 확인
            const hasAssets = assets.some(asset => asset.assetType === type.type && asset.isActive);
            
            // 자산이 없으면 버튼을 표시하지 않음
            if (!hasAssets) return null;
            
            return (
              <TouchableOpacity
                key={type.type}
                style={[
                  styles.filterChip,
                  selectedFilter === type.type && styles.filterChipActive,
                  { 
                    backgroundColor: selectedFilter === type.type ? type.color : colors.backgroundSecondary,
                    borderColor: selectedFilter === type.type ? type.color : colors.border
                  }
                ]}
                onPress={() => setSelectedFilter(type.type)}
              >
                {type.icon && (
                  <Ionicons 
                    name={type.icon as any} 
                    size={16} 
                    color={selectedFilter === type.type ? 'white' : colors.text} 
                    style={{ marginRight: 4 }}
                  />
                )}
                <ThemedText 
                  type="caption" 
                  variant={selectedFilter === type.type ? 'inverse' : 'secondary'}
                  weight="medium"
                >
                  {type.name}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 자산 목록 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">내 자산</ThemedText>
            <ThemedText type="caption" variant="tertiary">
              {getFilteredAssets().length}개
            </ThemedText>
          </View>
          
          {getFilteredAssets().length > 0 ? (
            getFilteredAssets().map((asset) => {
              const assetType = assetTypes.find(type => type.type === asset.assetType);
              return (
                <ThemedCard
                  key={asset.id}
                  variant="default"
                  style={styles.assetCard}
                  onPress={() => setSelectedAsset(asset)}
                >
                  <View style={styles.assetCardContent}>
                    <View style={[styles.iconContainer, { backgroundColor: (assetType?.color || colors.primary) + '20' }]}>
                      <Ionicons 
                        name={assetType?.icon as any || 'card'} 
                        size={20} 
                        color={assetType?.color || colors.primary} 
                      />
                    </View>
                    
                    <View style={styles.assetInfo}>
                      <ThemedText type="body" weight="medium">
                        {asset.name}
                      </ThemedText>
                      <ThemedText type="caption" variant="tertiary">
                        {assetType?.name} {asset.description && `• ${asset.description}`}
                      </ThemedText>
                    </View>
                    
                    <View style={styles.assetAmount}>
                      <ThemedText type="body" weight="semibold">
                        ₩{formatAmount(asset.balance)}
                      </ThemedText>
                      {asset.monthlyChange !== undefined && (
                        <ThemedText 
                          type="caption" 
                          variant={asset.monthlyChange >= 0 ? 'success' : 'error'}
                        >
                          {asset.monthlyChange >= 0 ? '+' : ''}{formatAmount(Math.abs(asset.monthlyChange))}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                </ThemedCard>
              );
            })
          ) : (
            <ThemedCard variant="outlined" style={styles.emptyCard}>
              <Ionicons name="wallet-outline" size={48} color={colors.textTertiary} />
              <ThemedText type="body" variant="tertiary" style={{ marginTop: 12 }}>
                등록된 자산이 없습니다
              </ThemedText>
              <ThemedButton
                variant="primary"
                size="medium"
                style={{ marginTop: 16 }}
                onPress={handleAddAsset}
              >
                첫 자산 등록하기
              </ThemedButton>
            </ThemedCard>
          )}
        </View>
      </ScrollView>

      {/* 자산 상세 모달 */}
      <AssetDetailModal
        visible={!!selectedAsset}
        asset={selectedAsset}
        assetType={selectedAsset ? assetTypes.find(type => type.type === selectedAsset.assetType) : null}
        recentTransactions={selectedAsset ? getAssetTransactions(selectedAsset.id) : []}
        onClose={() => setSelectedAsset(null)}
        onEdit={handleEditAsset}
        onDelete={handleDeleteAsset}
        formatAmount={formatAmount}
        formatDate={formatDate}
      />
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
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 16,
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
    gap: 24,
  },
  statItem: {
    gap: 4,
  },
  assetTypesSummary: {
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  assetTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
  },
  assetTypeIcon: {
    marginRight: 12,
  },
  assetTypeInfo: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipActive: {
    borderWidth: 0,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  assetCard: {
    marginBottom: 12,
  },
  assetCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assetInfo: {
    flex: 1,
  },
  assetAmount: {
    alignItems: 'flex-end',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
});