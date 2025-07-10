import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { notification } from '@/services/notificationService';
import { sync } from '@/services/syncService';
import { useAuthStore } from '@/stores/authStore';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function SettingsModal() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, logout } = useAuthStore();

  // 설정 상태
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [sharingAlerts, setSharingAlerts] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [currency, setCurrency] = useState('KRW');
  const [language, setLanguage] = useState('ko');
  const [isLoading, setIsLoading] = useState(false);

  // 동기화 상태
  const [syncStatus, setSyncStatus] = useState(sync.getSyncStatus());

  useEffect(() => {
    // 동기화 상태 업데이트 리스너
    const handleSyncStatusChange = (status: any) => {
      setSyncStatus(status);
    };

    sync.on('sync-status-changed', handleSyncStatusChange);

    return () => {
      sync.off('sync-status-changed', handleSyncStatusChange);
    };
  }, []);

  // 알림 설정 핸들러
  const handleNotificationSettings = async () => {
    try {
      const hasPermission = await notification.requestPermissions();
      if (!hasPermission) {
        Alert.alert('알림 권한 필요', '알림 기능을 사용하려면 설정에서 권한을 허용해주세요.');
        return;
      }
      
      // 알림 설정 업데이트 (Mock 구현)
      // TODO: 실제 알림 설정 저장 API 호출
      console.log('Notification settings:', {
        pushNotifications,
        budgetAlerts,
        transactionAlerts,
        sharingAlerts
      });
      
      Alert.alert('성공', '알림 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('오류', '알림 설정 저장에 실패했습니다.');
    }
  };

  // 데이터 내보내기
  const handleExportData = async () => {
    try {
      setIsLoading(true);
      
      // Mock 데이터 생성
      const exportData = {
        user: {
          id: user?.id,
          name: user?.name,
          email: user?.email,
          exportDate: new Date().toISOString()
        },
        settings: {
          darkMode,
          currency,
          language,
          notifications: {
            pushNotifications,
            budgetAlerts,
            transactionAlerts,
            sharingAlerts
          }
        },
        timestamp: new Date().toISOString()
      };

      const jsonData = JSON.stringify(exportData, null, 2);
      const fileName = `garabu_export_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, jsonData);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('성공', `데이터가 ${fileName}로 저장되었습니다.`);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('오류', '데이터 내보내기에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 동기화 강제 실행
  const handleForceSync = async () => {
    try {
      setIsLoading(true);
      await sync.syncOfflineChanges();
      Alert.alert('성공', '동기화가 완료되었습니다.');
    } catch (error) {
      console.error('Error forcing sync:', error);
      Alert.alert('오류', '동기화에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 캐시 삭제
  const handleClearCache = () => {
    Alert.alert(
      '캐시 삭제',
      '앱 캐시를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              // Mock 캐시 삭제
              console.log('Clearing cache...');
              
              // 실제 구현에서는 AsyncStorage나 다른 캐시 스토리지를 정리
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              Alert.alert('성공', '캐시가 삭제되었습니다.');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('오류', '캐시 삭제에 실패했습니다.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // 계정 삭제
  const handleDeleteAccount = () => {
    Alert.alert(
      '계정 삭제',
      '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '최종 확인',
              '계정 삭제를 진행하시겠습니까?',
              [
                { text: '취소', style: 'cancel' },
                {
                  text: '삭제',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setIsLoading(true);
                      // Mock 계정 삭제
                      console.log('Deleting account...');
                      await new Promise(resolve => setTimeout(resolve, 2000));
                      
                      await logout();
                      router.replace('/login');
                    } catch (error) {
                      console.error('Error deleting account:', error);
                      Alert.alert('오류', '계정 삭제에 실패했습니다.');
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const getSyncStatusText = () => {
    if (syncStatus.isConnected) {
      return '연결됨';
    } else if (syncStatus.pendingChanges > 0) {
      return `${syncStatus.pendingChanges}개 대기 중`;
    } else {
      return '연결 안됨';
    }
  };

  const getSyncStatusColor = () => {
    if (syncStatus.isConnected) {
      return '#4CAF50';
    } else if (syncStatus.pendingChanges > 0) {
      return '#FF9500';
    } else {
      return '#FF3B30';
    }
  };

  return (
    <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="subtitle">설정</ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {/* 사용자 정보 */}
          <View style={[styles.userSection, { backgroundColor: colors.card }]}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={32} color={colors.tint} />
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.name || user?.username}</Text>
              <Text style={[styles.userEmail, { color: colors.icon }]}>{user?.email}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(modals)/profile')}>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* 앱 설정 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>앱 설정</Text>
            
            <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>다크 모드</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>어두운 테마 사용</Text>
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
                  <Text style={[styles.settingTitle, { color: colors.text }]}>생체 인증</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>지문 또는 Face ID 사용</Text>
                </View>
              </View>
              <Switch
                value={biometricAuth}
                onValueChange={setBiometricAuth}
                trackColor={{ false: '#767577', true: colors.tint }}
                thumbColor={biometricAuth ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="globe" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>언어</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>한국어</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="card" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>통화</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>KRW (원)</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* 알림 설정 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>알림 설정</Text>
            
            <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>푸시 알림</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>전체 알림 받기</Text>
                </View>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={(value) => {
                  setPushNotifications(value);
                  if (value) handleNotificationSettings();
                }}
                trackColor={{ false: '#767577', true: colors.tint }}
                thumbColor={pushNotifications ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="warning" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>예산 알림</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>예산 초과 시 알림</Text>
                </View>
              </View>
              <Switch
                value={budgetAlerts}
                onValueChange={setBudgetAlerts}
                trackColor={{ false: '#767577', true: colors.tint }}
                thumbColor={budgetAlerts ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="receipt" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>거래 알림</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>새 거래 추가 시 알림</Text>
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
                <Ionicons name="people" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>공유 알림</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>가계부 공유 시 알림</Text>
                </View>
              </View>
              <Switch
                value={sharingAlerts}
                onValueChange={setSharingAlerts}
                trackColor={{ false: '#767577', true: colors.tint }}
                thumbColor={sharingAlerts ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* 동기화 설정 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>동기화</Text>
            
            <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="sync" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>자동 동기화</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>실시간 데이터 동기화</Text>
                </View>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: '#767577', true: colors.tint }}
                thumbColor={autoSync ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="cloud-done" size={24} color={getSyncStatusColor()} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>동기화 상태</Text>
                  <Text style={[styles.settingDescription, { color: getSyncStatusColor() }]}>
                    {getSyncStatusText()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleForceSync} disabled={isLoading}>
                <Ionicons name="refresh" size={20} color={colors.tint} />
              </TouchableOpacity>
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="cloud-upload" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>자동 백업</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>클라우드 자동 백업</Text>
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

          {/* 데이터 관리 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>데이터 관리</Text>
            
            <TouchableOpacity 
              style={[styles.settingItem, { backgroundColor: colors.card }]}
              onPress={handleExportData}
              disabled={isLoading}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="download" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>데이터 내보내기</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>
                    {isLoading ? '내보내는 중...' : '내 데이터 백업하기'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, { backgroundColor: colors.card }]}
              onPress={handleClearCache}
              disabled={isLoading}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="trash" size={24} color="#FF9500" />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>캐시 삭제</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>
                    {isLoading ? '삭제 중...' : '앱 캐시 및 임시 파일 삭제'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* 계정 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>계정</Text>
            
            <TouchableOpacity 
              style={[styles.settingItem, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(modals)/change-password')}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="key" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>비밀번호 변경</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>계정 비밀번호 변경</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, { backgroundColor: colors.card }]}
              onPress={handleDeleteAccount}
              disabled={isLoading}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="person-remove" size={24} color="#FF3B30" />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: '#FF3B30' }]}>계정 삭제</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>
                    {isLoading ? '삭제 중...' : '계정 및 모든 데이터 삭제'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* 정보 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>정보</Text>
            
            <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="information-circle" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>앱 정보</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>버전 1.0.0</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="document-text" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>이용약관</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>서비스 이용약관</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="shield-checkmark" size={24} color={colors.tint} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>개인정보 처리방침</Text>
                  <Text style={[styles.settingDescription, { color: colors.icon }]}>개인정보 보호정책</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
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
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 2,
  },
});