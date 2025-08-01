/**
 * Strapi API 客户端
 * 用于从 Strapi CMS 获取内容数据
 */

import { APIError, NetworkError, retryWithBackoff } from './errors';
import { config, API_ENDPOINTS, logger } from '../config/api';
import { apiCache, generateCacheKey } from './cache';

// Strapi API 配置
const STRAPI_URL = config.strapi.url;
const API_BASE = `${STRAPI_URL}/api`;
const API_TOKEN = config.strapi.apiToken;
const REQUEST_TIMEOUT = config.strapi.timeout;

// 类型定义 - Strapi v5 扁平化结构
export interface StrapiCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  sortOrder: number;
  layout_type: 'list' | 'grid' | 'masonry';
  banner_image?: {
    id: number;
    url: string;
    alternativeText?: string;
    width: number;
    height: number;
  };
  banner_position?: 'top' | 'center' | 'bottom';
}

export interface StrapiIndex {
  id: number;
  site_title?: string;
  site_subtitle?: string;
  site_description?: string;
  default_homepage_layout?: 'list' | 'grid' | 'masonry';
  grid_columns_mobile?: number;
  grid_columns_tablet?: number;
  grid_columns_desktop?: number;
  grid_columns_wide?: number;
  banner_image?: {
    id: number;
    url: string;
    alternativeText?: string;
    width: number;
    height: number;
  };
  banner_position?: 'top' | 'center' | 'bottom';
  banner_credit_enable?: boolean;
  banner_credit_text?: string;
  banner_credit_url?: string;
  show_author_section?: boolean;
  logo_light?: {
    id: number;
    url: string;
    alternativeText?: string;
    width: number;
    height: number;
  };
  logo_dark?: {
    id: number;
    url: string;
    alternativeText?: string;
    width: number;
    height: number;
  };
}

export interface StrapiTag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
}

// Strapi v5 扁平化数据结构
export interface StrapiArticle {
  id: number;
  title: string;
  slug: string;
  description?: string;
  content: string;
  published: string;
  updated?: string;
  draft: boolean;
  image?: {
    id: number;
    name: string;
    alternativeText?: string;
    caption?: string;
    width: number;
    height: number;
    formats?: any;
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl?: string;
    provider: string;
    provider_metadata?: any;
    createdAt: string;
    updatedAt: string;
  } | null;
  category?: {
    id: number;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    icon?: string;
    sortOrder?: number;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  } | null;
  tags?: Array<{
    id: number;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  }>;
  author?: {
    id: number;
    name: string;
    slug?: string;
    email?: string;
    bio?: string;
    website?: string;
    github?: string;
    twitter?: string;
    linkedin?: string;
    avatar?: {
      id: number;
      url: string;
      name: string;
      alternativeText?: string;
    } | null;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  } | null;
  featured: boolean;
  viewCount: number;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  documentId: string;
}

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// API 请求函数，支持认证、超时和错误处理
async function fetchAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE}${endpoint}`;

  // 创建AbortController用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // 如果有API令牌，添加认证头
    if (API_TOKEN) {
      headers['Authorization'] = `Bearer ${API_TOKEN}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // 在开发环境中，401错误不应该显示给用户，只记录到控制台
      const errorMessage = `Strapi API error: ${response.status} ${response.statusText}`;

      if (response.status === 401) {
        console.warn(`🔐 ${errorMessage} (endpoint: ${endpoint})`);
        console.warn('💡 这通常是因为 STRAPI_API_TOKEN 未配置或无效');

        // 在开发环境中，对于401错误直接返回空数据而不是抛出错误
        if (import.meta.env.DEV) {
          console.warn('🔧 开发环境：返回空数据而不是抛出401错误');

          // 根据endpoint返回适当的空数据结构
          if (endpoint.includes('/articles')) {
            return { data: [], meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } } };
          } else if (endpoint.includes('/categories')) {
            return { data: [], meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } } };
          } else if (endpoint.includes('/index')) {
            return { data: null };
          } else if (endpoint.includes('/authors')) {
            return { data: [], meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } } };
          } else {
            return { data: null };
          }
        }

        // 生产环境仍然抛出错误
        const silentError = new APIError(errorMessage, response.status, endpoint);
        silentError.name = 'SilentAPIError';
        throw silentError;
      } else {
        console.error(`❌ ${errorMessage} (endpoint: ${endpoint})`);
        throw new APIError(errorMessage, response.status, endpoint);
      }
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new NetworkError(`Request timeout after ${REQUEST_TIMEOUT}ms`, error);
      }

      if (error.message.includes('fetch')) {
        throw new NetworkError(`Network error: ${error.message}`, error);
      }
    }

    throw new APIError('Unknown API error', 500, endpoint, error as Error);
  }
}

// 获取所有文章（带重试机制）
export async function getAllArticles(): Promise<StrapiResponse<StrapiArticle[]>> {
  if (!config.features.enableRetry) {
    return fetchAPI(`${API_ENDPOINTS.articles}?populate[0]=image&populate[1]=category&populate[2]=tags&populate[3]=author.avatar&sort=published:desc`);
  }

  return retryWithBackoff(
    async () => {
      return fetchAPI(`${API_ENDPOINTS.articles}?populate[0]=image&populate[1]=category&populate[2]=tags&populate[3]=author.avatar&sort=published:desc`);
    },
    config.api.retryAttempts,
    config.api.retryBaseDelay
  );
}

// 获取已发布的文章（带缓存和重试机制）
export async function getPublishedArticles(): Promise<StrapiResponse<StrapiArticle[]>> {
  const cacheKey = generateCacheKey('published-articles');

  return apiCache.get(cacheKey, async () => {
    const fetchFunction = async () => {
      const result = await fetchAPI(`${API_ENDPOINTS.articles}?populate[0]=image&populate[1]=category&populate[2]=tags&populate[3]=author.avatar&filters[draft][$eq]=false&sort=published:desc`);

      // 调试：检查第一篇文章的 SEO 字段
      if (result.data && result.data.length > 0 && config.development.enableDebugLogs) {
        const firstArticle = result.data[0];
        logger.info('SEO Fields Debug:', {
          metaTitle: firstArticle.metaTitle,
          metaDescription: firstArticle.metaDescription,
          keywords: firstArticle.keywords,
          slug: firstArticle.slug,
          title: firstArticle.title
        });
      }

      return result;
    };

    if (!config.features.enableRetry) {
      return fetchFunction();
    }

    return retryWithBackoff(
      fetchFunction,
      config.api.retryAttempts,
      config.api.retryBaseDelay
    );
  });
}

// 根据 slug 获取单篇文章
export async function getArticleBySlug(slug: string): Promise<StrapiResponse<StrapiArticle[]>> {
  // 添加时间戳参数来破坏缓存，确保获取最新数据
  const timestamp = Date.now();
  return fetchAPI(`/articles?populate[0]=image&populate[1]=category&populate[2]=tags&populate[3]=author.avatar&filters[slug][$eq]=${slug}&_t=${timestamp}`);
}

// 根据分类获取文章 - 优化查询，只获取必要字段，添加缓存
export async function getArticlesByCategory(category: string): Promise<StrapiResponse<StrapiArticle[]>> {
  const cacheKey = generateCacheKey(`category-articles-${category}`);

  return apiCache.get(cacheKey, async () => {
    const fetchFunction = async () => {
      return fetchAPI(`/articles?populate[0]=image&populate[1]=category&populate[2]=tags&populate[3]=author.avatar&filters[category][$eq]=${category}&filters[draft][$eq]=false&sort=published:desc`);
    };

    if (!config.features.enableRetry) {
      return fetchFunction();
    }

    return retryWithBackoff(
      fetchFunction,
      config.api.retryAttempts,
      config.api.retryBaseDelay
    );
  }, config.cache.contentTtl.categories);
}

// 根据标签获取文章
export async function getArticlesByTag(tag: string): Promise<StrapiResponse<StrapiArticle[]>> {
  return fetchAPI(`/articles?populate=*&filters[tags][$contains]=${tag}&filters[draft][$eq]=false&sort=published:desc`);
}

// 获取所有分类 - 添加缓存
export async function getAllCategories(): Promise<StrapiResponse<StrapiCategory[]>> {
  const cacheKey = generateCacheKey('all-categories');

  return apiCache.get(cacheKey, async () => {
    const fetchFunction = async () => {
      return fetchAPI(`/categories?populate[banners][populate]=image&sort=sortOrder:asc,name:asc`);
    };

    if (!config.features.enableRetry) {
      return fetchFunction();
    }

    return retryWithBackoff(
      fetchFunction,
      config.api.retryAttempts,
      config.api.retryBaseDelay
    );
  }, config.cache.contentTtl.categories);
}

// 根据slug获取单个分类信息
export async function getCategoryBySlug(slug: string): Promise<StrapiResponse<StrapiCategory[]>> {
  const url = `/categories?filters[slug][$eq]=${encodeURIComponent(slug)}`;

  try {
    const result = await fetchAPI(url);

    // 在客户端进行精确匹配，因为 Strapi 过滤器可能不够精确
    if (result.data && result.data.length > 0) {
      const exactMatch = result.data.filter(category => category.slug === slug);

      return {
        ...result,
        data: exactMatch
      };
    }

    return result;
  } catch (error) {
    console.error(`❌ getCategoryBySlug 失败:`, error);
    throw error;
  }
}

// 根据名称获取单个分类信息
export async function getCategoryByName(name: string): Promise<StrapiResponse<StrapiCategory[]>> {
  console.log(`🔍 getCategoryByName 被调用，name: ${name}`);
  const url = `/categories?filters[name][$eq]=${encodeURIComponent(name)}`;
  console.log(`📡 请求URL: ${url}`);

  try {
    const result = await fetchAPI(url);
    console.log(`✅ getCategoryByName 响应:`, result);
    return result;
  } catch (error) {
    console.error(`❌ getCategoryByName 失败:`, error);
    throw error;
  }
}

// 获取Index配置信息
export async function getIndexSettings(): Promise<StrapiResponse<StrapiIndex>> {
  // 使用具体的populate参数来确保获取Banner中的图片数据
  const url = `/index?populate[0]=logo_light&populate[1]=logo_dark&populate[2]=home_banners.image`;

  try {
    const result = await fetchAPI(url);

    // 调试信息
    if (import.meta.env.DEV) {
      console.log('🔍 Strapi getIndexSettings 调试:', {
        url: url,
        result: result,
        hasData: !!result.data,
        dataType: typeof result.data
      });
    }

    return result;
  } catch (error) {
    console.error(`获取Index设置失败:`, error);
    throw error;
  }
}

// 获取特色文章
export async function getFeaturedArticles(): Promise<StrapiResponse<StrapiArticle[]>> {
  return fetchAPI('/articles?populate=*&filters[featured][$eq]=true&filters[draft][$eq]=false&sort=published:desc');
}

// 搜索文章
export async function searchArticles(query: string): Promise<StrapiResponse<StrapiArticle[]>> {
  const encodedQuery = encodeURIComponent(query);
  return fetchAPI(`/articles?populate=*&filters[$or][0][title][$containsi]=${encodedQuery}&filters[$or][1][description][$containsi]=${encodedQuery}&filters[$or][2][content][$containsi]=${encodedQuery}&filters[draft][$eq]=false&sort=published:desc`);
}



// 获取主要作者信息（用于侧边栏显示）
export async function getPrimaryAuthor(): Promise<any> {
  try {
    const result = await fetchAPI('/authors?populate=avatar&sort=id:asc&pagination[limit]=1');
    if (result.data && result.data.length > 0) {
      const authorData = result.data[0]; // Strapi v5 扁平化结构

      // 处理头像URL - Strapi v5结构，头像是数组
      let avatarUrl = null;

      if (authorData.avatar && Array.isArray(authorData.avatar) && authorData.avatar.length > 0) {
        const avatar = authorData.avatar[0];

        if (avatar.url.startsWith('/')) {
          // 相对路径，需要添加浏览器可访问的Strapi URL
          const strapiPublicUrl = import.meta.env.STRAPI_PUBLIC_URL || import.meta.env.STRAPI_URL || 'https://api.sparkdone.com';
          avatarUrl = `${strapiPublicUrl}${avatar.url}`;
        } else {
          // 绝对路径，直接使用
          avatarUrl = avatar.url;
        }

      }

      return {
        name: authorData.name,
        slug: authorData.slug,
        bio: authorData.bio,
        email: authorData.email,
        website: authorData.website,
        github: authorData.github,
        twitter: authorData.twitter,
        linkedin: authorData.linkedin,
        avatar: avatarUrl
      };
    }
    return null;
  } catch (error) {
    console.error('获取主要作者信息失败:', error);
    return null;
  }
}

// 获取友情链接
export async function getFriendLinks(): Promise<StrapiResponse<any[]>> {
  const cacheKey = generateCacheKey('friend-links');

  return apiCache.get(cacheKey, async () => {
    const fetchFunction = async () => {
      return await fetchAPI(`${API_ENDPOINTS.friendLinks}?populate=*&sort=sort_order:asc,createdAt:desc&filters[publishedAt][$notNull]=true`);
    };

    if (!config.features.enableRetry) {
      return fetchFunction();
    }

    return retryWithBackoff(fetchFunction, {
      maxRetries: config.api.maxRetries,
      baseDelay: config.api.retryDelay,
      maxDelay: config.api.maxRetryDelay,
      backoffFactor: config.api.backoffFactor
    });
  }, config.cache.defaultTTL);
}


