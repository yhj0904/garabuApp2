import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function NotificationsModal() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="subtitle">알림 설정</ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* 알림 설정 */}
          <View style={styles.section}>
            <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <ThemedText type="defaultSemiBold">푸시 알림</ThemedText>
                  <ThemedText style={styles.settingDescription}>앱 푸시 알림을 받습니다</ThemedText>
                </View>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#767577', true: colors.tint }}
                thumbColor={pushNotifications ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="mail" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <ThemedText type="defaultSemiBold">이메일 알림</ThemedText>
                  <ThemedText style={styles.settingDescription}>이메일로 알림을 받습니다</ThemedText>
                </View>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#767577', true: colors.tint }}
                thumbColor={emailNotifications ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="card" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <ThemedText type="defaultSemiBold">거래 알림</ThemedText>
                  <ThemedText style={styles.settingDescription}>새로운 거래 내역 알림</ThemedText>
                </View>
              </View>
              <Switch
                value={transactionAlerts}
                onValueChange={setTransactionAlerts}
                trackColor={{ false: '#767577', true: colors.tint }}
                thumbColor={transactionAlerts ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="warning" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <ThemedText type="defaultSemiBold">예산 경고</ThemedText>
                  <ThemedText style={styles.settingDescription}>예산 초과 시 알림</ThemedText>
                </View>
              </View>
              <Switch
                value={budgetAlerts}
                onValueChange={setBudgetAlerts}
                trackColor={{ false: '#767577', true: colors.tint }}
                thumbColor={budgetAlerts ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>
          </View>
        </ScrollView>
      </ThemedView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  section: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
}); 