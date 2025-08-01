/**
 * Banner数据适配器
 * 负责从Strapi获取Banner数据并转换为前端所需格式
 */

import { getIndexSettings, getAllCategories } from './strapi';
import type { BannerImage } from '../data/banners';
import { adaptImageUrl } from '../utils/image-adapter';

/**
 * 检查首页Banner是否启用
 */
export async function isHomeBannerEnabled(): Promise<boolean> {
  try {
    const response = await getIndexSettings();
    return response.data?.enable_home_banner !== false; // 默认启用
  } catch (error) {
    console.error('检查首页Banner开关失败:', error);
    return true; // 出错时默认启用
  }
}

/**
 * 从Strapi获取首页Banner数据
 */
export async function getHomeBannersFromStrapi(): Promise<BannerImage[]> {
  try {
    // 首先检查是否启用Banner
    const isEnabled = await isHomeBannerEnabled();
    if (!isEnabled) {
      return [];
    }

    const response = await getIndexSettings();

    if (!response.data?.home_banners) {
      return [];
    }

    const banners = response.data.home_banners
      .filter((banner: any) => banner.isActive !== false) // 只获取激活的Banner
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) // 按排序字段排序
      .map((banner: any) => adaptBannerData(banner)); // 转换数据格式

    return banners;

  } catch (error) {
    console.error('从Strapi获取首页Banner失败:', error);
    return [];
  }
}

/**
 * 检查分类Banner是否启用
 */
export async function isCategoryBannerEnabled(categorySlug: string): Promise<boolean> {
  try {
    const response = await getAllCategories();

    if (!response.data) {
      return true; // 默认启用
    }

    // 查找匹配的分类
    const category = response.data.find((cat: any) =>
      cat.slug === categorySlug || cat.name === categorySlug
    );

    return category?.enable_banner !== false; // 默认启用
  } catch (error) {
    console.error(`检查分类Banner开关失败 (${categorySlug}):`, error);
    return true; // 出错时默认启用
  }
}

/**
 * 从Strapi获取分类Banner数据
 */
export async function getCategoryBannersFromStrapi(categorySlug: string): Promise<BannerImage[]> {
  try {
    // 首先检查是否启用Banner
    const isEnabled = await isCategoryBannerEnabled(categorySlug);
    if (!isEnabled) {
      return [];
    }

    const response = await getAllCategories();

    if (!response.data) {
      return [];
    }

    // 查找匹配的分类
    const category = response.data.find((cat: any) =>
      cat.slug === categorySlug || cat.name === categorySlug
    );

    if (!category?.banners || !Array.isArray(category.banners)) {
      return [];
    }

    const banners = category.banners
      .filter((banner: any) => banner.isActive !== false) // 只获取激活的Banner
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) // 按排序字段排序
      .map((banner: any) => adaptBannerData(banner)); // 转换数据格式

    return banners;

  } catch (error) {
    console.error(`从Strapi获取分类Banner失败 (${categorySlug}):`, error);
    return [];
  }
}

/**
 * 将Strapi Banner数据转换为前端BannerImage格式
 */
function adaptBannerData(strapiData: any): BannerImage {
  // 使用图片适配器处理URL
  const imageUrl = strapiData.image?.url
    ? adaptImageUrl(strapiData.image.url)
    : 'https://via.placeholder.com/800x400/4f46e5/ffffff?text=Banner';

  return {
    src: imageUrl,
    alt: strapiData.image?.alternativeText || strapiData.title || 'Banner图片',
    title: strapiData.title,
    subtitle: strapiData.subtitle,
    link: strapiData.link,
    textColor: strapiData.textColor || 'light',
    textColorCustom: strapiData.textColorCustom
  };
}
