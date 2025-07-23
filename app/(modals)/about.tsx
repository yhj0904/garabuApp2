import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/contexts/ThemeContext';

export default function AboutModal() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();

  const appInfo = {
    name: 'Garabu',
    version: '1.0.0',
    description: '당신의 일상을 더 스마트하게',
    developer: 'Garabu Team',
    email: 'ujk6073@gmail.com',
  };

  const infoItems = [
    {
      icon: 'document-text',
      title: '개인정보 처리방침',
      onPress: () => {},
    },
    {
      icon: 'shield-checkmark',
      title: '이용약관',
      onPress: () => {},
    },
    {
      icon: 'heart',
      title: '개발자 정보',
      onPress: () => {},
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
            <ThemedText type="subtitle">정보</ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* 앱 정보 */}
          <View style={[styles.appInfoSection, { backgroundColor: colors.card }]}>
            <View style={[styles.appLogo, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <Ionicons name="wallet" size={48} color={colors.primary} />
            </View>
            <ThemedText type="title" style={styles.appName}>{appInfo.name}</ThemedText>
            <ThemedText style={[styles.appVersion, { color: colors.textSecondary }]}>버전 {appInfo.version}</ThemedText>
            <ThemedText style={[styles.appDescription, { color: colors.textSecondary }]}>{appInfo.description}</ThemedText>
          </View>

          {/* 정보 항목들 */}
          <View style={styles.section}>
            {infoItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.infoItem, { backgroundColor: colors.card }]}
                onPress={item.onPress}
              >
                <View style={[styles.infoIcon, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
                  <Ionicons name={item.icon as any} size={24} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* 연락처 */}
          <View style={[styles.contactSection, { backgroundColor: colors.card }]}>
            <ThemedText type="subtitle" style={styles.contactTitle}>연락처</ThemedText>
            <View style={styles.contactItem}>
              <Ionicons name="mail" size={20} color={colors.textTertiary} />
              <ThemedText style={[styles.contactText, { color: colors.textSecondary }]}>{appInfo.email}</ThemedText>
            </View>
          </View>

          {/* 저작권 */}
          <View style={styles.copyrightSection}>
            <ThemedText style={[styles.copyrightText, { color: colors.textTertiary }]}>
              © 2024 {appInfo.name}. All rights reserved.
            </ThemedText>
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
  appInfoSection: {
    alignItems: 'center',
    padding: 32,
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
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    gap: 8,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  contactSection: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  contactTitle: {
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 16,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  copyrightText: {
    fontSize: 12,
    textAlign: 'center',
  },
});