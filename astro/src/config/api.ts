/**
 * API 配置和常量
 */

// 检测是否为开发模式
const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

// 环境变量配置
export const config = {
  strapi: {
    url: import.meta.env.STRAPI_URL || process.env.STRAPI_URL || 'http://localhost:1337',
    apiToken: import.meta.env.STRAPI_API_TOKEN || process.env.STRAPI_API_TOKEN,
    timeout: isDevelopment ? 10000 : 5000, // 开发环境10秒，生产环境5秒
  },

  api: {
    baseUrl: import.meta.env.STRAPI_URL || process.env.STRAPI_URL || 'http://localhost:1337',
    retryAttempts: isDevelopment ? 1 : 2, // 减少重试次数，加快失败响应
    retryBaseDelay: isDevelopment ? 200 : 500, // 更快的重试延迟
    maxRetries: 3,
    retryDelay: 1000,
    maxRetryDelay: 5000,
    backoffFactor: 2,
  },

  cache: {
    // 开发模式：实时更新（1秒），生产模式：30分钟缓存
    ttl: isDevelopment ? 1 * 1000 : 30 * 60 * 1000,
    maxSize: 200, // 增加缓存容量
    // 缓存键生成策略
    keyPrefix: 'sunny_blog_',
    // 不同类型内容的缓存时间
    contentTtl: {
      articles: isDevelopment ? 1 * 1000 : 30 * 60 * 1000,     // 文章：开发1秒，生产30分钟
      categories: isDevelopment ? 1 * 1000 : 60 * 60 * 1000,   // 分类：开发1秒，生产1小时
      tags: isDevelopment ? 1 * 1000 : 60 * 60 * 1000,         // 标签：开发1秒，生产1小时
      index: isDevelopment ? 1 * 1000 : 15 * 60 * 1000,        // 首页设置：开发1秒，生产15分钟
      homepage: isDevelopment ? 1 * 1000 : 60 * 60 * 1000,     // 首页数据：开发1秒，生产1小时
    },
  },

  features: {
    useStrapi: import.meta.env.USE_STRAPI === 'true' || process.env.USE_STRAPI === 'true',
    useHybridMode: import.meta.env.USE_HYBRID_MODE === 'true' || process.env.USE_HYBRID_MODE === 'true',
    // 开发模式：启用短时间缓存，生产模式：启用长时间缓存
    enableCache: true,
    enableRetry: true,
  },

  development: {
    enableDebugLogs: isDevelopment && !import.meta.env.PROD,
    showErrorDetails: isDevelopment && !import.meta.env.PROD,
    isDevelopment: isDevelopment,
  }
} as const;

// API 端点常量
export const API_ENDPOINTS = {
  articles: '/articles',
  categories: '/categories',
  tags: '/tags',
  authors: '/authors',
  friendLinks: '/friend-links',
  index: '/index',
} as const;

// 错误消息常量
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  TIMEOUT_ERROR: '请求超时，请稍后再试',
  NOT_FOUND: '请求的内容不存在',
  SERVER_ERROR: '服务器暂时不可用，请稍后再试',
  RATE_LIMIT: '请求过于频繁，请稍后再试',
  UNKNOWN_ERROR: '发生了未知错误，请稍后再试',
} as const;

// 日志工具
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (config.development.enableDebugLogs) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️ ${message}`, ...args);
  },

  error: (message: string, ...args: any[]) => {
    console.error(`❌ ${message}`, ...args);
  },

  success: (message: string, ...args: any[]) => {
    if (config.development.enableDebugLogs) {
      console.log(`✅ ${message}`, ...args);
    }
  }
};

// 启动时输出缓存配置信息
if (config.development.enableDebugLogs) {
  console.log('🔧 缓存配置信息:');
  console.log(`   - 开发模式: ${config.development.isDevelopment}`);
  console.log(`   - 缓存启用: ${config.features.enableCache}`);
  console.log(`   - 缓存TTL: ${config.cache.ttl}ms (${config.cache.ttl / 1000}秒)`);
  console.log(`   - 最大缓存条目: ${config.cache.maxSize}`);
}
