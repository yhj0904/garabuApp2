// React Native용 EventEmitter 사용
class EventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => {
        listener(...args);
      });
    }
  }

  removeListener(event: string, listener: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }

  // 'off' 메서드 추가 (removeListener의 별칭)
  off(event: string, listener: Function) {
    this.removeListener(event, listener);
  }
}
import config from '../config/config';
import api from './api';
// React Native EventSource polyfill 사용
// @ts-ignore
import 'react-native-url-polyfill/auto';

// EventSource polyfill for React Native
class EventSource {
  private url: string;
  private options: any;
  private xhr: XMLHttpRequest | null = null;
  private listeners: { [key: string]: Function[] } = {};
  public readyState: number = 0; // CONNECTING
  
  // Constants
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  constructor(url: string, options: any = {}) {
    this.url = url;
    this.options = options;
    this.connect();
  }

  private connect() {
    this.readyState = EventSource.CONNECTING;
    
    this.xhr = new XMLHttpRequest();
    this.xhr.open('GET', this.url, true);
    
    // 헤더 설정
    this.xhr.setRequestHeader('Accept', 'text/event-stream');
    this.xhr.setRequestHeader('Cache-Control', 'no-cache');
    
    if (this.options.headers) {
      Object.keys(this.options.headers).forEach(key => {
        this.xhr!.setRequestHeader(key, this.options.headers[key]);
      });
    }

    this.xhr.onreadystatechange = () => {
      if (this.xhr!.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
        this.readyState = EventSource.OPEN;
        this.emit('open', {});
      }
    };

    let buffer = '';
    this.xhr.onprogress = () => {
      const newData = this.xhr!.responseText.substring(buffer.length);
      buffer = this.xhr!.responseText;
      
      const lines = newData.split('\n');
      let eventType = '';
      let data = '';
      let id = '';
      
      lines.forEach(line => {
        if (line.startsWith('event:')) {
          eventType = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          data += line.substring(5).trim();
        } else if (line.startsWith('id:')) {
          id = line.substring(3).trim();
        } else if (line === '' && (eventType || data)) {
          this.emit(eventType || 'message', {
            data: data,
            lastEventId: id,
            type: eventType
          });
          eventType = '';
          data = '';
          id = '';
        }
      });
    };

    this.xhr.onerror = () => {
      this.emit('error', new Error('EventSource connection error'));
    };

    this.xhr.send();
  }

  addEventListener(type: string, listener: Function) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: Function) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(l => l !== listener);
    }
  }

  private emit(type: string, event: any) {
    if (this.listeners[type]) {
      this.listeners[type].forEach(listener => {
        listener(event);
      });
    }
  }

  close() {
    this.readyState = EventSource.CLOSED;
    if (this.xhr) {
      this.xhr.abort();
      this.xhr = null;
    }
  }
}

export type SyncEvent = 
  | 'LEDGER_CREATED' 
  | 'LEDGER_UPDATED' 
  | 'LEDGER_DELETED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_UPDATED'
  | 'BOOK_CREATED'
  | 'BOOK_UPDATED';

export interface SyncEventData {
  type: SyncEvent;
  data: any;
  timestamp: number;
  userId?: number;
  bookId?: number;
}

export interface SyncStatus {
  isConnected: boolean;
  lastSyncTime: number;
  pendingChanges: number;
}

interface ServerMessage {
  type: string;
  data?: any;
  timestamp?: number;
  userId?: string;
  bookId?: string;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL_MS = 1000;

class SyncService extends EventEmitter {
  private eventSource: EventSource | null = null;
  private currentUserId: number | null = null;
  private currentBookId: number | null = null;
  private currentToken: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: any = null;
  
  private syncStatus: SyncStatus = {
    isConnected: false,
    lastSyncTime: 0,
    pendingChanges: 0
  };

  private pendingEvents: SyncEventData[] = [];

  constructor() {
    super();
  }

  // SSE 연결 시작
  async connect(userId: number, bookId: number, token: string): Promise<void> {
    // 파라미터 검증
    if (!userId || !bookId || !token) {
      console.error('SSE connection failed: Invalid parameters', {
        userId: !!userId,
        bookId: !!bookId,
        token: !!token
      });
      return;
    }
    
    if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
      console.log('SSE already connected');
      return;
    }

    this.currentUserId = userId;
    this.currentBookId = bookId;
    this.currentToken = token;

    try {
      // SSE 서버 URL
      const sseUrl = `${config.API_BASE_URL}/api/v2/sse/subscribe/${bookId}`;
      
      console.log('Connecting to SSE:', {
        url: sseUrl,
        userId,
        bookId
      });
      
      // SSE 연결
      this.connectSSE(sseUrl, token);
      
    } catch (error) {
      console.error('SSE connection failed:', error);
      this.handleConnectionError();
    }
  }

  // 실제 SSE 연결
  private connectSSE(sseUrl: string, token: string): void {
    this.eventSource = new EventSource(sseUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      },
      withCredentials: false
    });
    
    this.eventSource.addEventListener('open', () => {
      console.log('SSE connected');
      this.syncStatus.isConnected = true;
      this.syncStatus.lastSyncTime = Date.now();
      this.reconnectAttempts = 0;
      
      this.emit('sync-status-changed', this.syncStatus);
      this.processPendingEvents();
    });
    
    // 연결 확인 이벤트
    this.eventSource.addEventListener('connected', (event: any) => {
      console.log('SSE connection confirmed:', event.data);
    });
    
    // 가계부 업데이트 이벤트들
    this.eventSource.addEventListener('LEDGER_CREATED', (event: any) => {
      this.handleSyncEvent({
        type: 'LEDGER_CREATED',
        data: JSON.parse(event.data),
        timestamp: parseInt(event.lastEventId || Date.now().toString())
      });
    });
    
    this.eventSource.addEventListener('LEDGER_UPDATED', (event: any) => {
      this.handleSyncEvent({
        type: 'LEDGER_UPDATED',
        data: JSON.parse(event.data),
        timestamp: parseInt(event.lastEventId || Date.now().toString())
      });
    });
    
    this.eventSource.addEventListener('LEDGER_DELETED', (event: any) => {
      this.handleSyncEvent({
        type: 'LEDGER_DELETED',
        data: JSON.parse(event.data),
        timestamp: parseInt(event.lastEventId || Date.now().toString())
      });
    });
    
    this.eventSource.addEventListener('MEMBER_ADDED', (event: any) => {
      this.handleSyncEvent({
        type: 'MEMBER_ADDED',
        data: JSON.parse(event.data),
        timestamp: parseInt(event.lastEventId || Date.now().toString())
      });
    });
    
    this.eventSource.addEventListener('MEMBER_REMOVED', (event: any) => {
      this.handleSyncEvent({
        type: 'MEMBER_REMOVED',
        data: JSON.parse(event.data),
        timestamp: parseInt(event.lastEventId || Date.now().toString())
      });
    });
    
    this.eventSource.addEventListener('MEMBER_UPDATED', (event: any) => {
      this.handleSyncEvent({
        type: 'MEMBER_UPDATED',
        data: JSON.parse(event.data),
        timestamp: parseInt(event.lastEventId || Date.now().toString())
      });
    });
    
    this.eventSource.addEventListener('BOOK_CREATED', (event: any) => {
      this.handleSyncEvent({
        type: 'BOOK_CREATED',
        data: JSON.parse(event.data),
        timestamp: parseInt(event.lastEventId || Date.now().toString())
      });
    });
    
    this.eventSource.addEventListener('BOOK_UPDATED', (event: any) => {
      this.handleSyncEvent({
        type: 'BOOK_UPDATED',
        data: JSON.parse(event.data),
        timestamp: parseInt(event.lastEventId || Date.now().toString())
      });
    });
    
    // Heartbeat
    this.eventSource.addEventListener('heartbeat', () => {
      console.log('SSE heartbeat received');
    });
    
    this.eventSource.addEventListener('error', (error: any) => {
      console.error('SSE error:', error);
      this.handleConnectionError();
    });
  }

  // 연결 해제
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.syncStatus.isConnected = false;
    this.emit('sync-status-changed', this.syncStatus);
    
    console.log('SSE disconnected');
  }

  // 재연결 처리
  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = RECONNECT_INTERVAL_MS * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(async () => {
      if (this.currentUserId && this.currentBookId && this.currentToken) {
        try {
          console.log('Attempting reconnection with saved credentials');
          await this.connect(this.currentUserId, this.currentBookId, this.currentToken);
        } catch (error) {
          console.error('Reconnection failed:', error);
          this.reconnect();
        }
      } else {
        console.error('Reconnection failed: Missing credentials', {
          userId: this.currentUserId,
          bookId: this.currentBookId,
          token: !!this.currentToken
        });
      }
    }, delay);
  }

  // 연결 오류 처리
  private handleConnectionError(): void {
    this.syncStatus.isConnected = false;
    this.emit('sync-status-changed', this.syncStatus);
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.reconnect();
  }

  // 동기화 이벤트 처리
  private handleSyncEvent(eventData: SyncEventData): void {
    console.log('Sync event received:', eventData);
    
    // 이벤트 발행
    this.emit('sync-event', eventData);
    this.emit(eventData.type, eventData.data);
    
    // 마지막 동기화 시간 업데이트
    this.syncStatus.lastSyncTime = Date.now();
    this.emit('sync-status-changed', this.syncStatus);
  }

  // 대기 중인 이벤트 처리
  private async processPendingEvents(): Promise<void> {
    while (this.pendingEvents.length > 0 && this.syncStatus.isConnected) {
      const event = this.pendingEvents.shift();
      if (event) {
        await this.sendUpdate(event.type, event.data);
      }
    }
    
    this.syncStatus.pendingChanges = this.pendingEvents.length;
    this.emit('sync-status-changed', this.syncStatus);
  }

  // 데이터 업데이트 전송 (REST API 사용)
  async sendUpdate(type: SyncEvent, data: any): Promise<void> {
    if (!this.currentBookId) {
      console.error('Book ID not set');
      return;
    }
    
    try {
      // SSE는 단방향이므로 업데이트는 REST API로 전송
      await api.post(`/api/v2/book/${this.currentBookId}/sync`, {
        type,
        data,
        timestamp: Date.now()
      });
      
      console.log('Update sent via REST API:', type);
    } catch (error) {
      console.error('Failed to send update:', error);
      
      // 실패한 이벤트를 대기열에 추가
      this.pendingEvents.push({
        type,
        data,
        timestamp: Date.now()
      });
      
      this.syncStatus.pendingChanges = this.pendingEvents.length;
      this.emit('sync-status-changed', this.syncStatus);
    }
  }

  // 동기화 상태 조회
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // 대기 중인 변경사항 수 조회
  getPendingChangesCount(): number {
    return this.pendingEvents.length;
  }

  // 강제 동기화
  async forceSync(): Promise<void> {
    if (this.syncStatus.isConnected) {
      await this.processPendingEvents();
    }
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.syncStatus.isConnected;
  }
}

export default new SyncService();