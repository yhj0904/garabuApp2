import { EventEmitter } from 'eventemitter3';
import { Ledger, Book, Member } from '@/services/api';
import { notification } from '@/services/notificationService';

// 동기화 이벤트 타입
type SyncEvent = 
  | 'LEDGER_CREATED'
  | 'LEDGER_UPDATED'
  | 'LEDGER_DELETED'
  | 'BOOK_CREATED'
  | 'BOOK_UPDATED'
  | 'BOOK_DELETED'
  | 'MEMBER_JOINED'
  | 'MEMBER_LEFT'
  | 'MEMBER_ROLE_CHANGED'
  | 'SYNC_STATUS_CHANGED';

interface SyncEventData {
  type: SyncEvent;
  data: any;
  timestamp: number;
  userId: number;
  bookId?: number;
}

interface SyncStatus {
  isConnected: boolean;
  lastSyncTime: number;
  pendingChanges: number;
}

class SyncService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private syncStatus: SyncStatus = {
    isConnected: false,
    lastSyncTime: 0,
    pendingChanges: 0
  };
  private currentUserId: number | null = null;
  private currentBookId: number | null = null;
  private pendingEvents: SyncEventData[] = [];

  // WebSocket 연결 시작
  async connect(userId: number, bookId: number, token: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.currentUserId = userId;
    this.currentBookId = bookId;

    try {
      // 실제 WebSocket 서버 URL (현재는 mock)
      const wsUrl = `ws://localhost:8080/ws?token=${token}&userId=${userId}&bookId=${bookId}`;
      
      console.log('Mock: Connecting to WebSocket:', wsUrl);
      
      // Mock WebSocket 연결
      this.simulateWebSocketConnection();
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleConnectionError();
    }
  }

  // Mock WebSocket 연결 시뮬레이션
  private simulateWebSocketConnection(): void {
    console.log('Mock: WebSocket connected');
    
    this.syncStatus.isConnected = true;
    this.syncStatus.lastSyncTime = Date.now();
    this.reconnectAttempts = 0;
    
    this.emit('sync-status-changed', this.syncStatus);
    
    // 하트비트 시작
    this.startHeartbeat();
    
    // 펜딩 이벤트 처리
    this.processPendingEvents();
  }

  // 실제 WebSocket 연결 (실제 구현 시 사용)
  private connectWebSocket(wsUrl: string): void {
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.syncStatus.isConnected = true;
      this.syncStatus.lastSyncTime = Date.now();
      this.reconnectAttempts = 0;
      
      this.emit('sync-status-changed', this.syncStatus);
      this.startHeartbeat();
      this.processPendingEvents();
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data: SyncEventData = JSON.parse(event.data);
        this.handleSyncEvent(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleConnectionError();
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.syncStatus.isConnected = false;
      this.emit('sync-status-changed', this.syncStatus);
      
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      
      // 재연결 시도
      this.attemptReconnect();
    };
  }

  // 동기화 이벤트 처리
  private handleSyncEvent(eventData: SyncEventData): void {
    console.log('Sync event received:', eventData);
    
    // 자신이 보낸 이벤트는 무시
    if (eventData.userId === this.currentUserId) {
      return;
    }
    
    switch (eventData.type) {
      case 'LEDGER_CREATED':
        this.handleLedgerCreated(eventData.data);
        break;
      case 'LEDGER_UPDATED':
        this.handleLedgerUpdated(eventData.data);
        break;
      case 'LEDGER_DELETED':
        this.handleLedgerDeleted(eventData.data);
        break;
      case 'BOOK_UPDATED':
        this.handleBookUpdated(eventData.data);
        break;
      case 'MEMBER_JOINED':
        this.handleMemberJoined(eventData.data);
        break;
      case 'MEMBER_LEFT':
        this.handleMemberLeft(eventData.data);
        break;
      case 'MEMBER_ROLE_CHANGED':
        this.handleMemberRoleChanged(eventData.data);
        break;
      default:
        console.warn('Unknown sync event type:', eventData.type);
    }
    
    this.syncStatus.lastSyncTime = Date.now();
    this.emit('sync-status-changed', this.syncStatus);
  }

  // 거래 생성 이벤트 처리
  private handleLedgerCreated(ledger: Ledger): void {
    this.emit('ledger-created', ledger);
    
    // 사용자에게 알림
    notification.showLocalNotification(
      '새 거래 추가',
      `${ledger.description}: ${ledger.amountType === 'INCOME' ? '+' : '-'}₩${ledger.amount.toLocaleString()}`,
      { type: 'NEW_TRANSACTION', ledger }
    );
  }

  // 거래 수정 이벤트 처리
  private handleLedgerUpdated(ledger: Ledger): void {
    this.emit('ledger-updated', ledger);
    
    notification.showLocalNotification(
      '거래 수정',
      `${ledger.description} 거래가 수정되었습니다.`,
      { type: 'TRANSACTION_UPDATED', ledger }
    );
  }

  // 거래 삭제 이벤트 처리
  private handleLedgerDeleted(ledgerId: number): void {
    this.emit('ledger-deleted', ledgerId);
    
    notification.showLocalNotification(
      '거래 삭제',
      '거래가 삭제되었습니다.',
      { type: 'TRANSACTION_DELETED', ledgerId }
    );
  }

  // 가계부 수정 이벤트 처리
  private handleBookUpdated(book: Book): void {
    this.emit('book-updated', book);
    
    notification.showLocalNotification(
      '가계부 수정',
      `"${book.title}" 가계부가 수정되었습니다.`,
      { type: 'BOOK_UPDATED', book }
    );
  }

  // 멤버 참여 이벤트 처리
  private handleMemberJoined(member: Member): void {
    this.emit('member-joined', member);
    
    notification.showLocalNotification(
      '새 멤버 참여',
      `${member.name}님이 가계부에 참여했습니다.`,
      { type: 'MEMBER_JOINED', member }
    );
  }

  // 멤버 퇴장 이벤트 처리
  private handleMemberLeft(member: Member): void {
    this.emit('member-left', member);
    
    notification.showLocalNotification(
      '멤버 퇴장',
      `${member.name}님이 가계부에서 나갔습니다.`,
      { type: 'MEMBER_LEFT', member }
    );
  }

  // 멤버 역할 변경 이벤트 처리
  private handleMemberRoleChanged(data: { member: Member; newRole: string }): void {
    this.emit('member-role-changed', data);
    
    notification.showLocalNotification(
      '역할 변경',
      `${data.member.name}님의 역할이 변경되었습니다.`,
      { type: 'MEMBER_ROLE_CHANGED', data }
    );
  }

  // 동기화 이벤트 전송
  async sendSyncEvent(type: SyncEvent, data: any): Promise<void> {
    if (!this.currentUserId || !this.currentBookId) {
      console.error('User ID or Book ID not set');
      return;
    }
    
    const eventData: SyncEventData = {
      type,
      data,
      timestamp: Date.now(),
      userId: this.currentUserId,
      bookId: this.currentBookId
    };
    
    if (this.syncStatus.isConnected) {
      // 실제 WebSocket 전송
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(eventData));
      } else {
        // Mock 전송
        console.log('Mock: Sending sync event:', eventData);
        
        // 다른 클라이언트에게 전송되었다고 시뮬레이션
        setTimeout(() => {
          this.simulateEventFromOtherUser(eventData);
        }, 1000);
      }
    } else {
      // 연결되지 않은 경우 펜딩
      this.pendingEvents.push(eventData);
      this.syncStatus.pendingChanges++;
      this.emit('sync-status-changed', this.syncStatus);
    }
  }

  // 다른 사용자의 이벤트 시뮬레이션
  private simulateEventFromOtherUser(originalEvent: SyncEventData): void {
    // 개발 중에만 사용하는 시뮬레이션
    if (__DEV__) {
      const simulatedEvent: SyncEventData = {
        ...originalEvent,
        userId: originalEvent.userId + 1, // 다른 사용자 ID
        timestamp: Date.now()
      };
      
      // 50% 확률로 시뮬레이션
      if (Math.random() > 0.5) {
        setTimeout(() => {
          this.handleSyncEvent(simulatedEvent);
        }, 500);
      }
    }
  }

  // 펜딩 이벤트 처리
  private processPendingEvents(): void {
    if (this.pendingEvents.length === 0) return;
    
    console.log(`Processing ${this.pendingEvents.length} pending events`);
    
    this.pendingEvents.forEach(event => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(event));
      } else {
        console.log('Mock: Sending pending event:', event);
      }
    });
    
    this.pendingEvents = [];
    this.syncStatus.pendingChanges = 0;
    this.emit('sync-status-changed', this.syncStatus);
  }

  // 하트비트 시작
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'HEARTBEAT' }));
      } else {
        console.log('Mock: Heartbeat');
      }
    }, 30000); // 30초마다 하트비트
  }

  // 연결 오류 처리
  private handleConnectionError(): void {
    this.syncStatus.isConnected = false;
    this.emit('sync-status-changed', this.syncStatus);
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.attemptReconnect();
  }

  // 재연결 시도
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.currentUserId && this.currentBookId) {
        this.connect(this.currentUserId, this.currentBookId, 'mock-token');
      }
    }, delay);
  }

  // 연결 해제
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.syncStatus.isConnected = false;
    this.emit('sync-status-changed', this.syncStatus);
    
    this.currentUserId = null;
    this.currentBookId = null;
    this.reconnectAttempts = 0;
  }

  // 동기화 상태 반환
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // 충돌 해결
  async resolveConflict(localData: any, remoteData: any): Promise<any> {
    // 간단한 충돌 해결: 최신 타임스탬프 우선
    if (localData.updatedAt > remoteData.updatedAt) {
      return localData;
    } else {
      return remoteData;
    }
  }

  // 오프라인 변경사항 동기화
  async syncOfflineChanges(): Promise<void> {
    // 오프라인 중 발생한 변경사항들을 서버와 동기화
    console.log('Syncing offline changes...');
    
    // 실제 구현에서는 로컬 스토리지에서 오프라인 변경사항을 가져와서 처리
    // 현재는 mock 처리
    
    this.processPendingEvents();
  }
}

export const syncService = new SyncService();

// Mock Sync Service (개발용)
export class MockSyncService extends EventEmitter {
  private syncStatus: SyncStatus = {
    isConnected: false,
    lastSyncTime: 0,
    pendingChanges: 0
  };
  
  private currentUserId: number | null = null;
  private currentBookId: number | null = null;
  private mockInterval: NodeJS.Timeout | null = null;

  async connect(userId: number, bookId: number, token: string): Promise<void> {
    console.log('Mock Sync: Connecting...', { userId, bookId });
    
    this.currentUserId = userId;
    this.currentBookId = bookId;
    
    setTimeout(() => {
      this.syncStatus.isConnected = true;
      this.syncStatus.lastSyncTime = Date.now();
      this.emit('sync-status-changed', this.syncStatus);
      
      // Mock 이벤트 시뮬레이션 시작
      this.startMockEvents();
    }, 1000);
  }

  private startMockEvents(): void {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
    }
    
    // 개발 중에만 Mock 이벤트 생성
    if (__DEV__) {
      this.mockInterval = setInterval(() => {
        if (Math.random() > 0.8) { // 20% 확률로 Mock 이벤트 생성
          this.generateMockEvent();
        }
      }, 10000); // 10초마다 체크
    }
  }

  private generateMockEvent(): void {
    const events = [
      {
        type: 'LEDGER_CREATED' as SyncEvent,
        data: {
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          amount: Math.floor(Math.random() * 50000) + 1000,
          description: `Mock 거래 ${Date.now()}`,
          amountType: Math.random() > 0.5 ? 'INCOME' : 'EXPENSE',
          memberId: 2,
          bookId: this.currentBookId,
          categoryId: 1,
          paymentId: 1
        }
      },
      {
        type: 'MEMBER_JOINED' as SyncEvent,
        data: {
          id: Date.now(),
          username: `mock_user_${Date.now()}`,
          email: `mock${Date.now()}@example.com`,
          name: `Mock User ${Date.now()}`,
          role: 'USER'
        }
      }
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    const eventData: SyncEventData = {
      ...randomEvent,
      timestamp: Date.now(),
      userId: 2, // 다른 사용자로 시뮬레이션
      bookId: this.currentBookId
    };
    
    console.log('Mock Sync: Generated event:', eventData);
    
    // 이벤트 처리 시뮬레이션
    setTimeout(() => {
      this.handleSyncEvent(eventData);
    }, 500);
  }

  private handleSyncEvent(eventData: SyncEventData): void {
    if (eventData.userId === this.currentUserId) return;
    
    this.syncStatus.lastSyncTime = Date.now();
    this.emit('sync-status-changed', this.syncStatus);
    
    switch (eventData.type) {
      case 'LEDGER_CREATED':
        this.emit('ledger-created', eventData.data);
        break;
      case 'MEMBER_JOINED':
        this.emit('member-joined', eventData.data);
        break;
      default:
        console.log('Mock Sync: Unhandled event type:', eventData.type);
    }
  }

  async sendSyncEvent(type: SyncEvent, data: any): Promise<void> {
    console.log('Mock Sync: Sending event:', { type, data });
    
    if (this.syncStatus.isConnected) {
      // 전송 성공 시뮬레이션
      setTimeout(() => {
        console.log('Mock Sync: Event sent successfully');
      }, 200);
    } else {
      this.syncStatus.pendingChanges++;
      this.emit('sync-status-changed', this.syncStatus);
    }
  }

  disconnect(): void {
    console.log('Mock Sync: Disconnecting...');
    
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
    
    this.syncStatus.isConnected = false;
    this.emit('sync-status-changed', this.syncStatus);
    
    this.currentUserId = null;
    this.currentBookId = null;
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  async resolveConflict(localData: any, remoteData: any): Promise<any> {
    return localData.updatedAt > remoteData.updatedAt ? localData : remoteData;
  }

  async syncOfflineChanges(): Promise<void> {
    console.log('Mock Sync: Syncing offline changes...');
    
    this.syncStatus.pendingChanges = 0;
    this.emit('sync-status-changed', this.syncStatus);
  }
}

// 개발 환경에서는 Mock 서비스 사용
export const sync = new MockSyncService();