import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../stores/authStore';
import apiService from '../../services/api';
import { useTheme } from '@/contexts/ThemeContext';
import { firebaseService } from '@/services/firebaseService';
import { Platform } from 'react-native';

interface NotificationPreference {
  id: number;
  memberId: number;
  pushEnabled: boolean;
  emailEnabled: boolean;
  transactionAlert: boolean;
  budgetAlert: boolean;
  goalAlert: boolean;
  recurringAlert: boolean;
  bookInviteAlert: boolean;
  friendRequestAlert: boolean;
  commentAlert: boolean;
  weekendAlert: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export default function NotificationSettingsScreen() {
  const authStore = useAuthStore();
  const { colors, isDarkMode } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await apiService.getNotificationPreferences();
      setPreferences(response);
      setQuietHoursEnabled(!!(response.quietHoursStart && response.quietHoursEnd));
    } catch (error) {
      console.error('알림 설정 조회 실패:', error);
      Alert.alert('오류', '알림 설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;
    
    setSaving(true);
    try {
      const data = {
        pushEnabled: preferences.pushEnabled,
        emailEnabled: preferences.emailEnabled,
        transactionAlert: preferences.transactionAlert,
        budgetAlert: preferences.budgetAlert,
        goalAlert: preferences.goalAlert,
        recurringAlert: preferences.recurringAlert,
        bookInviteAlert: preferences.bookInviteAlert,
        friendRequestAlert: preferences.friendRequestAlert,
        commentAlert: preferences.commentAlert,
        weekendAlert: preferences.weekendAlert,
        quietHoursStart: quietHoursEnabled ? preferences.quietHoursStart : null,
        quietHoursEnd: quietHoursEnabled ? preferences.quietHoursEnd : null,
      };

      await apiService.updateNotificationPreferences(data);
      
      Alert.alert('성공', '알림 설정이 저장되었습니다.');
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
      Alert.alert('오류', '알림 설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreference, value: any) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  const handleTimeChange = (event: any, selectedTime: Date | undefined, isStart: boolean) => {
    if (isStart) {
      setShowStartTimePicker(false);
    } else {
      setShowEndTimePicker(false);
    }
    
    if (selectedTime && preferences) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      if (isStart) {
        updatePreference('quietHoursStart', timeString);
      } else {
        updatePreference('quietHoursEnd', timeString);
      }
    }
  };

  const parseTime = (timeString?: string): Date => {
    const now = new Date();
    if (!timeString) return now;
    
    const [hours, minutes] = timeString.split(':').map(Number);
    now.setHours(hours, minutes, 0, 0);
    return now;
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!preferences) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>알림 설정을 불러올 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '알림 설정',
          headerRight: () => (
            <TouchableOpacity onPress={savePreferences} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.saveButton, { color: colors.primary }]}>저장</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>알림 방법</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>푸시 알림</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>앱 푸시 알림을 받습니다</Text>
            </View>
            <Switch
              value={preferences.pushEnabled}
              onValueChange={(value) => updatePreference('pushEnabled', value)}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>이메일 알림</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>이메일로 알림을 받습니다</Text>
            </View>
            <Switch
              value={preferences.emailEnabled}
              onValueChange={(value) => updatePreference('emailEnabled', value)}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>알림 유형</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>거래 알림</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>새로운 거래가 추가될 때</Text>
            </View>
            <Switch
              value={preferences.transactionAlert}
              onValueChange={(value) => updatePreference('transactionAlert', value)}
              disabled={!preferences.pushEnabled && !preferences.emailEnabled}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>예산 알림</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>예산 초과 시 알림</Text>
            </View>
            <Switch
              value={preferences.budgetAlert}
              onValueChange={(value) => updatePreference('budgetAlert', value)}
              disabled={!preferences.pushEnabled && !preferences.emailEnabled}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>목표 알림</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>목표 달성 및 리마인더</Text>
            </View>
            <Switch
              value={preferences.goalAlert}
              onValueChange={(value) => updatePreference('goalAlert', value)}
              disabled={!preferences.pushEnabled && !preferences.emailEnabled}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>반복 거래 알림</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>반복 거래 실행 알림</Text>
            </View>
            <Switch
              value={preferences.recurringAlert}
              onValueChange={(value) => updatePreference('recurringAlert', value)}
              disabled={!preferences.pushEnabled && !preferences.emailEnabled}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>가계부 초대</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>가계부 초대를 받았을 때</Text>
            </View>
            <Switch
              value={preferences.bookInviteAlert}
              onValueChange={(value) => updatePreference('bookInviteAlert', value)}
              disabled={!preferences.pushEnabled && !preferences.emailEnabled}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>친구 요청</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>친구 요청을 받았을 때</Text>
            </View>
            <Switch
              value={preferences.friendRequestAlert}
              onValueChange={(value) => updatePreference('friendRequestAlert', value)}
              disabled={!preferences.pushEnabled && !preferences.emailEnabled}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>댓글 알림</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>내 거래에 댓글이 달렸을 때</Text>
            </View>
            <Switch
              value={preferences.commentAlert}
              onValueChange={(value) => updatePreference('commentAlert', value)}
              disabled={!preferences.pushEnabled && !preferences.emailEnabled}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>알림 시간 설정</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>방해 금지 시간</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>알림을 받지 않을 시간대</Text>
            </View>
            <Switch
              value={quietHoursEnabled}
              onValueChange={(value) => {
                setQuietHoursEnabled(value);
                if (!value) {
                  updatePreference('quietHoursStart', null);
                  updatePreference('quietHoursEnd', null);
                }
              }}
            />
          </View>
          
          {quietHoursEnabled && (
            <View style={styles.timeContainer}>
              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>시작 시간</Text>
                <Text style={[styles.timeValue, { color: colors.primary }]}>
                  {preferences.quietHoursStart || '22:00'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>종료 시간</Text>
                <Text style={[styles.timeValue, { color: colors.primary }]}>
                  {preferences.quietHoursEnd || '07:00'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>주말 알림</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>주말에도 알림을 받습니다</Text>
            </View>
            <Switch
              value={preferences.weekendAlert}
              onValueChange={(value) => updatePreference('weekendAlert', value)}
            />
          </View>
        </View>

        {showStartTimePicker && (
          <DateTimePicker
            value={parseTime(preferences.quietHoursStart || '22:00')}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={(event, selectedTime) => handleTimeChange(event, selectedTime, true)}
          />
        )}

        {showEndTimePicker && (
          <DateTimePicker
            value={parseTime(preferences.quietHoursEnd || '07:00')}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={(event, selectedTime) => handleTimeChange(event, selectedTime, false)}
          />
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginVertical: 8,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  timeButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  timeLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '600',
  },
}); 