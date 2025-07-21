// utils/logger.ts
const isDev = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    // 에러는 프로덕션에서도 로깅
    console.error(...args);
  },
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  debug: (...args: any[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (isDev) {
      console.log('[INFO]', ...args);
    }
  }
};

export default logger;
