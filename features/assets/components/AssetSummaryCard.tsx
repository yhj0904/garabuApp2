import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedCard } from '@/components/ThemedCard';

interface AssetSummaryCardProps {
  totalAssets: number;
  monthlyChange: number;
  changePercentage: number;
  formatAmount: (amount: number) => string;
}

export default function AssetSummaryCard({ 
  totalAssets, 
  monthlyChange, 
  changePercentage, 
  formatAmount 
}: AssetSummaryCardProps) {
  return (
    <ThemedCard variant="elevated" style={styles.summaryCard}>
      <ThemedText type="subtitle" variant="secondary" style={styles.summaryTitle}>
        총 자산
      </ThemedText>
      <ThemedText type="title" weight="bold" style={styles.totalAmount}>
        ₩{formatAmount(totalAssets)}
      </ThemedText>
      <View style={styles.changeInfo}>
        <ThemedText 
          type="body" 
          variant={monthlyChange >= 0 ? 'success' : 'error'}
        >
          {monthlyChange >= 0 ? '▲' : '▼'} ₩{formatAmount(Math.abs(monthlyChange))}
        </ThemedText>
        <ThemedText 
          type="caption" 
          variant={monthlyChange >= 0 ? 'success' : 'error'}
          style={{ marginLeft: 8 }}
        >
          ({changePercentage >= 0 ? '+' : ''}{changePercentage.toFixed(1)}%)
        </ThemedText>
      </View>
      <ThemedText type="caption" variant="tertiary" style={styles.periodText}>
        이번 달 변화
      </ThemedText>
    </ThemedCard>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    marginHorizontal: 20,
    marginVertical: 16,
  },
  summaryTitle: {
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    marginBottom: 12,
  },
  changeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  periodText: {
    marginTop: 4,
  },
});