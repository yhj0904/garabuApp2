import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { colors, isDarkMode, themeMode, setThemeMode } = useTheme();
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

  // 테마 모드 변경 핸들러
  const handleThemeModeChange = async (mode: 'light' | 'dark' | 'system') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemeMode(mode);
  };

  const menuItems = [
    {
      icon: 'people-circle',
      title: '친구 관리',
      subtitle: '친구 목록 및 요청',
      onPress: () => router.push('/friends'),
    },
    {
      icon: 'book',
      title: '가계부 선택',
      subtitle: '가계부 변경',
      onPress: () => router.push('/(modals)/select-book'),
    },
    {
      icon: 'share-social',
      title: '가계부 공유',
      subtitle: '멤버 초대 및 관리',
      onPress: () => router.push('/(modals)/book-sharing'),
    },
    {
      icon: 'flag',
      title: '목표 관리',
      subtitle: '재정 목표 설정 및 추적',
      onPress: () => router.push('/(modals)/goals'),
    },
    {
      icon: 'repeat',
      title: '반복 거래',
      subtitle: '정기적인 수입/지출 관리',
      onPress: () => router.push('/(modals)/recurring-transactions'),
    },
    {
      icon: 'pricetags',
      title: '태그 관리',
      subtitle: '거래 태그 추가 및 관리',
      onPress: () => router.push('/(modals)/tags'),
    },
    {
      icon: 'cash',
      title: '통화 설정',
      subtitle: '다중 통화 및 환율 관리',
      onPress: () => router.push('/(modals)/currencies'),
    },
    {
      icon: 'list',
      title: '카테고리 관리',
      subtitle: '카테고리 추가, 수정 및 삭제',
      onPress: () => router.push('/(modals)/manage-categories'),
    },
    {
      icon: 'notifications',
      title: '알림 설정',
      subtitle: '알림 관리',
      onPress: () => router.push('/(modals)/notification-settings'),
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
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
          <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.profileIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="person" size={32} color={colors.tint} />
              </View>
              <View style={styles.profileInfo}>
                <ThemedText type="subtitle">{user?.username || '사용자'}</ThemedText>
                <ThemedText style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email || 'user@example.com'}</ThemedText>
              </View>
              <TouchableOpacity onPress={() => router.push('/(modals)/profile')}>
                <Ionicons name="chevron-forward" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 다크모드 설정 카드 */}
          <View style={[styles.themeCard, { backgroundColor: colors.surface }]}>
            <View style={styles.themeHeader}>
              <Ionicons name="moon" size={24} color={colors.primary} />
              <ThemedText type="subtitle" style={styles.themeTitle}>테마 설정</ThemedText>
            </View>
            
            <View style={styles.themeOptions}>
              <TouchableOpacity 
                style={[
                  styles.themeOption, 
                  { backgroundColor: themeMode === 'light' ? colors.primaryLight + '20' : colors.backgroundSecondary },
                  { borderColor: themeMode === 'light' ? colors.primary : colors.border }
                ]}
                onPress={() => handleThemeModeChange('light')}
              >
                <Ionicons name="sunny" size={20} color={themeMode === 'light' ? colors.primary : colors.textSecondary} />
                <ThemedText style={[
                  styles.themeOptionText,
                  { color: themeMode === 'light' ? colors.primary : colors.textSecondary }
                ]}>라이트</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.themeOption, 
                  { backgroundColor: themeMode === 'dark' ? colors.primaryLight + '20' : colors.backgroundSecondary },
                  { borderColor: themeMode === 'dark' ? colors.primary : colors.border }
                ]}
                onPress={() => handleThemeModeChange('dark')}
              >
                <Ionicons name="moon" size={20} color={themeMode === 'dark' ? colors.primary : colors.textSecondary} />
                <ThemedText style={[
                  styles.themeOptionText,
                  { color: themeMode === 'dark' ? colors.primary : colors.textSecondary }
                ]}>다크</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.themeOption, 
                  { backgroundColor: themeMode === 'system' ? colors.primaryLight + '20' : colors.backgroundSecondary },
                  { borderColor: themeMode === 'system' ? colors.primary : colors.border }
                ]}
                onPress={() => handleThemeModeChange('system')}
              >
                <Ionicons name="phone-portrait" size={20} color={themeMode === 'system' ? colors.primary : colors.textSecondary} />
                <ThemedText style={[
                  styles.themeOptionText,
                  { color: themeMode === 'system' ? colors.primary : colors.textSecondary }
                ]}>시스템</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* 메뉴 항목들 */}
          <View style={styles.menuSection}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { backgroundColor: colors.surface }]}
                onPress={item.onPress}
              >
                <View style={[styles.menuIcon, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name={item.icon as any} size={24} color={colors.tint} />
                </View>
                <View style={styles.menuContent}>
                  <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                  <ThemedText style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</ThemedText>
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
            <ThemedText style={[styles.versionText, { color: colors.textSecondary }]}>Garabu v1.0.0</ThemedText>
          </View>
        </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileEmail: {
    fontSize: 14,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuSubtitle: {
    fontSize: 14,
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
  },
  themeCard: {
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
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  themeTitle: {
    marginLeft: 12,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  themeOptionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
}); 