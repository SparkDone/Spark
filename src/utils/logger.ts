/**
 * 统一日志管理工具
 * 根据环境自动控制日志输出
 */

// 检查是否为开发环境
const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
const isDebug = import.meta.env.DEBUG === 'true';

// 日志级别
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// 当前日志级别（生产环境只显示错误和警告）
const currentLogLevel = isDev ? LogLevel.DEBUG : LogLevel.WARN;

/**
 * 格式化日志消息
 */
function formatMessage(level: string, message: string, ...args: any[]): [string, ...any[]] {
  const timestamp = new Date().toLocaleTimeString();
  return [`[${timestamp}] ${level} ${message}`, ...args];
}

/**
 * 日志输出函数
 */
export const logger = {
  error: (message: string, ...args: any[]) => {
    if (currentLogLevel >= LogLevel.ERROR) {
      console.error(...formatMessage('❌', message, ...args));
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (currentLogLevel >= LogLevel.WARN) {
      console.warn(...formatMessage('⚠️', message, ...args));
    }
  },

  info: (message: string, ...args: any[]) => {
    if (currentLogLevel >= LogLevel.INFO) {
      console.info(...formatMessage('ℹ️', message, ...args));
    }
  },

  debug: (message: string, ...args: any[]) => {
    if (currentLogLevel >= LogLevel.DEBUG) {
      console.log(...formatMessage('🔧', message, ...args));
    }
  },

  // 特殊的成功日志（总是显示，但在生产环境中简化）
  success: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(...formatMessage('✅', message, ...args));
    } else {
      // 生产环境中只在控制台显示简化版本
      console.log(`✅ ${message}`);
    }
  },

  // 特殊的主题日志（只在开发环境显示）
  theme: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(...formatMessage('🎨', message, ...args));
    }
  },

  // 特殊的搜索日志（只在开发环境显示）
  search: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(...formatMessage('🔍', message, ...args));
    }
  },

  // 特殊的性能日志（只在开发环境显示）
  perf: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(...formatMessage('⚡', message, ...args));
    }
  }
};

/**
 * 防抖日志 - 防止相同消息重复输出
 */
const logCache = new Map<string, number>();
const DEBOUNCE_TIME = 1000; // 1秒内相同消息只输出一次

export const debouncedLogger = {
  info: (message: string, ...args: any[]) => {
    const key = message;
    const now = Date.now();
    const lastTime = logCache.get(key) || 0;
    
    if (now - lastTime > DEBOUNCE_TIME) {
      logger.info(message, ...args);
      logCache.set(key, now);
    }
  },

  debug: (message: string, ...args: any[]) => {
    const key = message;
    const now = Date.now();
    const lastTime = logCache.get(key) || 0;
    
    if (now - lastTime > DEBOUNCE_TIME) {
      logger.debug(message, ...args);
      logCache.set(key, now);
    }
  },

  theme: (message: string, ...args: any[]) => {
    const key = message;
    const now = Date.now();
    const lastTime = logCache.get(key) || 0;
    
    if (now - lastTime > DEBOUNCE_TIME) {
      logger.theme(message, ...args);
      logCache.set(key, now);
    }
  }
};

/**
 * 清理日志缓存
 */
export function clearLogCache() {
  logCache.clear();
}

/**
 * 设置全局错误处理（只在开发环境显示详细信息）
 */
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    // 忽略Chrome扩展错误
    if (event.message.includes('extension') || 
        event.message.includes('Could not establish connection') ||
        event.message.includes('Receiving end does not exist')) {
      return;
    }
    
    logger.error('全局错误:', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    // 忽略Chrome扩展相关的Promise错误
    if (event.reason?.message?.includes('extension') ||
        event.reason?.message?.includes('Could not establish connection')) {
      event.preventDefault(); // 阻止错误显示
      return;
    }
    
    logger.error('未处理的Promise拒绝:', event.reason);
  });
}

export default logger;
