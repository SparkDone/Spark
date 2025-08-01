/**
 * 配置整合工具 - 将config.ts与Strapi Index Settings整合
 */

import { siteConfig, profileConfig } from "../config";
import { getIndexSettings } from "./strapi";
import type { StrapiIndex } from "./strapi";
import type { SiteConfig, ProfileConfig } from "../types/config";

// 整合后的配置接口
export interface IntegratedConfig {
  site: {
    title: string;
    subtitle: string;
    description?: string;
    lang: string;
    themeColor: SiteConfig['themeColor'];
  };
  logo: {
    light?: string;
    dark?: string;
    alt: string;
  };
  profile: ProfileConfig;
  layout: {
    defaultHomepageLayout: 'list' | 'grid' | 'masonry';
    showAuthorSection: boolean;
  };
}

/**
 * 获取整合后的配置
 * 优先使用Strapi设置，回退到config.ts
 */
export async function getIntegratedConfig(): Promise<IntegratedConfig> {
  let strapiSettings: StrapiIndex | null = null;

  try {
    const response = await getIndexSettings();
    strapiSettings = response.data;

    // 调试信息（仅开发环境且非构建模式）
    if (import.meta.env.DEV && !import.meta.env.PROD) {
      console.log('🔧 Strapi Index Settings 获取成功:', {
        hasData: !!strapiSettings,
        title: strapiSettings?.site_title,
        subtitle: strapiSettings?.site_subtitle,
        logoLight: strapiSettings?.logo_light?.url,
        logoDark: strapiSettings?.logo_dark?.url,
        layout: strapiSettings?.default_homepage_layout
      });
    }
  } catch (error) {
    console.warn('获取Strapi设置失败，使用默认配置:', error);
  }

  // 整合网站基本信息
  const site = {
    title: strapiSettings?.site_title || siteConfig.title,
    subtitle: strapiSettings?.site_subtitle || siteConfig.subtitle,
    description: strapiSettings?.site_description,
    lang: siteConfig.lang,
    themeColor: siteConfig.themeColor,
  };

  // 整合LOGO配置 - 使用图片适配器处理URL
  const { adaptImageUrl } = await import('../utils/image-adapter');
  const logo = {
    light: strapiSettings?.logo_light?.url
      ? adaptImageUrl(strapiSettings.logo_light.url)
      : undefined,
    dark: strapiSettings?.logo_dark?.url
      ? adaptImageUrl(strapiSettings.logo_dark.url)
      : undefined,
    alt: site.title,
  };

  // 整合布局配置
  const layout = {
    defaultHomepageLayout: (strapiSettings?.default_homepage_layout || 'grid') as 'list' | 'grid' | 'masonry',
    showAuthorSection: strapiSettings?.show_author_section ?? true,
  };

  return {
    site,
    logo,
    profile: profileConfig,
    layout,
  };
}

/**
 * 获取LOGO配置（专门用于LOGO组件）
 */
export async function getLogoConfig() {
  try {
    const config = await getIntegratedConfig();
    return {
      light: config.logo.light,
      dark: config.logo.dark || config.logo.light, // 如果没有深色LOGO，使用浅色LOGO
      alt: config.logo.alt,
      fallbackText: config.site.title,
    };
  } catch (error) {
    console.warn('获取LOGO配置失败，使用默认配置:', error);
    return {
      light: undefined,
      dark: undefined,
      alt: siteConfig.title,
      fallbackText: siteConfig.title,
    };
  }
}

/**
 * 获取网站基本信息（用于Layout等组件）
 */
export async function getSiteConfig() {
  try {
    const config = await getIntegratedConfig();
    return config.site;
  } catch (error) {
    console.warn('获取网站配置失败，使用默认配置:', error);
    return {
      title: siteConfig.title,
      subtitle: siteConfig.subtitle,
      description: undefined,
      lang: siteConfig.lang,
      themeColor: siteConfig.themeColor,
    };
  }
}

/**
 * 获取布局配置（用于首页等）
 */
export async function getLayoutConfig() {
  try {
    const config = await getIntegratedConfig();
    return config.layout;
  } catch (error) {
    console.warn('获取布局配置失败，使用默认配置:', error);
    return {
      defaultHomepageLayout: 'grid' as const,
      showAuthorSection: true,
    };
  }
}

// 缓存配置以提高性能
let configCache: IntegratedConfig | null = null;
let cacheTime = 0;
const CACHE_DURATION = import.meta.env.DEV ? 1 * 1000 : 5 * 60 * 1000; // 开发环境1秒，生产环境5分钟缓存

/**
 * 获取缓存的配置
 */
export async function getCachedConfig(): Promise<IntegratedConfig> {
  const now = Date.now();
  
  if (configCache && (now - cacheTime) < CACHE_DURATION) {
    return configCache;
  }
  
  configCache = await getIntegratedConfig();
  cacheTime = now;
  
  return configCache;
}

/**
 * 清除配置缓存
 */
export function clearConfigCache() {
  configCache = null;
  cacheTime = 0;
}
