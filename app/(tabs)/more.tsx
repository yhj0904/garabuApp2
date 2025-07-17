import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, RefreshControl, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/stores/authStore';

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  // 새로고침 핸들러
  const onRefresh = async () => {
    try {
      // 햅틱 피드백
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      setRefreshing(true);
      
      // 설정 데이터 새로고침 로직 (추후 필요시 구현)
      // 현재는 시뮬레이션을 위해 setTimeout 사용
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const menuItems = [
    {
      icon: 'person-circle',
      title: '프로필',
      subtitle: '개인정보 관리',
      onPress: () => router.push('/(modals)/profile'),
    },
    {
      icon: 'book',
      title: '가계부 선택',
      subtitle: '가계부 변경',
      onPress: () => router.push('/(modals)/select-book'),
    },
    {
      icon: 'add-circle',
      title: '가계부 추가',
      subtitle: '새 가계부 생성',
      onPress: () => router.push('/(modals)/add-book'),
    },
    {
      icon: 'pricetag',
      title: '카테고리 추가',
      subtitle: '새 카테고리 생성',
      onPress: () => router.push('/(modals)/add-category'),
    },
    {
      icon: 'list',
      title: '카테고리 관리',
      subtitle: '카테고리 수정 및 삭제',
      onPress: () => router.push('/(modals)/manage-categories'),
    },
    {
      icon: 'notifications',
      title: '알림 설정',
      subtitle: '알림 관리',
      onPress: () => router.push('/(modals)/notifications'),
    },
    {
      icon: 'flask',
      title: '알림 테스트',
      subtitle: '푸시 알림 테스트',
      onPress: () => router.push('/(modals)/notification-test'),
    },
    {
      icon: 'settings',
      title: '앱 설정',
      subtitle: '앱 환경설정',
      onPress: () => router.push('/(modals)/settings'),
    },
    {
      icon: 'help-circle',
      title: '도움말',
      subtitle: '사용법 안내',
      onPress: () => router.push('/(modals)/help'),
    },
    {
      icon: 'information-circle',
      title: '정보',
      subtitle: '앱 정보 및 라이선스',
      onPress: () => router.push('/(modals)/about'),
    },
  ];

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
          {/* 사용자 프로필 카드 */}
          <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
            <View style={styles.profileHeader}>
              <View style={styles.profileIcon}>
                <Ionicons name="person" size={32} color={colors.tint} />
              </View>
              <View style={styles.profileInfo}>
                <ThemedText type="subtitle">{user?.username || '사용자'}</ThemedText>
                <ThemedText style={styles.profileEmail}>{user?.email || 'user@example.com'}</ThemedText>
              </View>
              <TouchableOpacity onPress={() => router.push('/(modals)/profile')}>
                <Ionicons name="chevron-forward" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 메뉴 항목들 */}
          <View style={styles.menuSection}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { backgroundColor: colors.card }]}
                onPress={item.onPress}
              >
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon as any} size={24} color={colors.tint} />
                </View>
                <View style={styles.menuContent}>
                  <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                  <ThemedText style={styles.menuSubtitle}>{item.subtitle}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.icon} />
              </TouchableOpacity>
            ))}
          </View>

          {/* 로그아웃 버튼 */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="white" />
            <ThemedText style={styles.logoutButtonText}>로그아웃</ThemedText>
          </TouchableOpacity>

          {/* 앱 버전 정보 */}
          <View style={styles.versionInfo}>
            <ThemedText style={styles.versionText}>Garabu v1.0.0</ThemedText>
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
  profileCard: {
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  menuSection: {
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#8E8E93',
  },
}); 