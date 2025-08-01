/**
 * 简单的内存缓存实现
 * 用于缓存API响应，提高性能
 */

import { config, logger } from '../config/api';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = config.cache.maxSize, defaultTTL: number = config.cache.ttl) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * 获取缓存数据，如果不存在或过期则执行fetcher函数
   */
  async get<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    if (!config.features.enableCache) {
      return fetcher();
    }

    const cached = this.cache.get(key);
    const now = Date.now();

    // 检查缓存是否存在且未过期
    if (cached && (now - cached.timestamp) < cached.ttl) {
      logger.info(`Cache hit for key: ${key}`);
      return cached.data;
    }

    // 缓存未命中或已过期，获取新数据
    logger.info(`Cache miss for key: ${key}`);
    
    try {
      const data = await fetcher();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      // 如果获取新数据失败，且有过期的缓存数据，返回过期数据
      if (cached) {
        logger.warn(`Using stale cache data for key: ${key}`);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * 设置缓存数据
   */
  set<T>(key: string, data: T, ttl?: number): void {
    if (!config.features.enableCache) {
      return;
    }

    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        logger.info(`Evicted oldest cache entry: ${oldestKey}`);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });

    logger.info(`Cached data for key: ${key}`);
  }

  /**
   * 删除指定缓存
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.info(`Deleted cache entry: ${key}`);
    }
    return deleted;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`Cleared ${size} cache entries`);
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    const stats = {
      totalEntries: entries.length,
      maxSize: this.maxSize,
      validEntries: 0,
      expiredEntries: 0,
      oldestEntry: null as string | null,
      newestEntry: null as string | null,
    };

    let oldestTime = Infinity;
    let newestTime = 0;

    for (const [key, entry] of entries) {
      const age = now - entry.timestamp;
      
      if (age < entry.ttl) {
        stats.validEntries++;
      } else {
        stats.expiredEntries++;
      }

      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        stats.oldestEntry = key;
      }

      if (entry.timestamp > newestTime) {
        newestTime = entry.timestamp;
        stats.newestEntry = key;
      }
    }

    return stats;
  }

  /**
   * 清理过期的缓存条目
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) >= entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired cache entries`);
    }

    return cleanedCount;
  }
}

// 创建全局缓存实例
export const apiCache = new MemoryCache();

// 定期清理过期缓存（每5分钟）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 5 * 60 * 1000);
}

// 生成缓存键的工具函数
export function generateCacheKey(prefix: string, params: Record<string, any> = {}): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return sortedParams ? `${prefix}:${sortedParams}` : prefix;
}
