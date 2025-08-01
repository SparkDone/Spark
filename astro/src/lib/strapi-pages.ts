/**
 * Strapi页面获取工具
 * 精简版，用于获取Page内容类型数据
 */

import { config, logger } from '../config/api';

// 页面类型定义
export interface StrapiPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
}

// 获取页面数据
async function fetchPage(slug: string): Promise<StrapiPage | null> {
  try {
    const url = `${config.api.baseUrl}/api/pages?filters[slug][$eq]=${slug}`;

    // 构建请求头，包含认证信息
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 添加认证头
    if (config.strapi.apiToken) {
      headers['Authorization'] = `Bearer ${config.strapi.apiToken}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) throw new Error(`API错误: ${response.status}`);

    const data = await response.json();
    const pageData = data.data?.[0];

    if (!pageData) return null;

    return {
      id: pageData.id,
      title: pageData.title,
      slug: pageData.slug,
      content: pageData.content,
      metaTitle: pageData.metaTitle,
      metaDescription: pageData.metaDescription,
      isActive: pageData.isActive
    };
  } catch (error) {
    logger.warn(`获取页面 ${slug} 失败:`, error);
    return null;
  }
}

// 获取所有页面（用于静态构建）
export async function getAllPages(): Promise<StrapiPage[]> {
  try {
    const url = `${config.api.baseUrl}/api/pages`;

    // 构建请求头，包含认证信息
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 添加认证头
    if (config.strapi.apiToken) {
      headers['Authorization'] = `Bearer ${config.strapi.apiToken}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) throw new Error(`API错误: ${response.status}`);

    const data = await response.json();
    return data.data?.map((item: any) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      content: item.content,
      metaTitle: item.metaTitle,
      metaDescription: item.metaDescription,
      isActive: item.isActive
    })) || [];
  } catch (error) {
    logger.error('获取所有页面失败:', error);
    return []; // 静态构建时返回空数组
  }
}

// 主要导出函数
export async function getPageBySlug(slug: string): Promise<StrapiPage | null> {
  return fetchPage(slug);
}
