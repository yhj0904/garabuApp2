// 공통 이벤트 이름 정의
export const AnalyticsEvents = {
  // 인증 관련
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'sign_up',
  
  // 가계부 관련
  BOOK_CREATE: 'book_create',
  BOOK_JOIN: 'book_join',
  BOOK_SELECT: 'book_select',
  BOOK_SHARE: 'book_share',
  BOOK_DELETE: 'book_delete',
  BOOK_LEAVE: 'book_leave',
  
  // 거래 관련
  TRANSACTION_ADD: 'transaction_add',
  TRANSACTION_EDIT: 'transaction_edit',
  TRANSACTION_DELETE: 'transaction_delete',
  TRANSACTION_VIEW_DETAIL: 'transaction_view_detail',
  
  // 카테고리 관련
  CATEGORY_CREATE: 'category_create',
  CATEGORY_EDIT: 'category_edit',
  CATEGORY_DELETE: 'category_delete',
  
  // 자산 관련
  ASSET_ADD: 'asset_add',
  ASSET_EDIT: 'asset_edit',
  ASSET_DELETE: 'asset_delete',
  ASSET_VIEW_DETAIL: 'asset_view_detail',
  
  // 예산 관련
  BUDGET_SET: 'budget_set',
  BUDGET_EDIT: 'budget_edit',
  BUDGET_EXCEEDED: 'budget_exceeded',
  
  // 사용자 행동
  SEARCH: 'search',
  FILTER_APPLY: 'filter_apply',
  EXPORT_DATA: 'export_data',
  IMPORT_DATA: 'import_data',
  NOTIFICATION_CLICK: 'notification_click',
  NOTIFICATION_PERMISSION_GRANTED: 'notification_permission_granted',
  NOTIFICATION_PERMISSION_DENIED: 'notification_permission_denied',
  
  // 에러 추적
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  
  // 사용자 인게이지먼트
  SESSION_START: 'app_session_start',
  SESSION_END: 'app_session_end',
  TAB_SWITCH: 'tab_switch',
  MODAL_OPEN: 'modal_open',
  MODAL_CLOSE: 'modal_close',
  
  // 성능 관련
  SLOW_PERFORMANCE: 'slow_performance',
  CRASH_DETECTED: 'crash_detected',
  
  // 소셜 기능
  INVITE_SENT: 'invite_sent',
  INVITE_ACCEPTED: 'invite_accepted',
  
  // 설정 관련
  SETTINGS_CHANGED: 'settings_changed',
  THEME_CHANGED: 'theme_changed',
  LANGUAGE_CHANGED: 'language_changed',
} as const;

// 사용자 속성 이름 정의
export const UserProperties = {
  BOOKS_COUNT: 'books_count',
  SUBSCRIPTION_TYPE: 'subscription_type',
  AUTH_PROVIDER: 'auth_provider',
  THEME_PREFERENCE: 'theme_preference',
  LANGUAGE: 'app_language',
  USER_TYPE: 'user_type', // new_user, active_user, power_user
  TOTAL_TRANSACTIONS: 'total_transactions',
  ACCOUNT_AGE_DAYS: 'account_age_days',
  HAS_SHARED_BOOK: 'has_shared_book',
  NOTIFICATION_ENABLED: 'notification_enabled',
  DEFAULT_CURRENCY: 'default_currency',
} as const;

// 전환 이벤트 (중요한 사용자 행동)
export const ConversionEvents = {
  FIRST_TRANSACTION: 'first_transaction_added',
  FIRST_BOOK_CREATED: 'first_book_created',
  FIRST_BOOK_SHARED: 'first_book_shared',
  FIRST_BUDGET_SET: 'first_budget_set',
  FIRST_ASSET_ADDED: 'first_asset_added',
  COMPLETED_ONBOARDING: 'completed_onboarding',
  ACTIVATED_NOTIFICATIONS: 'activated_notifications',
  REACHED_10_TRANSACTIONS: 'reached_10_transactions',
  REACHED_100_TRANSACTIONS: 'reached_100_transactions',
  INVITED_FRIEND: 'invited_friend_to_book',
} as const;