import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function AssetScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {/* 총 자산 카드 */}
          <View style={[styles.totalAssetCard, { backgroundColor: colors.card }]}>
            <View style={styles.totalAssetHeader}>
              <ThemedText type="subtitle">총 자산</ThemedText>
              <Ionicons name="wallet" size={24} color={colors.tint} />
            </View>
            <ThemedText type="title" style={styles.totalAssetAmount}>
              ₩15,250,000
            </ThemedText>
            <View style={styles.assetChange}>
              <Ionicons name="trending-up" size={16} color="#4CAF50" />
              <ThemedText style={[styles.changeText, { color: '#4CAF50' }]}>
                +₩250,000 이번 달
              </ThemedText>
            </View>
          </View>

          {/* 자산 카테고리 */}
          <View style={styles.assetCategories}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>자산 분류</ThemedText>
            
            <View style={[styles.assetCard, { backgroundColor: colors.card }]}>
              <View style={styles.assetHeader}>
                <View style={styles.assetIcon}>
                  <Ionicons name="card" size={24} color="#007AFF" />
                </View>
                <View style={styles.assetInfo}>
                  <ThemedText type="defaultSemiBold">현금/예금</ThemedText>
                  <ThemedText style={styles.assetPercent}>45.2%</ThemedText>
                </View>
                <ThemedText type="defaultSemiBold">₩6,900,000</ThemedText>
              </View>
            </View>

            <View style={[styles.assetCard, { backgroundColor: colors.card }]}>
              <View style={styles.assetHeader}>
                <View style={styles.assetIcon}>
                  <Ionicons name="trending-up" size={24} color="#4CAF50" />
                </View>
                <View style={styles.assetInfo}>
                  <ThemedText type="defaultSemiBold">투자 자산</ThemedText>
                  <ThemedText style={styles.assetPercent}>32.8%</ThemedText>
                </View>
                <ThemedText type="defaultSemiBold">₩5,000,000</ThemedText>
              </View>
            </View>

            <View style={[styles.assetCard, { backgroundColor: colors.card }]}>
              <View style={styles.assetHeader}>
                <View style={styles.assetIcon}>
                  <Ionicons name="home" size={24} color="#FF9500" />
                </View>
                <View style={styles.assetInfo}>
                  <ThemedText type="defaultSemiBold">부동산</ThemedText>
                  <ThemedText style={styles.assetPercent}>18.4%</ThemedText>
                </View>
                <ThemedText type="defaultSemiBold">₩2,800,000</ThemedText>
              </View>
            </View>

            <View style={[styles.assetCard, { backgroundColor: colors.card }]}>
              <View style={styles.assetHeader}>
                <View style={styles.assetIcon}>
                  <Ionicons name="diamond" size={24} color="#5856D6" />
                </View>
                <View style={styles.assetInfo}>
                  <ThemedText type="defaultSemiBold">기타 자산</ThemedText>
                  <ThemedText style={styles.assetPercent}>3.6%</ThemedText>
                </View>
                <ThemedText type="defaultSemiBold">₩550,000</ThemedText>
              </View>
            </View>
          </View>

          {/* 빠른 액션 */}
          <View style={styles.quickActions}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>빠른 액션</ThemedText>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
                <Ionicons name="add-circle" size={32} color={colors.tint} />
                <ThemedText type="defaultSemiBold">자산 추가</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
                <Ionicons name="analytics" size={32} color={colors.tint} />
                <ThemedText type="defaultSemiBold">자산 분석</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]}>
                <Ionicons name="settings" size={32} color={colors.tint} />
                <ThemedText type="defaultSemiBold">설정</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
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
  assetCategories: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
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
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
}); 