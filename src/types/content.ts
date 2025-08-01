/**
 * 内容相关的TypeScript类型定义
 * 提供严格的类型安全和更好的开发体验
 */

import type { PostEntry } from "./post";

// 基础内容类型
export interface BaseContent {
  id: string;
  slug: string;
  title: string;
  published: Date;
  updated?: Date;
  draft?: boolean;
}

// 文章数据类型
export interface PostData extends BaseContent {
  description?: string;
  image?: string;
  tags: string[];
  category: string;
  author?: Author | string;
  viewCount?: number;
  readingTime?: number;
  featured?: boolean;
  
  // SEO相关
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  
  // Strapi特有字段
  strapiId?: number;
}

// 作者类型
export interface Author {
  id?: string | number;
  name: string;
  slug?: string;
  bio?: string;
  email?: string;
  website?: string;
  avatar?: string;
  social?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
}

// 分类类型
export interface Category {
  id?: string | number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  layout_type?: 'list' | 'grid';
}

// 标签类型
export interface Tag {
  id?: string | number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

// 扩展的文章条目类型
export interface ExtendedPostEntry extends PostEntry {
  data: PostData;
}

// 分页结果类型
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage?: number;
  prevPage?: number;
}

// 搜索结果类型
export interface SearchResult {
  posts: PostEntry[];
  query: string;
  total: number;
  searchTime: number;
}

// 内容统计类型
export interface ContentStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalCategories: number;
  totalTags: number;
  totalAuthors: number;
  totalViews: number;
  averageReadingTime: number;
}

// API响应类型
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Strapi响应类型
export interface StrapiResponse<T = any> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// Strapi v5 文章属性类型 (扁平化结构)
export interface StrapiArticleAttributes {
  title: string;
  slug: string;
  content: string;
  description?: string;
  published: string;
  updated?: string;
  draft: boolean;
  viewCount?: number;

  // 关联数据 - Strapi v5 扁平化结构
  image?: {
    url: string;
    alternativeText?: string;
    caption?: string;
  };

  category?: {
    name: string;
    slug: string;
  };

  tags?: Array<{
    name: string;
    slug: string;
  }>;

  author?: {
    name: string;
    slug?: string;
    bio?: string;
    email?: string;
    avatar?: Array<{
      url: string;
    }>;
  };

  // SEO字段
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
}

// Strapi文章类型
export interface StrapiArticle {
  id: number;
  attributes: StrapiArticleAttributes;
}

// 内容管理器选项类型
export interface ContentManagerOptions {
  useCache?: boolean;
  cacheTTL?: number;
  enableFallback?: boolean;
  source?: 'strapi' | 'local' | 'auto';
}

// 缓存条目类型
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

// 缓存统计类型
export interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  hitRate: number;
  missRate: number;
  oldestEntry?: string;
  newestEntry?: string;
  totalSize: number;
}

// 错误类型
export interface ErrorInfo {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  context?: string;
}



// 系统健康状态类型
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  responseTime: string;
  version: string;
  environment: string;
  checks: {
    strapi: {
      status: 'healthy' | 'unhealthy';
      message: string;
      url?: string;
    };
    cache: {
      status: 'healthy' | 'unhealthy';
      stats: CacheStats;
    };
    config: {
      status: 'healthy' | 'warning' | 'unhealthy';
      message: string;
      issues?: string[];
    };
  };
}

// 配置类型
export interface AppConfig {
  strapi: {
    url: string;
    apiToken?: string;
    timeout: number;
  };
  api: {
    retryAttempts: number;
    retryBaseDelay: number;

  };
  cache: {
    ttl: number;
    maxSize: number;
  };
  features: {
    useStrapi: boolean;
    useHybridMode: boolean;

    enableCache: boolean;
    enableRetry: boolean;
  };
  development: {
    enableDebugLogs: boolean;
    showErrorDetails: boolean;
  };
}

// 类型守卫函数
export function isPostEntry(entry: any): entry is PostEntry {
  return entry && 
         typeof entry.id === 'string' &&
         typeof entry.slug === 'string' &&
         entry.data &&
         typeof entry.data.title === 'string';
}

export function isStrapiArticle(article: any): article is StrapiArticle {
  return article &&
         typeof article.id === 'number' &&
         article.attributes &&
         typeof article.attributes.title === 'string';
}

export function isAuthor(author: any): author is Author {
  return author &&
         typeof author.name === 'string';
}

// 工具类型
export type PostStatus = 'published' | 'draft' | 'archived';
export type ContentSource = 'strapi' | 'local';
export type SortOrder = 'asc' | 'desc';
export type SortField = 'published' | 'updated' | 'title' | 'viewCount';

// 查询选项类型
export interface QueryOptions {
  page?: number;
  pageSize?: number;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  category?: string;
  tags?: string[];
  author?: string;
  status?: PostStatus;
  search?: string;
}
