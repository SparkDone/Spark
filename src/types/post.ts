/**
 * 文章类型定义 - 替代 astro:content 的 CollectionEntry
 * 用于混合模式下的类型安全
 */

// 基础文章数据类型
export interface PostData {
  title: string;
  published: Date;
  updated?: Date;
  draft?: boolean;
  description?: string;
  image?: string;
  tags: string[];
  category: string;
  categorySlug?: string;
  
  // 导航信息
  prevTitle?: string;
  prevSlug?: string;
  nextTitle?: string;
  nextSlug?: string;
  
  // SEO相关
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  
  // Strapi特有字段
  strapiId?: number;
  author?: string;
  viewCount?: number;
  readingTime?: number;
  featured?: boolean;
}

// 文章条目类型 - 替代 CollectionEntry<'posts'>
export interface PostEntry {
  id: string;
  slug: string;
  body: string;
  collection: 'posts';
  data: PostData;
  render: () => Promise<{
    Content: any;
    headings: any[];
    remarkPluginFrontmatter: {
      words: number;
      minutes: number;
      excerpt: string;
    };
  }>;
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
  url?: string;
  count?: number;
}

// 标签类型
export interface Tag {
  id?: string | number;
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  count?: number;
}

// 分页信息类型
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 搜索结果类型
export interface SearchResult {
  posts: PostEntry[];
  totalCount: number;
  query: string;
}
