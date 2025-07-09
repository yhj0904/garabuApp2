import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function SettingsModal() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="subtitle">앱 설정</ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* 설정 */}
          <View style={styles.section}>
            <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <ThemedText type="defaultSemiBold">다크 모드</ThemedText>
                  <ThemedText style={styles.settingDescription}>어두운 테마 사용</ThemedText>
                </View>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#767577', true: colors.tint }}
                thumbColor={darkMode ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="finger-print" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <ThemedText type="defaultSemiBold">생체 인증</ThemedText>
                  <ThemedText style={styles.settingDescription}>지문 또는 Face ID 사용</ThemedText>
                </View>
              </View>
              <Switch
                value={biometricAuth}
                onValueChange={setBiometricAuth}
                trackColor={{ false: '#767577', true: colors.tint }}
                thumbColor={biometricAuth ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="cloud-upload" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <ThemedText type="defaultSemiBold">자동 백업</ThemedText>
                  <ThemedText style={styles.settingDescription}>데이터 자동 백업</ThemedText>
                </View>
              </View>
              <Switch
                value={autoBackup}
                onValueChange={setAutoBackup}
                trackColor={{ false: '#767577', true: colors.tint }}
                thumbColor={autoBackup ? '#f4f3f4' : '#f4f3f4'}
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