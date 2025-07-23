import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AppSettingsScreen() {
  const { colors, isDarkMode } = useTheme();
  
  // 앱 설정 상태
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const handleClearCache = async () => {
    Alert.alert(
      '캐시 삭제',
      '앱의 캐시 데이터를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              // 캐시 관련 AsyncStorage 키들 삭제
              const keys = await AsyncStorage.getAllKeys();
              const cacheKeys = keys.filter(key => key.includes('cache_'));
              await AsyncStorage.multiRemove(cacheKeys);
              
              Alert.alert('완료', '캐시가 삭제되었습니다.');
            } catch (error) {
              Alert.alert('오류', '캐시 삭제 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('데이터 내보내기', '이 기능은 준비 중입니다.');
  };

  const handleImportData = () => {
    Alert.alert('데이터 가져오기', '이 기능은 준비 중입니다.');
  };

  const handleResetSettings = () => {
    Alert.alert(
      '설정 초기화',
      '모든 앱 설정을 초기값으로 되돌리시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: () => {
            // 설정 초기화
            setBiometricEnabled(false);
            setAutoSaveEnabled(true);
            setAnalyticsEnabled(true);
            setSoundEnabled(true);
            setVibrationEnabled(true);
            Alert.alert('완료', '설정이 초기화되었습니다.');
          },
        },
      ]
    );
  };

  const SettingRow = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    showSwitch = true,
    onPress 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    showSwitch?: boolean;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.settingRow, { backgroundColor: colors.surface }]}
      onPress={onPress}
      disabled={showSwitch && !onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {showSwitch ? (
        <Switch
          value={value}
          onValueChange={async (newValue) => {
            if (onValueChange) {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onValueChange(newValue);
            }
          }}
          trackColor={{ false: colors.border, true: colors.primary + '60' }}
          thumbColor={value ? colors.primary : '#f4f3f4'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: '앱 설정',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 보안 설정 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>보안</Text>
          <SettingRow
            icon="finger-print"
            title="생체 인증"
            subtitle="지문 또는 Face ID로 앱 잠금"
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
          />
        </View>

        {/* 일반 설정 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>일반</Text>
          <SettingRow
            icon="save"
            title="자동 저장"
            subtitle="입력 내용을 자동으로 저장"
            value={autoSaveEnabled}
            onValueChange={setAutoSaveEnabled}
          />
          <SettingRow
            icon="volume-high"
            title="효과음"
            subtitle="버튼 터치 시 효과음 재생"
            value={soundEnabled}
            onValueChange={setSoundEnabled}
          />
          <SettingRow
            icon="phone-portrait"
            title="진동"
            subtitle="중요한 동작 시 진동 피드백"
            value={vibrationEnabled}
            onValueChange={setVibrationEnabled}
          />
        </View>

        {/* 데이터 및 개인정보 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            데이터 및 개인정보
          </Text>
          <SettingRow
            icon="analytics"
            title="사용 통계"
            subtitle="앱 개선을 위한 익명 데이터 수집"
            value={analyticsEnabled}
            onValueChange={setAnalyticsEnabled}
          />
          <SettingRow
            icon="trash"
            title="캐시 삭제"
            subtitle="임시 저장된 데이터 삭제"
            showSwitch={false}
            onPress={handleClearCache}
          />
          <SettingRow
            icon="download"
            title="데이터 내보내기"
            subtitle="모든 데이터를 파일로 저장"
            showSwitch={false}
            onPress={handleExportData}
          />
          <SettingRow
            icon="upload"
            title="데이터 가져오기"
            subtitle="백업 파일에서 데이터 복원"
            showSwitch={false}
            onPress={handleImportData}
          />
        </View>

        {/* 고급 설정 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>고급</Text>
          <SettingRow
            icon="refresh"
            title="설정 초기화"
            subtitle="모든 설정을 기본값으로 복원"
            showSwitch={false}
            onPress={handleResetSettings}
          />
        </View>

        {/* 버전 정보 */}
        <View style={styles.versionInfo}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            버전 1.0.0 (빌드 100)
          </Text>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            © 2025 Garabu
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  versionText: {
    fontSize: 12,
    marginBottom: 4,
  },
});