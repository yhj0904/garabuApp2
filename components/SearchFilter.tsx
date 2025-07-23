import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedCard } from '@/components/ThemedCard';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { useTheme } from '@/contexts/ThemeContext';
import { Category, PaymentMethod } from '@/core/api/client';

interface SearchFilterProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: SearchFilters) => void;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  currentFilters?: SearchFilters;
}

export interface SearchFilters {
  startDate?: string;
  endDate?: string;
  amountType?: 'INCOME' | 'EXPENSE';
  category?: string;
  payment?: string;
  description?: string;
}

const getAmountTypeOptions = (colors: any) => [
  { value: 'INCOME', label: '수입', color: colors.income, icon: 'add-circle' },
  { value: 'EXPENSE', label: '지출', color: colors.expense, icon: 'remove-circle' },
] as const;

export default function SearchFilter({ 
  visible, 
  onClose, 
  onApply, 
  categories, 
  paymentMethods, 
  currentFilters 
}: SearchFilterProps) {
  const { colors, isDarkMode } = useTheme();
  const [filters, setFilters] = useState<SearchFilters>(currentFilters || {});
  const AmountTypeOptions = getAmountTypeOptions(colors);

  // 모달이 열릴 때마다 현재 필터로 초기화
  useEffect(() => {
    if (visible) {
      setFilters(currentFilters || {});
    }
  }, [visible, currentFilters]);

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    // YYYY-MM-DD 형식으로 변환
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (type: 'startDate' | 'endDate', value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: value || undefined
    }));
  };

  const handleAmountTypeChange = (amountType: 'INCOME' | 'EXPENSE') => {
    setFilters(prev => ({
      ...prev,
      amountType: prev.amountType === amountType ? undefined : amountType
    }));
  };

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category === category ? undefined : category
    }));
  };

  const handlePaymentChange = (payment: string) => {
    setFilters(prev => ({
      ...prev,
      payment: prev.payment === payment ? undefined : payment
    }));
  };

  const handleReset = () => {
    setFilters({});
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== undefined && value !== '').length;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* 헤더 */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <ThemedText type="title">검색 필터</ThemedText>
            {getActiveFiltersCount() > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                <ThemedText type="caption" variant="inverse" weight="medium">
                  {getActiveFiltersCount()}
                </ThemedText>
              </View>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleReset}
              style={[styles.resetButton, { backgroundColor: colors.backgroundSecondary }]}
            >
              <ThemedText type="body" variant="secondary">초기화</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 기간 필터 */}
          <ThemedCard variant="default" style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <ThemedText type="subtitle" weight="semibold" style={styles.filterTitle}>
                기간
              </ThemedText>
            </View>
            
            <View style={styles.dateInputContainer}>
              <View style={styles.dateInputWrapper}>
                <ThemedText type="body" variant="secondary" style={styles.dateLabel}>
                  시작일
                </ThemedText>
                <ThemedInput
                  placeholder="YYYY-MM-DD"
                  value={formatDateForInput(filters.startDate)}
                  onChangeText={(value) => handleDateChange('startDate', value)}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.dateSeparator}>
                <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
              </View>
              
              <View style={styles.dateInputWrapper}>
                <ThemedText type="body" variant="secondary" style={styles.dateLabel}>
                  종료일
                </ThemedText>
                <ThemedInput
                  placeholder="YYYY-MM-DD"
                  value={formatDateForInput(filters.endDate)}
                  onChangeText={(value) => handleDateChange('endDate', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ThemedCard>

          {/* 거래 유형 필터 */}
          <ThemedCard variant="default" style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="swap-horizontal-outline" size={20} color={colors.primary} />
              <ThemedText type="subtitle" weight="semibold" style={styles.filterTitle}>
                거래 유형
              </ThemedText>
            </View>
            
            <View style={styles.optionGrid}>
              {AmountTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: filters.amountType === option.value 
                        ? option.color + '20' 
                        : colors.backgroundSecondary,
                      borderColor: filters.amountType === option.value 
                        ? option.color 
                        : colors.border,
                    }
                  ]}
                  onPress={() => handleAmountTypeChange(option.value)}
                >
                  <Ionicons 
                    name={option.icon as any} 
                    size={20} 
                    color={filters.amountType === option.value ? option.color : colors.textSecondary} 
                  />
                  <ThemedText 
                    type="body" 
                    weight="medium"
                    variant={filters.amountType === option.value ? 'default' : 'secondary'}
                    style={{ color: filters.amountType === option.value ? option.color : undefined }}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedCard>

          {/* 카테고리 필터 */}
          {categories.length > 0 && (
            <ThemedCard variant="default" style={styles.filterCard}>
              <View style={styles.filterHeader}>
                <Ionicons name="folder-outline" size={20} color={colors.primary} />
                <ThemedText type="subtitle" weight="semibold" style={styles.filterTitle}>
                  카테고리
                </ThemedText>
              </View>
              
              <View style={styles.optionGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: filters.category === category.category 
                          ? colors.primary + '20' 
                          : colors.backgroundSecondary,
                        borderColor: filters.category === category.category 
                          ? colors.primary 
                          : colors.border,
                      }
                    ]}
                    onPress={() => handleCategoryChange(category.category)}
                  >
                    <ThemedText 
                      type="body" 
                      weight="medium"
                      variant={filters.category === category.category ? 'primary' : 'secondary'}
                    >
                      {category.emoji || '📁'} {category.category}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </ThemedCard>
          )}

          {/* 결제 수단 필터 */}
          {paymentMethods.length > 0 && (
            <ThemedCard variant="default" style={styles.filterCard}>
              <View style={styles.filterHeader}>
                <Ionicons name="card-outline" size={20} color={colors.primary} />
                <ThemedText type="subtitle" weight="semibold" style={styles.filterTitle}>
                  결제 수단
                </ThemedText>
              </View>
              
              <View style={styles.optionGrid}>
                {paymentMethods.map((payment) => (
                  <TouchableOpacity
                    key={payment.id}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: filters.payment === payment.payment 
                          ? colors.primary + '20' 
                          : colors.backgroundSecondary,
                        borderColor: filters.payment === payment.payment 
                          ? colors.primary 
                          : colors.border,
                      }
                    ]}
                    onPress={() => handlePaymentChange(payment.payment)}
                  >
                    <ThemedText 
                      type="body" 
                      weight="medium"
                      variant={filters.payment === payment.payment ? 'primary' : 'secondary'}
                    >
                      💳 {payment.payment}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </ThemedCard>
          )}

          {/* 설명 검색 */}
          <ThemedCard variant="default" style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="search-outline" size={20} color={colors.primary} />
              <ThemedText type="subtitle" weight="semibold" style={styles.filterTitle}>
                설명 검색
              </ThemedText>
            </View>
            
            <ThemedInput
              placeholder="거래 설명을 입력하세요..."
              value={filters.description || ''}
              onChangeText={(value) => setFilters(prev => ({ 
                ...prev, 
                description: value || undefined 
              }))}
              leftIcon="search"
              rightIcon={filters.description ? "close" : undefined}
              onRightIconPress={filters.description ? () => setFilters(prev => ({ 
                ...prev, 
                description: undefined 
              })) : undefined}
            />
          </ThemedCard>
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <ThemedButton
            variant="primary"
            onPress={handleApply}
            style={styles.applyButton}
          >
            필터 적용 {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()}개)`}
          </ThemedButton>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterCard: {
    marginTop: 20,
    padding: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterTitle: {
    marginLeft: 8,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateLabel: {
    marginBottom: 8,
  },
  dateSeparator: {
    paddingTop: 24,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  applyButton: {
    width: '100%',
  },
});