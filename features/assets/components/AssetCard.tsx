import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedCard } from '@/components/ThemedCard';
import { useTheme } from '@/contexts/ThemeContext';

interface AssetCardProps {
  asset: any;
  assetType: any;
  onPress: () => void;
  formatAmount: (amount: number) => string;
}

export default function AssetCard({ asset, assetType, onPress, formatAmount }: AssetCardProps) {
  const { colors } = useTheme();
  
  const getChangeIcon = (change: number) => {
    if (change > 0) return 'trending-up';
    if (change < 0) return 'trending-down';
    return 'remove';
  };
  
  const getChangeColor = (change: number) => {
    if (change > 0) return colors.success;
    if (change < 0) return colors.error;
    return colors.textSecondary;
  };
  
  return (
    <ThemedCard 
      variant="default"
      style={styles.assetCard}
      onPress={onPress}
    >
      <View style={styles.assetCardContent}>
        <View style={[styles.assetIcon, { backgroundColor: assetType?.color || colors.primary }]}>
          <Ionicons name={assetType?.icon as any || 'card'} size={24} color={colors.textInverse} />
        </View>
        
        <View style={styles.assetInfo}>
          <ThemedText type="body" weight="medium">
            {asset.name}
          </ThemedText>
          <View style={styles.assetDetails}>
            <ThemedText type="caption" variant="secondary">
              {assetType?.name}
            </ThemedText>
            {asset.description && (
              <>
                <ThemedText type="caption" variant="tertiary"> • </ThemedText>
                <ThemedText type="caption" variant="tertiary">
                  {asset.description}
                </ThemedText>
              </>
            )}
          </View>
        </View>
        
        <View style={styles.assetAmount}>
          <ThemedText type="body" weight="semibold">
            ₩{formatAmount(asset.balance)}
          </ThemedText>
          {asset.monthlyChange !== undefined && (
            <View style={styles.changeContainer}>
              <Ionicons 
                name={getChangeIcon(asset.monthlyChange) as any} 
                size={12} 
                color={getChangeColor(asset.monthlyChange)} 
              />
              <ThemedText 
                type="caption" 
                variant={asset.monthlyChange >= 0 ? 'success' : 'error'}
                style={{ marginLeft: 2 }}
              >
                {asset.monthlyChange >= 0 ? '+' : ''}{formatAmount(Math.abs(asset.monthlyChange))}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </ThemedCard>
  );
}

const styles = StyleSheet.create({
  assetCard: {
    marginBottom: 12,
  },
  assetCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assetInfo: {
    flex: 1,
  },
  assetDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  assetAmount: {
    alignItems: 'flex-end',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
});