/**
 * 混合内容工具函数
 * 使用统一内容管理器提供一致的API接口
 */

import type { PostEntry } from "../types/post";
import { contentManager } from "../lib/content-manager";
import { logger } from "../config/api";

// 获取排序后的文章列表（使用统一内容管理器）
export async function getSortedPosts(): Promise<PostEntry[]> {
  logger.info('🔍 getSortedPosts 被调用');

  try {
    const posts = await contentManager.getSortedPosts();
    logger.success(`✅ 获取到 ${posts.length} 篇文章`);
    return posts;
  } catch (error) {
    logger.error('❌ 获取文章列表失败:', error);
    return [];
  }
}

// 根据 slug 获取单篇文章（使用统一内容管理器）
export async function getPostBySlug(slug: string): Promise<PostEntry | null> {
  logger.info('🔍 getPostBySlug 被调用，slug:', slug);

  try {
    const post = await contentManager.getPostBySlug(slug);

    if (post) {
      logger.success(`✅ 获取到文章: ${post.data.title}`);
      return post;
    } else {
      logger.warn(`⚠️ 未找到文章，slug: ${slug}`);
      return null;
    }
  } catch (error) {
    logger.error('❌ 获取文章失败:', error);
    return null;
  }
}

// 获取所有文章的 slug 列表（使用统一内容管理器）
export async function getAllPostSlugs(): Promise<string[]> {
  logger.info('🔍 getAllPostSlugs 被调用');

  try {
    const posts = await contentManager.getSortedPosts();
    const slugs = posts.map(post => post.slug);
    logger.success(`✅ 获取到 ${slugs.length} 个文章 slug`);
    return slugs;
  } catch (error) {
    logger.error('❌ 获取文章 slug 失败:', error);
    return [];
  }
}

// 标签类型定义
export type Tag = {
  name: string;
  count: number;
};

// 获取标签列表（使用统一内容管理器）
export async function getTagList(): Promise<Tag[]> {
  logger.info('🔍 getTagList 被调用');

  try {
    const posts = await contentManager.getSortedPosts();

    // 从文章中提取标签并统计
    const tagMap = new Map<string, number>();

    posts.forEach(post => {
      const tags = post.data.tags || [];
      tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });

    const tags: Tag[] = Array.from(tagMap.entries()).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count);

    logger.success(`✅ 获取到 ${tags.length} 个标签`);
    return tags;
  } catch (error) {
    logger.error('❌ 获取标签列表失败:', error);
    return [];
  }
}

// 分类类型定义
export type Category = {
  name: string;
  count: number;
  url: string;
};

// 获取分类列表（合并CMS和本地文章中的所有分类）
export async function getCategoryList(): Promise<Category[]> {
  logger.info('🔍 getCategoryList 被调用');

  try {
    // 首先获取所有文章来统计分类文章数量
    const posts = await contentManager.getSortedPosts();
    const categoryCountMap = new Map<string, number>();

    posts.forEach(post => {
      const category = post.data.category;
      if (category) {
        categoryCountMap.set(category, (categoryCountMap.get(category) || 0) + 1);
      }
    });

    // 创建一个Set来存储所有分类名称（避免重复）
    const allCategoryNames = new Set<string>();

    // 添加文章中的分类
    categoryCountMap.forEach((count, name) => {
      allCategoryNames.add(name);
    });

    // 尝试从Strapi获取所有分类并添加到集合中，同时建立名称到slug的映射
    const categorySlugMap = new Map<string, string>();
    try {
      const { getAllCategories } = await import('../lib/strapi');
      const strapiResponse = await getAllCategories();

      if (strapiResponse.data && strapiResponse.data.length > 0) {
        strapiResponse.data.forEach(category => {
          allCategoryNames.add(category.name);
          // 建立名称到slug的映射，优先使用slug，如果没有则使用名称
          categorySlugMap.set(category.name, category.slug || category.name);
        });
        logger.info(`📋 从Strapi获取到 ${strapiResponse.data.length} 个分类定义`);
      }
    } catch (strapiError) {
      logger.warn('⚠️ 无法从Strapi获取分类定义，仅使用文章中的分类:', strapiError);
    }

    // 合并所有分类
    const { getCategorySlug } = await import("../config/category-slugs");
    const categories: Category[] = Array.from(allCategoryNames).map(name => {
      // 使用slug系统生成URL
      const slug = getCategorySlug(name);
      return {
        name,
        count: categoryCountMap.get(name) || 0, // 显示文章数量，没有文章则为0
        url: `/categories/${slug}/`
      };
    }).sort((a, b) => {
      // 先按文章数量排序，再按名称排序
      if (a.count !== b.count) {
        return b.count - a.count;
      }
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    logger.success(`✅ 合并获取到 ${categories.length} 个分类（文章中: ${categoryCountMap.size} 个）`);
    return categories;
  } catch (error) {
    logger.error('❌ 获取分类列表失败:', error);
    return [];
  }
}

// 动态获取所有分类的 slug 到名称映射（使用API缓存系统）
async function getCategorySlugToNameMapping(): Promise<Record<string, string>> {
  try {
    const { getAllCategories } = await import('../lib/strapi');
    const response = await getAllCategories();

    const mapping: Record<string, string> = {};
    if (response.data && response.data.length > 0) {
      response.data.forEach(category => {
        if (category.slug && category.name) {
          mapping[category.slug] = category.name;
        }
      });
      logger.info(`🗂️ 动态获取到 ${Object.keys(mapping).length} 个分类映射`);
    } else {
      logger.warn('⚠️ 未获取到任何分类数据');
    }

    return mapping;
  } catch (error) {
    logger.error('❌ 获取分类映射失败，将尝试直接使用标识符:', error);
    return {};
  }
}

// 根据分类获取文章（使用统一内容管理器）
export async function getPostsByCategory(categorySlugOrName: string): Promise<PostEntry[]> {
  logger.info(`🔍 getPostsByCategory 被调用，分类标识: ${categorySlugOrName}`);

  try {
    const allPosts = await contentManager.getSortedPosts();

    // 动态获取分类映射
    const slugToNameMap = await getCategorySlugToNameMapping();

    // 多重匹配策略：
    // 1. 首先尝试 slug 到名称的映射
    let actualCategoryName = slugToNameMap[categorySlugOrName];

    // 2. 如果映射失败，直接使用原始标识符（可能本身就是名称）
    if (!actualCategoryName) {
      actualCategoryName = categorySlugOrName;
      logger.info(`🔄 未找到slug映射，直接使用标识符: "${categorySlugOrName}"`);
    } else {
      logger.info(`🔄 通过映射找到分类名称: "${categorySlugOrName}" -> "${actualCategoryName}"`);
    }

    // 3. 不区分大小写的匹配
    const categoryPosts = allPosts.filter(post => {
      const postCategory = post.data.category;
      if (!postCategory) return false;

      return postCategory.toLowerCase() === actualCategoryName.toLowerCase();
    });

    logger.success(`✅ 获取到分类 ${actualCategoryName} 的 ${categoryPosts.length} 篇文章`);
    return categoryPosts;
  } catch (error) {
    logger.error(`❌ 获取分类 ${categorySlugOrName} 的文章失败:`, error);
    return [];
  }
}

// 获取分类的布局类型
export async function getCategoryLayoutType(categoryIdentifier: string): Promise<'grid' | 'masonry'> {
  console.log(`🎨 getCategoryLayoutType 被调用，分类标识: ${categoryIdentifier}`);

  try {
    // 尝试从Strapi获取分类信息
    const { getCategoryByName, getCategoryBySlug } = await import('../lib/strapi');

    // 先尝试按slug查找（因为URL现在使用slug）
    console.log(`🔍 尝试按slug查找分类: ${categoryIdentifier}`);
    let response = await getCategoryBySlug(categoryIdentifier);

    // 如果按slug找不到，再尝试按名称查找（向后兼容）
    if (!response.data || response.data.length === 0) {
      console.log(`🔍 按slug未找到，尝试按名称查找: ${categoryIdentifier}`);
      response = await getCategoryByName(categoryIdentifier);
    }

    console.log(`📡 Strapi最终响应:`, response);

    if (response.data && response.data.length > 0) {
      const category = response.data[0];
      console.log(`📋 分类详细信息:`, category);

      const layoutType = category.layout_type || 'grid';
      console.log(`✅ 获取到分类 ${categoryIdentifier} 的布局类型: ${layoutType}`);
      return layoutType;
    } else {
      console.log(`⚠️ 未找到分类 ${categoryIdentifier}，使用默认布局`);
    }
  } catch (error) {
    console.error(`❌ 从Strapi获取分类布局类型失败:`, error);
  }

  // 默认返回网格布局
  console.log(`🔄 返回默认布局类型: grid`);
  return 'grid';
}

// 根据标签获取文章（使用统一内容管理器）
export async function getPostsByTag(tag: string): Promise<PostEntry[]> {
  logger.info(`🔍 getPostsByTag 被调用，标签: ${tag}`);

  try {
    const allPosts = await contentManager.getSortedPosts();
    const tagPosts = allPosts.filter(post =>
      post.data.tags?.some(postTag => postTag.toLowerCase() === tag.toLowerCase())
    );

    logger.success(`✅ 获取到标签 ${tag} 的 ${tagPosts.length} 篇文章`);
    return tagPosts;
  } catch (error) {
    logger.error(`❌ 获取标签 ${tag} 的文章失败:`, error);
    return [];
  }
}

// 重新导出 Strapi 函数
export { getAllCategories } from '../lib/strapi';
