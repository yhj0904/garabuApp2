import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// FCM 토큰 관련 인터페이스
interface FCMToken {
  id: number;
  appId: string;
  userId: string;
  deviceId: string;
  fcmToken: string;
  regDt: string;
  useAt: string;
}

interface FCMTokenRequest {
  appId: string;
  userId: string;
  deviceId: string;
  fcmToken: string;
  useAt: string;
}

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private pushToken: string | null = null;

  // 알림 권한 요청
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    return true;
  }

  // FCM 토큰 등록
  async registerForPushNotifications(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Android 채널 설정
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Push 토큰 가져오기
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // 실제 프로젝트 ID로 변경
      });

      this.pushToken = token.data;
      console.log('FCM Token:', this.pushToken);
      
      return this.pushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  // 서버에 FCM 토큰 등록
  async registerTokenWithServer(userId: string, token: string): Promise<boolean> {
    try {
      const deviceId = await this.getDeviceId();
      const tokenData: FCMTokenRequest = {
        appId: 'garabu-app', // 앱 ID
        userId,
        deviceId,
        fcmToken: token,
        useAt: 'Y'
      };

      const { api } = await import('@/services/api');
      // 실제 서버 API 호출 (현재는 mock으로 시뮬레이션)
      console.log('Registering FCM token with server:', tokenData);
      
      // TODO: 실제 서버 API 구현 시 활성화
      // await api.registerFCMToken(tokenData);
      
      return true;
    } catch (error) {
      console.error('Error registering token with server:', error);
      return false;
    }
  }

  // 디바이스 ID 가져오기
  private async getDeviceId(): Promise<string> {
    const deviceId = await Device.getDeviceTypeAsync();
    return `${Platform.OS}_${deviceId}_${Date.now()}`;
  }

  // 로컬 알림 표시
  async showLocalNotification(title: string, body: string, data?: any): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // 즉시 표시
    });
  }

  // 알림 리스너 등록
  registerNotificationListeners() {
    // 알림을 받았을 때
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // 알림 처리 로직
      this.handleNotificationReceived(notification);
    });

    // 알림을 터치했을 때
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // 알림 터치 처리 로직
      this.handleNotificationResponse(response);
    });

    return { notificationListener, responseListener };
  }

  // 알림 수신 처리
  private handleNotificationReceived(notification: Notifications.Notification) {
    const { title, body, data } = notification.request.content;
    
    // 알림 타입에 따른 처리
    if (data?.type === 'NEW_TRANSACTION') {
      console.log('New transaction notification:', data);
      // 거래 추가 알림 처리
    } else if (data?.type === 'BUDGET_ALERT') {
      console.log('Budget alert notification:', data);
      // 예산 알림 처리
    } else if (data?.type === 'BOOK_SHARED') {
      console.log('Book shared notification:', data);
      // 가계부 공유 알림 처리
    }
  }

  // 알림 터치 처리
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const { data } = response.notification.request.content;
    
    // 알림 타입에 따른 화면 이동
    if (data?.type === 'NEW_TRANSACTION') {
      // 거래 내역 화면으로 이동
      console.log('Navigate to transaction history');
    } else if (data?.type === 'BUDGET_ALERT') {
      // 예산 화면으로 이동
      console.log('Navigate to budget screen');
    } else if (data?.type === 'BOOK_SHARED') {
      // 가계부 공유 화면으로 이동
      console.log('Navigate to book sharing screen');
    }
  }

  // 알림 전송 (서버 API 호출)
  async sendNotificationToUser(userId: string, title: string, body: string, data?: any): Promise<boolean> {
    try {
      const notificationData = {
        userId,
        title,
        body,
        data,
        type: 'PUSH'
      };

      const { api } = await import('@/services/api');
      // 실제 서버 API 호출 (현재는 mock으로 시뮬레이션)
      console.log('Sending notification to user:', notificationData);
      
      // TODO: 실제 서버 API 구현 시 활성화
      // await api.sendNotification(notificationData);
      
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // 예산 초과 알림
  async sendBudgetAlert(userId: string, currentAmount: number, budgetAmount: number): Promise<boolean> {
    const percentage = Math.round((currentAmount / budgetAmount) * 100);
    
    return this.sendNotificationToUser(
      userId,
      '예산 초과 알림',
      `이번 달 예산의 ${percentage}%를 사용했습니다. (₩${currentAmount.toLocaleString()}/₩${budgetAmount.toLocaleString()})`,
      {
        type: 'BUDGET_ALERT',
        currentAmount,
        budgetAmount,
        percentage
      }
    );
  }

  // 새 거래 알림
  async sendNewTransactionAlert(userId: string, transaction: any): Promise<boolean> {
    const type = transaction.amountType === 'INCOME' ? '수입' : '지출';
    const amount = transaction.amount.toLocaleString();
    
    return this.sendNotificationToUser(
      userId,
      `새 ${type} 추가`,
      `${transaction.description}: ${transaction.amountType === 'INCOME' ? '+' : '-'}₩${amount}`,
      {
        type: 'NEW_TRANSACTION',
        transaction
      }
    );
  }

  // 가계부 공유 알림
  async sendBookSharedAlert(userId: string, bookTitle: string, sharedBy: string): Promise<boolean> {
    return this.sendNotificationToUser(
      userId,
      '가계부 공유',
      `${sharedBy}님이 "${bookTitle}" 가계부를 공유했습니다.`,
      {
        type: 'BOOK_SHARED',
        bookTitle,
        sharedBy
      }
    );
  }

  // 가계부 초대 알림
  async sendBookInvitationAlert(userId: string, bookTitle: string, invitedBy: string, role: string): Promise<boolean> {
    const roleText = role === 'EDITOR' ? '편집자' : '조회자';
    return this.sendNotificationToUser(
      userId,
      '가계부 초대',
      `${invitedBy}님이 "${bookTitle}" 가계부에 ${roleText}로 초대했습니다.`,
      {
        type: 'BOOK_INVITATION',
        bookTitle,
        invitedBy,
        role
      }
    );
  }

  // 가계부 멤버 제거 알림
  async sendMemberRemovedAlert(userId: string, bookTitle: string, removedBy: string): Promise<boolean> {
    return this.sendNotificationToUser(
      userId,
      '가계부 멤버 제거',
      `${removedBy}님이 "${bookTitle}" 가계부에서 회원님을 제거했습니다.`,
      {
        type: 'MEMBER_REMOVED',
        bookTitle,
        removedBy
      }
    );
  }

  // 가계부 권한 변경 알림
  async sendRoleChangedAlert(userId: string, bookTitle: string, changedBy: string, newRole: string): Promise<boolean> {
    const roleText = newRole === 'EDITOR' ? '편집자' : '조회자';
    return this.sendNotificationToUser(
      userId,
      '가계부 권한 변경',
      `${changedBy}님이 "${bookTitle}" 가계부에서 회원님의 권한을 ${roleText}로 변경했습니다.`,
      {
        type: 'ROLE_CHANGED',
        bookTitle,
        changedBy,
        newRole
      }
    );
  }

  // 가계부 멤버 탈퇴 알림 (다른 멤버들에게)
  async sendMemberLeftAlert(userIds: string[], bookTitle: string, leftMember: string): Promise<boolean> {
    const promises = userIds.map(userId =>
      this.sendNotificationToUser(
        userId,
        '가계부 멤버 탈퇴',
        `${leftMember}님이 "${bookTitle}" 가계부에서 탈퇴했습니다.`,
        {
          type: 'MEMBER_LEFT',
          bookTitle,
          leftMember
        }
      )
    );

    try {
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error sending member left alerts:', error);
      return false;
    }
  }

  // 가계부 새 기록 알림
  async sendNewLedgerEntryAlert(userIds: string[], bookTitle: string, authorName: string, description: string, amount: number): Promise<boolean> {
    const promises = userIds.map(userId =>
      this.sendNotificationToUser(
        userId,
        '가계부 새 기록',
        `${authorName}님이 "${bookTitle}" 가계부에 새 기록을 추가했습니다: ${description} (₩${amount.toLocaleString()})`,
        {
          type: 'NEW_LEDGER_ENTRY',
          bookTitle,
          authorName,
          description,
          amount
        }
      )
    );

    try {
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error sending new ledger entry alerts:', error);
      return false;
    }
  }

  // 현재 토큰 반환
  getCurrentToken(): string | null {
    return this.pushToken;
  }

  // 리스너 해제
  removeNotificationListeners(listeners: any) {
    Notifications.removeNotificationSubscription(listeners.notificationListener);
    Notifications.removeNotificationSubscription(listeners.responseListener);
  }
}

export const notificationService = new NotificationService();

// Mock Notification Service (개발용)
export class MockNotificationService {
  private pushToken: string | null = null;

  async requestPermissions(): Promise<boolean> {
    console.log('Mock: Requesting notification permissions');
    return true;
  }

  async registerForPushNotifications(): Promise<string | null> {
    console.log('Mock: Registering for push notifications');
    this.pushToken = `mock-fcm-token-${Date.now()}`;
    return this.pushToken;
  }

  async registerTokenWithServer(userId: string, token: string): Promise<boolean> {
    console.log('Mock: Registering token with server:', { userId, token });
    return true;
  }

  async showLocalNotification(title: string, body: string, data?: any): Promise<void> {
    console.log('Mock: Showing local notification:', { title, body, data });
  }

  registerNotificationListeners() {
    console.log('Mock: Registering notification listeners');
    return {
      notificationListener: null,
      responseListener: null
    };
  }

  async sendNotificationToUser(userId: string, title: string, body: string, data?: any): Promise<boolean> {
    console.log('Mock: Sending notification to user:', { userId, title, body, data });
    return true;
  }

  async sendBudgetAlert(userId: string, currentAmount: number, budgetAmount: number): Promise<boolean> {
    console.log('Mock: Sending budget alert:', { userId, currentAmount, budgetAmount });
    return true;
  }

  async sendNewTransactionAlert(userId: string, transaction: any): Promise<boolean> {
    console.log('Mock: Sending new transaction alert:', { userId, transaction });
    return true;
  }

  async sendBookSharedAlert(userId: string, bookTitle: string, sharedBy: string): Promise<boolean> {
    console.log('Mock: Sending book shared alert:', { userId, bookTitle, sharedBy });
    return true;
  }

  async sendBookInvitationAlert(userId: string, bookTitle: string, invitedBy: string, role: string): Promise<boolean> {
    console.log('Mock: Sending book invitation alert:', { userId, bookTitle, invitedBy, role });
    return true;
  }

  async sendMemberRemovedAlert(userId: string, bookTitle: string, removedBy: string): Promise<boolean> {
    console.log('Mock: Sending member removed alert:', { userId, bookTitle, removedBy });
    return true;
  }

  async sendRoleChangedAlert(userId: string, bookTitle: string, changedBy: string, newRole: string): Promise<boolean> {
    console.log('Mock: Sending role changed alert:', { userId, bookTitle, changedBy, newRole });
    return true;
  }

  async sendMemberLeftAlert(userIds: string[], bookTitle: string, leftMember: string): Promise<boolean> {
    console.log('Mock: Sending member left alert:', { userIds, bookTitle, leftMember });
    return true;
  }

  async sendNewLedgerEntryAlert(userIds: string[], bookTitle: string, authorName: string, description: string, amount: number): Promise<boolean> {
    console.log('Mock: Sending new ledger entry alert:', { userIds, bookTitle, authorName, description, amount });
    return true;
  }

  getCurrentToken(): string | null {
    return this.pushToken;
  }

  removeNotificationListeners(listeners: any) {
    console.log('Mock: Removing notification listeners');
  }
}

// 개발 환경에서는 Mock 서비스 사용
export const notification = new MockNotificationService();