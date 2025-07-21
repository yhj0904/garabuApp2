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
import axios from 'axios';
import config from '../../config/config';

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
      const response = await axios.get(
        `${config.API_BASE_URL}/api/v2/notifications/preferences`,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      );
      setPreferences(response.data);
      setQuietHoursEnabled(!!(response.data.quietHoursStart && response.data.quietHoursEnd));
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

      await axios.put(
        `${config.API_BASE_URL}/api/v2/notifications/preferences`,
        data,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      );
      
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!preferences) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>알림 설정을 불러올 수 없습니다.</Text>
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
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.saveButton}>저장</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 방법</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>푸시 알림</Text>
              <Text style={styles.settingDescription}>앱 푸시 알림을 받습니다</Text>
            </View>
            <Switch
              value={preferences.pushEnabled}
              onValueChange={(value) => updatePreference('pushEnabled', value)}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>이메일 알림</Text>
              <Text style={styles.settingDescription}>이메일로 알림을 받습니다</Text>
            </View>
            <Switch
              value={preferences.emailEnabled}
              onValueChange={(value) => updatePreference('emailEnabled', value)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 유형</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>거래 알림</Text>
              <Text style={styles.settingDescription}>새로운 거래가 추가될 때</Text>
            </View>
            <Switch
              value={preferences.transactionAlert}
              onValueChange={(value) => updatePreference('transactionAlert', value)}
              disabled={!preferences.pushEnabled && !preferences.emailEnabled}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>예산 알림</Text>
              <Text style={styles.settingDescription}>예산 초과 시 알림</Text>
            </View>
            <Switch
              value={preferences.budgetAlert}
              onValueChange={(value) => updatePreference('budgetAlert', value)}
              disabled={!preferences.pushEnabled && !preferences.emailEnabled}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>목표 알림</Text>
              <Text style={styles.settingDescription}>목표 달성 및 리마인더</Text>
            </View>
            <Switch
              value={preferences.goalAlert}
              onValueChange={(value) => updatePreference('goalAlert', value)}
              disabled={!preferences.pushEnabled && !preferences.emailEnabled}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>반복 거래 알림</Text>
              <Text style={styles.settingDescription}>반복 거래 실행 알림</Text>
            </View>
            <Switch
              value={preferences.recurringAlert}
              onValueChange={(value) => updatePreference('recurringAlert', value)}
              disabled={!preferences.pushEnabled && !preferences.emailEnabled}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>가계부 초대</Text>
              <Text style={styles.settingDescription}>가계부 초대를 받았을 때</Text>
            </View>
            <Switch
              value={preferences.bookInviteAlert}
              onValueChange={(value) => updatePreference('bookInviteAlert', value)}
              disabled={!preferences.pushEnabled && !preferences.emailEnabled}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>친구 요청</Text>
              <Text style={styles.settingDescription}>친구 요청을 받았을 때</Text>
            </View>
            <Switch
              value={preferences.friendRequestAlert}
              onValueChange={(value) => updatePreference('friendRequestAlert', value)}
              disabled={!preferences.pushEnabled && !preferences.emailEnabled}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>댓글 알림</Text>
              <Text style={styles.settingDescription}>내 거래에 댓글이 달렸을 때</Text>
            </View>
            <Switch
              value={preferences.commentAlert}
              onValueChange={(value) => updatePreference('commentAlert', value)}
              disabled={!preferences.pushEnabled && !preferences.emailEnabled}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 시간 설정</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>방해 금지 시간</Text>
              <Text style={styles.settingDescription}>알림을 받지 않을 시간대</Text>
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
                style={styles.timeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={styles.timeLabel}>시작 시간</Text>
                <Text style={styles.timeValue}>
                  {preferences.quietHoursStart || '22:00'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.timeLabel}>종료 시간</Text>
                <Text style={styles.timeValue}>
                  {preferences.quietHoursEnd || '07:00'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>주말 알림</Text>
              <Text style={styles.settingDescription}>주말에도 알림을 받습니다</Text>
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
    backgroundColor: '#F2F2F7',
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
    color: '#666',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    marginVertical: 8,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
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
    color: '#666',
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
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    minWidth: 120,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
}); 