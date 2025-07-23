import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/contexts/ThemeContext';

export default function HelpModal() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();

  const helpItems = [
    {
      icon: 'add-circle',
      title: '수입/지출 추가하기',
      description: '홈 화면에서 + 버튼을 눌러 새로운 거래를 추가할 수 있습니다.',
    },
    {
      icon: 'stats-chart',
      title: '통계 보기',
      description: '통계 탭에서 월별, 카테고리별 지출 분석을 확인할 수 있습니다.',
    },
    {
      icon: 'card',
      title: '자산 관리',
      description: '자산 탭에서 계좌와 카드 정보를 관리할 수 있습니다.',
    },
    {
      icon: 'settings',
      title: '설정 변경',
      description: '더보기 탭에서 프로필, 알림, 앱 설정을 변경할 수 있습니다.',
    },
  ];

  return (
    <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="subtitle">도움말</ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* 도움말 내용 */}
          <View style={styles.section}>
            {helpItems.map((item, index) => (
              <View key={index} style={[styles.helpItem, { backgroundColor: colors.card }]}>
                <View style={[styles.helpIcon, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
                  <Ionicons name={item.icon as any} size={24} color={colors.primary} />
                </View>
                <View style={styles.helpContent}>
                  <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                  <ThemedText style={[styles.helpDescription, { color: colors.textSecondary }]}>{item.description}</ThemedText>
                </View>
              </View>
            ))}
          </View>

          {/* 문의하기 */}
          <View style={[styles.contactSection, { backgroundColor: colors.card }]}>
            <ThemedText type="subtitle" style={styles.contactTitle}>추가 도움이 필요하신가요?</ThemedText>
            <ThemedText style={[styles.contactDescription, { color: colors.textSecondary }]}>
              앱 사용 중 궁금한 점이 있으시면 언제든 문의해주세요.
            </ThemedText>
            <TouchableOpacity style={[styles.contactButton, { backgroundColor: colors.primary }]}>
              <Ionicons name="mail" size={20} color="white" />
              <ThemedText style={styles.contactButtonText}>문의하기</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  section: {
    gap: 16,
    marginBottom: 24,
  },
  helpItem: {
    flexDirection: 'row',
    padding: 16,
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
  helpIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  helpContent: {
    flex: 1,
  },
  helpDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  contactSection: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  contactTitle: {
    marginBottom: 8,
  },
  contactDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});