# 🔗 백엔드 연동 가이드

이 가이드는 가라부 앱을 실제 백엔드 서버와 연동하는 방법을 설명합니다.

## 📋 목차

1. [개발 환경 설정](#개발-환경-설정)
2. [백엔드 서버 실행](#백엔드-서버-실행)
3. [앱 설정 변경](#앱-설정-변경)
4. [API 연동 테스트](#api-연동-테스트)
5. [트러블슈팅](#트러블슈팅)

## 🛠 개발 환경 설정

### 1. 백엔드 서버 준비

```bash
# 백엔드 서버 디렉토리로 이동
cd /Users/yoonhyungjoo/Documents/garabu/garabuserver

# 서버 실행
./gradlew bootRun
```

### 2. 네트워크 설정 확인

```bash
# 현재 IP 주소 확인
ifconfig | grep "inet " | grep -v 127.0.0.1

# 또는 macOS/Linux
hostname -I
```

## 🚀 백엔드 서버 실행

### 1. 애플리케이션 실행

```bash
# 서버 디렉토리에서
./gradlew bootRun

# 또는 Docker로 실행
docker-compose up -d
```

### 2. 서버 상태 확인

```bash
# 헬스체크 확인
curl http://localhost:8080/actuator/health

# Swagger UI 확인
open http://localhost:8080/swagger-ui/index.html
```

## 📱 앱 설정 변경

### 1. API 서비스 설정

`services/api.ts` 파일에서:

```typescript
// 개발 환경에서는 Mock API 사용, 프로덕션에서는 실제 API 사용
// 실제 백엔드 API를 사용하려면 아래 라인을 주석 해제하고 위 라인을 주석 처리
// export const api = new MockApiService();
export const api = new ApiService(API_BASE_URL);
```

### 2. API 기본 URL 설정

```typescript
// API 기본 설정
// const API_BASE_URL = 'http://localhost:8080'; // 로컬 개발 시
const API_BASE_URL = 'http://192.168.1.100:8080'; // 모바일 디바이스에서 사용할 경우
```

**중요:** 모바일 디바이스에서 테스트할 때는 로컬 머신의 실제 IP 주소를 사용해야 합니다.

### 3. 알림 서비스 설정

`services/notificationService.ts` 파일에서:

```typescript
// 개발 환경에서는 Mock 서비스 사용
// export const notification = new MockNotificationService();
export const notification = new NotificationService();
```

## 🧪 API 연동 테스트

### 1. 기본 인증 테스트

```javascript
// 회원가입 테스트
const signupData = {
  email: 'test@example.com',
  username: 'testuser',
  password: 'password123',
  name: '테스트 사용자'
};

// 로그인 테스트
const loginData = {
  email: 'test@example.com',
  password: 'password123'
};
```

### 2. 가계부 공유 기능 테스트

```javascript
// 가계부 생성
const createBookData = {
  title: '커플 가계부'
};

// 사용자 초대
const inviteData = {
  email: 'partner@example.com',
  role: 'EDITOR'
};

// 권한 변경
const changeRoleData = {
  role: 'VIEWER'
};
```

### 3. 푸시 알림 테스트

```javascript
// FCM 토큰 등록
const token = await notification.registerForPushNotifications();
await notification.registerTokenWithServer(userId, token);

// 알림 전송 테스트
await notification.sendBookInvitationAlert(
  userId,
  '커플 가계부',
  '홍길동',
  'EDITOR'
);
```

## 🔧 트러블슈팅

### 1. 네트워크 연결 문제

**문제:** 앱에서 서버에 연결할 수 없음

**해결방법:**
```bash
# 서버 상태 확인
curl http://localhost:8080/actuator/health

# 방화벽 확인 (macOS)
sudo pfctl -sr

# 네트워크 설정 확인
ping 192.168.1.100
```

### 2. CORS 문제

**문제:** CORS 정책으로 인한 API 호출 실패

**해결방법:**
백엔드 서버의 `CorsConfig.java` 파일을 확인하고 모바일 앱의 origin을 허용하도록 설정

### 3. 인증 토큰 문제

**문제:** JWT 토큰 만료 또는 인증 실패

**해결방법:**
```javascript
// 토큰 갱신 로직 구현
const refreshToken = async () => {
  // 토큰 갱신 API 호출
  const newToken = await api.refreshToken(refreshToken);
  // 새 토큰으로 저장
  await AsyncStorage.setItem('token', newToken);
};
```

### 4. 데이터베이스 연결 문제

**문제:** 서버가 데이터베이스에 연결할 수 없음

**해결방법:**
```bash
# MySQL 서버 상태 확인
mysql -u root -p -e "SELECT 1"

# Docker 컨테이너 상태 확인
docker-compose ps
```

## 📊 성능 최적화

### 1. API 응답 시간 모니터링

```javascript
// API 호출 시간 측정
const startTime = Date.now();
const response = await api.getMyBooks(token);
const endTime = Date.now();
console.log(`API 호출 시간: ${endTime - startTime}ms`);
```

### 2. 캐싱 전략

```javascript
// 로컬 캐싱 구현
const getCachedBooks = async () => {
  const cachedData = await AsyncStorage.getItem('books');
  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    const now = Date.now();
    // 5분 이내 캐시 사용
    if (now - timestamp < 5 * 60 * 1000) {
      return data;
    }
  }
  return null;
};
```

### 3. 네트워크 오류 처리

```javascript
// 재시도 로직 구현
const retryApiCall = async (apiCall, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## 🚀 프로덕션 배포

### 1. 환경 변수 설정

```javascript
// config/environment.js
const config = {
  development: {
    API_BASE_URL: 'http://localhost:8080',
    USE_MOCK_API: true,
  },
  production: {
    API_BASE_URL: 'https://api.garabu.com',
    USE_MOCK_API: false,
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

### 2. 보안 설정

```javascript
// 민감한 정보는 환경 변수로 관리
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const FCM_SERVER_KEY = process.env.EXPO_PUBLIC_FCM_SERVER_KEY;
```

### 3. 로그 레벨 설정

```javascript
// 프로덕션에서는 로그 레벨 조정
const logger = {
  debug: __DEV__ ? console.log : () => {},
  info: console.log,
  warn: console.warn,
  error: console.error,
};
```

## 🎯 다음 단계

1. **성능 테스트**: 대용량 데이터 처리 및 동시 사용자 테스트
2. **보안 강화**: API 키 관리, 암호화 강화
3. **모니터링**: 에러 트래킹, 성능 모니터링 도구 연동
4. **자동화**: CI/CD 파이프라인 구축
5. **스케일링**: 로드 밸런싱, 캐싱 전략 고도화

---

## 📋 최신 업데이트 (2025-07-11)

### 🎨 카테고리 시스템 연동

**새로운 API 엔드포인트:**
```typescript
// 기본 제공 카테고리 조회
GET /api/v2/category/default

// 가계부별 통합 카테고리 조회 (기본 + 사용자 정의)
GET /api/v2/category/book/{bookId}

// 사용자 정의 카테고리 생성 (OWNER/EDITOR만 가능)
POST /api/v2/category/book/{bookId}
```

**Category 인터페이스 업데이트:**
```typescript
interface Category {
  id: number;
  category: string;
  emoji?: string;        // 새로 추가
  isDefault?: boolean;   // 새로 추가
}
```

**CategorySelector 컴포넌트 사용법:**
```typescript
import CategorySelector from '@/components/CategorySelector';

// 사용 예시
<CategorySelector
  selectedCategoryId={selectedCategory?.id}
  onCategorySelect={handleCategorySelect}
  bookId={currentBookId}
/>
```

**권한별 동작:**
- **OWNER/EDITOR**: 카테고리 조회 + 생성 가능
- **VIEWER**: 카테고리 조회만 가능
- **비멤버**: 403 Forbidden 에러

**에러 처리 예시:**
```typescript
try {
  const categories = await categoryStore.fetchCategoriesByBook(bookId, token);
} catch (error) {
  if (error.status === 403) {
    Alert.alert('권한 없음', '해당 가계부의 카테고리에 접근할 권한이 없습니다.');
  } else if (error.status === 404) {
    Alert.alert('오류', '가계부를 찾을 수 없습니다.');
  }
}
```

### 🔐 보안 강화 사항

- **권한 기반 접근 제어**: UserBook 테이블 기반 실제 권한 검증
- **구체적 에러 메시지**: 현재 권한과 필요 권한 명시
- **캐시 보안**: 가계부별 카테고리 데이터 격리

---

이 가이드를 통해 가라부 앱을 백엔드와 성공적으로 연동할 수 있습니다! 🎉