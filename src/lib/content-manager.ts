/**
 * 统一内容管理器
 * 整合本地内容和Strapi内容的获取逻辑
 */

import type { PostEntry } from "../types/post";
import { config, logger } from '../config/api';
import { apiCache, generateCacheKey } from './cache';
import { withErrorBoundary } from './errors';

// 本地内容已移除，只使用Strapi内容
import * as strapiUtils from "../utils/strapi-content-utils";

export interface ContentManagerOptions {
  useCache?: boolean;
  cacheTTL?: number;
  enableFallback?: boolean;
}

export class ContentManager {
  private useStrapi: boolean;
  private useHybridMode: boolean;
  private options: Required<ContentManagerOptions>;

  constructor(options: ContentManagerOptions = {}) {
    this.useStrapi = config.features.useStrapi;
    this.useHybridMode = config.features.useHybridMode;
    this.options = {
      useCache: options.useCache ?? config.features.enableCache,
      cacheTTL: options.cacheTTL ?? config.cache.ttl,
      enableFallback: options.enableFallback ?? true,
    };
  }

  /**
   * 获取排序后的文章列表
   */
  async getSortedPosts(): Promise<PostEntry[]> {
    const cacheKey = generateCacheKey('sorted-posts', {
      useStrapi: this.useStrapi,
      useHybridMode: this.useHybridMode
    });

    // 只使用Strapi内容
    return this.getStrapiPostsWithFallback(cacheKey);
  }

  /**
   * 根据slug获取单篇文章
   */
  async getPostBySlug(slug: string): Promise<PostEntry | undefined> {
    const cacheKey = generateCacheKey('post-by-slug', { slug, useStrapi: this.useStrapi });

    // 只使用Strapi内容
    return this.getStrapiPostBySlugWithFallback(slug, cacheKey);
  }

  /**
   * 获取文章总数
   */
  async getPostCount(): Promise<number> {
    const posts = await this.getSortedPosts();
    return posts.length;
  }

  /**
   * 获取分页文章
   */
  async getPaginatedPosts(page: number = 1, pageSize: number = 10): Promise<{
    posts: PostEntry[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const allPosts = await this.getSortedPosts();
    const total = allPosts.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const posts = allPosts.slice(startIndex, startIndex + pageSize);

    return {
      posts,
      total,
      totalPages,
      currentPage: page,
    };
  }

  /**
   * 根据标签获取文章
   */
  async getPostsByTag(tag: string): Promise<PostEntry[]> {
    const allPosts = await this.getSortedPosts();
    return allPosts.filter(post => 
      post.data.tags && post.data.tags.includes(tag)
    );
  }

  /**
   * 根据分类获取文章
   */
  async getPostsByCategory(category: string): Promise<PostEntry[]> {
    const allPosts = await this.getSortedPosts();
    return allPosts.filter(post => 
      post.data.category === category
    );
  }

  /**
   * 搜索文章
   */
  async searchPosts(query: string): Promise<PostEntry[]> {
    const allPosts = await this.getSortedPosts();
    const searchTerm = query.toLowerCase();
    
    return allPosts.filter(post => {
      const title = post.data.title.toLowerCase();
      const content = post.body?.toLowerCase() || '';
      const tags = post.data.tags?.join(' ').toLowerCase() || '';
      
      return title.includes(searchTerm) || 
             content.includes(searchTerm) || 
             tags.includes(searchTerm);
    });
  }

  /**
   * 从Strapi获取文章（带降级处理）
   */
  private async getStrapiPostsWithFallback(cacheKey: string): Promise<PostEntry[]> {
    if (!this.options.useCache) {
      return this.fetchStrapiPosts();
    }

    return apiCache.get(cacheKey, async () => {
      return this.fetchStrapiPosts();
    }, this.options.cacheTTL);
  }

  /**
   * 从Strapi获取单篇文章（带降级处理）
   */
  private async getStrapiPostBySlugWithFallback(
    slug: string, 
    cacheKey: string
  ): Promise<PostEntry | undefined> {
    if (!this.options.useCache) {
      return this.fetchStrapiPostBySlug(slug);
    }

    return apiCache.get(cacheKey, async () => {
      return this.fetchStrapiPostBySlug(slug);
    }, this.options.cacheTTL);
  }

  // 本地内容方法已移除，只使用Strapi内容

  /**
   * 实际从Strapi获取文章
   */
  private async fetchStrapiPosts(): Promise<PostEntry[]> {
    return withErrorBoundary(
      async () => {
        logger.info('正在从Strapi获取文章列表...');
        const posts = await strapiUtils.getSortedPosts();
        logger.success(`从Strapi获取到 ${posts.length} 篇文章`);
        return posts;
      },
      this.options.enableFallback ? [] : [],
      'fetchStrapiPosts'
    );
  }

  /**
   * 实际从Strapi获取单篇文章
   */
  private async fetchStrapiPostBySlug(slug: string): Promise<PostEntry | undefined> {
    return withErrorBoundary(
      async () => {
        logger.info(`正在从Strapi获取文章: ${slug}`);
        const post = await strapiUtils.getPostBySlug(slug);
        if (post) {
          logger.success(`成功获取文章: ${post.data.title}`);
        } else {
          logger.warn(`未找到文章: ${slug}`);
        }
        return post;
      },
      undefined,
      'fetchStrapiPostBySlug'
    );
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    apiCache.clear();
    logger.info('内容管理器缓存已清空');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return apiCache.getStats();
  }

  // 混合模式方法已移除，只使用Strapi内容

  // fetchHybridPosts方法已移除，只使用Strapi内容
}

// 创建默认实例
export const contentManager = new ContentManager();

// 导出便捷函数
export const getSortedPosts = () => contentManager.getSortedPosts();
export const getPostBySlug = (slug: string) => contentManager.getPostBySlug(slug);
export const getPostCount = () => contentManager.getPostCount();
export const getPaginatedPosts = (page: number, pageSize: number) => 
  contentManager.getPaginatedPosts(page, pageSize);
export const getPostsByTag = (tag: string) => contentManager.getPostsByTag(tag);
export const getPostsByCategory = (category: string) => contentManager.getPostsByCategory(category);
export const searchPosts = (query: string) => contentManager.searchPosts(query);
