/**
 * 分类页面预加载器 - 优化首次访问速度
 */

import { contentManager } from "../lib/content-manager";
import { getCategoryPageData } from "./unified-data-fetcher";

// 内存缓存
const categoryCache = new Map<string, any>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存
const cacheTimestamps = new Map<string, number>();

/**
 * 预加载热门分类数据
 */
export async function preloadPopularCategories() {
  try {
    // 只在开发环境显示详细日志
    if (import.meta.env.DEV) {
      console.log('🚀 开始预加载热门分类数据...');
    }

    // 获取所有文章来分析热门分类
    const posts = await contentManager.getSortedPosts();
    const categoryCount = new Map<string, number>();

    // 统计分类文章数量
    posts.forEach(post => {
      const category = post.data.category;
      if (category) {
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      }
    });

    // 获取前8个热门分类（增加预加载数量）
    const popularCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([category]) => category);

    if (import.meta.env.DEV) {
      console.log('📊 热门分类:', popularCategories);
    }
    
    // 并行预加载热门分类数据
    const preloadPromises = popularCategories.map(async (category) => {
      try {
        const data = await getCategoryPageData(category);
        categoryCache.set(category, data);
        cacheTimestamps.set(category, Date.now());
        if (import.meta.env.DEV) {
          console.log(`✅ 预加载分类成功: ${category}`);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn(`⚠️ 预加载分类失败: ${category}`, error);
        }
      }
    });

    await Promise.all(preloadPromises);
    if (import.meta.env.DEV) {
      console.log('🎉 热门分类预加载完成');
    }
    
  } catch (error) {
    console.error('❌ 预加载热门分类失败:', error);
  }
}

/**
 * 获取缓存的分类数据
 */
export async function getCachedCategoryData(category: string) {
  const now = Date.now();
  const cacheTime = cacheTimestamps.get(category);

  // 检查缓存是否有效
  if (categoryCache.has(category) && cacheTime && (now - cacheTime) < CACHE_DURATION) {
    if (import.meta.env.DEV) {
      console.log(`🎯 使用缓存数据: ${category}`);
    }
    return categoryCache.get(category);
  }

  // 缓存过期或不存在，重新获取
  if (import.meta.env.DEV) {
    console.log(`🔄 缓存过期，重新获取: ${category}`);
  }

  try {
    const startTime = Date.now();
    const data = await getCategoryPageData(category);
    const loadTime = Date.now() - startTime;

    categoryCache.set(category, data);
    cacheTimestamps.set(category, now);

    if (import.meta.env.DEV) {
      console.log(`✅ 分类数据获取完成: ${category} (${loadTime}ms)`);
    }

    return data;
  } catch (error) {
    console.error(`❌ 获取分类数据失败: ${category}`, error);
    throw error;
  }
}

/**
 * 预热指定分类（用于用户即将访问的分类）
 */
export async function preheatCategory(category: string) {
  if (!categoryCache.has(category)) {
    console.log(`🔥 预热分类: ${category}`);
    try {
      const data = await getCategoryPageData(category);
      categoryCache.set(category, data);
      cacheTimestamps.set(category, Date.now());
    } catch (error) {
      console.warn(`⚠️ 预热分类失败: ${category}`, error);
    }
  }
}

/**
 * 清除过期缓存
 */
export function clearExpiredCache() {
  const now = Date.now();
  const expiredKeys: string[] = [];
  
  cacheTimestamps.forEach((timestamp, key) => {
    if (now - timestamp > CACHE_DURATION) {
      expiredKeys.push(key);
    }
  });
  
  expiredKeys.forEach(key => {
    categoryCache.delete(key);
    cacheTimestamps.delete(key);
  });
  
  if (expiredKeys.length > 0) {
    console.log(`🧹 清除过期缓存: ${expiredKeys.join(', ')}`);
  }
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats() {
  return {
    cacheSize: categoryCache.size,
    cachedCategories: Array.from(categoryCache.keys()),
    oldestCache: Math.min(...Array.from(cacheTimestamps.values())),
    newestCache: Math.max(...Array.from(cacheTimestamps.values()))
  };
}

// 定期清理过期缓存
if (typeof setInterval !== 'undefined') {
  setInterval(clearExpiredCache, 60000); // 每分钟清理一次
}
