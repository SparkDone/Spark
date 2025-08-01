/**
 * Strapi 内容工具函数
 * 从 Strapi CMS 获取内容数据的工具函数
 */

import type { PostEntry } from "../types/post";
import { getPublishedArticles, getArticleBySlug, getArticlesByCategory, getArticlesByTag } from "@/lib/strapi";
import { adaptStrapiArticles, adaptStrapiArticle, addNavigationInfo, getTagsFromArticles, getCategoriesFromArticles } from "@/lib/strapi-adapter";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";

// 获取排序后的文章列表
export async function getSortedPosts(): Promise<PostEntry[]> {
  try {
    const response = await getPublishedArticles();
    const articles = adaptStrapiArticles(response.data);
    return await addNavigationInfo(articles);
  } catch (error) {
    console.error('Error fetching posts from Strapi:', error);
    // 如果 Strapi 不可用，返回空数组
    return [];
  }
}

// 根据 slug 获取单篇文章
export async function getPostBySlug(slug: string): Promise<PostEntry | null> {
  try {
    const response = await getArticleBySlug(slug);
    if (response.data.length > 0) {
      return adaptStrapiArticle(response.data[0]);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching post with slug ${slug} from Strapi:`, error);
    return null;
  }
}

// 获取所有文章的 slug 列表（用于静态路径生成）
export async function getAllPostSlugs(): Promise<string[]> {
  try {
    const response = await getPublishedArticles();
    return response.data.map(article => article.attributes.slug);
  } catch (error) {
    console.error('Error fetching post slugs from Strapi:', error);
    return [];
  }
}

// 标签类型定义
export type Tag = {
  name: string;
  count: number;
};

// 获取标签列表
export async function getTagList(): Promise<Tag[]> {
  try {
    const response = await getPublishedArticles();
    const articles = adaptStrapiArticles(response.data);
    return getTagsFromArticles(articles);
  } catch (error) {
    console.error('Error fetching tags from Strapi:', error);
    return [];
  }
}

// 分类类型定义
export type Category = {
  name: string;
  count: number;
  url: string;
};

// 获取分类列表
export async function getCategoryList(): Promise<Category[]> {
  try {
    const response = await getPublishedArticles();
    const articles = adaptStrapiArticles(response.data);
    const categories = getCategoriesFromArticles(articles);
    
    // 处理未分类的情况
    return categories.map(category => ({
      ...category,
      name: category.name === 'Uncategorized' ? i18n(I18nKey.uncategorized) : category.name,
    }));
  } catch (error) {
    console.error('Error fetching categories from Strapi:', error);
    return [];
  }
}

// 根据分类获取文章
export async function getPostsByCategory(category: string): Promise<PostEntry[]> {
  try {
    const response = await getArticlesByCategory(category);
    const articles = adaptStrapiArticles(response.data);
    return await addNavigationInfo(articles);
  } catch (error) {
    console.error(`Error fetching posts for category ${category} from Strapi:`, error);
    return [];
  }
}

// 根据标签获取文章
export async function getPostsByTag(tag: string): Promise<PostEntry[]> {
  try {
    const response = await getArticlesByTag(tag);
    const articles = adaptStrapiArticles(response.data);
    return await addNavigationInfo(articles);
  } catch (error) {
    console.error(`Error fetching posts for tag ${tag} from Strapi:`, error);
    return [];
  }
}

// 获取所有分类的 slug 列表（用于静态路径生成）
export async function getAllCategorySlugs(): Promise<string[]> {
  try {
    const categories = await getCategoryList();
    return categories.map(category => 
      category.name.toLowerCase().replace(/\s+/g, '-')
    );
  } catch (error) {
    console.error('Error fetching category slugs from Strapi:', error);
    return [];
  }
}

// 获取所有标签的 slug 列表（用于静态路径生成）
export async function getAllTagSlugs(): Promise<string[]> {
  try {
    const tags = await getTagList();
    return tags.map(tag => 
      tag.name.toLowerCase().replace(/\s+/g, '-')
    );
  } catch (error) {
    console.error('Error fetching tag slugs from Strapi:', error);
    return [];
  }
}
