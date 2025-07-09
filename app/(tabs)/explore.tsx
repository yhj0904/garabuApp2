import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const tabs = ['통계', '예산', '내역'];
const types = ['수입', '지출'];

export default function ExploreScreen() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedType, setSelectedType] = useState(1); // 기본: 지출
  const [month, setMonth] = useState('2025년 7월');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {/* 상단 월 선택 */}
          <View style={styles.monthRow}>
            <TouchableOpacity style={styles.arrowButton}>
              <Ionicons name="chevron-back" size={24} color={colors.icon} />
            </TouchableOpacity>
            <ThemedText type="subtitle" style={styles.month}>{month}</ThemedText>
            <TouchableOpacity style={styles.arrowButton}>
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
                    <Ionicons name="trending-up" size={24} color="#4CAF50" />
                    <ThemedText type="subtitle">이번 달 총 지출</ThemedText>
                  </View>
                  <ThemedText type="title" style={styles.statAmount}>₩1,250,000</ThemedText>
                  <ThemedText style={[styles.statChange, { color: '#4CAF50' }]}>
                    지난 달 대비 +12%
                  </ThemedText>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={styles.statHeader}>
                    <Ionicons name="trending-down" size={24} color="#FF3B30" />
                    <ThemedText type="subtitle">이번 달 총 수입</ThemedText>
                  </View>
                  <ThemedText type="title" style={styles.statAmount}>₩3,500,000</ThemedText>
                  <ThemedText style={[styles.statChange, { color: '#FF3B30' }]}>
                    지난 달 대비 -5%
                  </ThemedText>
                </View>

                <View style={[styles.categoryCard, { backgroundColor: colors.card }]}>
                  <ThemedText type="subtitle" style={styles.categoryTitle}>카테고리별 지출</ThemedText>
                  <View style={styles.categoryItem}>
                    <View style={styles.categoryIcon}>
                      <Ionicons name="restaurant" size={20} color="#FF9500" />
                    </View>
                    <View style={styles.categoryInfo}>
                      <ThemedText type="defaultSemiBold">식비</ThemedText>
                      <ThemedText style={styles.categoryPercent}>35%</ThemedText>
                    </View>
                    <ThemedText type="defaultSemiBold">₩437,500</ThemedText>
                  </View>
                  <View style={styles.categoryItem}>
                    <View style={styles.categoryIcon}>
                      <Ionicons name="car" size={20} color="#5856D6" />
                    </View>
                    <View style={styles.categoryInfo}>
                      <ThemedText type="defaultSemiBold">교통비</ThemedText>
                      <ThemedText style={styles.categoryPercent}>25%</ThemedText>
                    </View>
                    <ThemedText type="defaultSemiBold">₩312,500</ThemedText>
                  </View>
                  <View style={styles.categoryItem}>
                    <View style={styles.categoryIcon}>
                      <Ionicons name="home" size={20} color="#34C759" />
                    </View>
                    <View style={styles.categoryInfo}>
                      <ThemedText type="defaultSemiBold">주거비</ThemedText>
                      <ThemedText style={styles.categoryPercent}>20%</ThemedText>
                    </View>
                    <ThemedText type="defaultSemiBold">₩250,000</ThemedText>
                  </View>
                </View>
              </View>
            )}

            {selectedTab === 1 && (
              <View style={styles.budgetContainer}>
                <View style={[styles.budgetCard, { backgroundColor: colors.card }]}>
                  <ThemedText type="subtitle">이번 달 예산</ThemedText>
                  <ThemedText type="title" style={styles.budgetAmount}>₩2,000,000</ThemedText>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '62.5%', backgroundColor: '#FF3B30' }]} />
                  </View>
                  <ThemedText style={styles.budgetStatus}>62.5% 사용됨 (₩1,250,000)</ThemedText>
                </View>
              </View>
            )}

            {selectedTab === 2 && (
              <View style={styles.historyContainer}>
                <ThemedText style={styles.emptyText}>거래 내역이 없습니다.</ThemedText>
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
  historyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { 
    color: '#bbb', 
    fontSize: 16,
  },
}); 