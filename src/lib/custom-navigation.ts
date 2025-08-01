/**
 * 简化的导航菜单管理
 * 支持中文，从Strapi获取导航数据
 */

import { config, logger } from '../config/api';

// 导航项类型（简化版，兼容现有格式）
export interface NavigationItem {
  id: number;
  title: string;
  path: string;
  type: 'INTERNAL' | 'EXTERNAL';
  menuAttached: boolean;
  order?: number;
}

// 获取导航数据
async function fetchNavigation(): Promise<NavigationItem[]> {
  try {
    const url = `${config.api.baseUrl}/api/navigation-menus?filters[slug][$eq]=main-navigation&filters[isActive][$eq]=true`;

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
    // Strapi v5 扁平化结构，不再有 attributes 包装
    return data.data?.[0]?.items || getDefaultNavigation();
  } catch (error) {
    logger.warn('获取导航失败，使用默认导航:', error);
    return getDefaultNavigation();
  }
}

// 默认导航（降级方案，确保尾部斜杠）
function getDefaultNavigation(): NavigationItem[] {
  return [
    { id: 1, title: '首页', path: '/', type: 'INTERNAL', menuAttached: true, order: 1 },
    { id: 2, title: '归档', path: '/archive/', type: 'INTERNAL', menuAttached: true, order: 2 },
    { id: 3, title: '关于', path: '/about/', type: 'INTERNAL', menuAttached: true, order: 3 }
  ];
}

// 转换为Astro格式（简化版，自动处理尾部斜杠）
function toAstroFormat(items: NavigationItem[]) {
  return items
    .filter(item => item.menuAttached)
    .sort((a, b) => (a.order || a.id || 0) - (b.order || b.id || 0))
    .map(item => {
      let url = item.path;

      // 为内部链接自动添加尾部斜杠（如果没有的话）
      if (item.type === 'INTERNAL' && !url.endsWith('/') && !url.includes('?') && !url.includes('#')) {
        url = url + '/';
      }

      return {
        name: item.title,
        url,
        external: item.type === 'EXTERNAL'
      };
    });
}

// 主要导出函数：获取适配后的导航菜单
export async function getAdaptedMainNavigation() {
  const navigationItems = await fetchNavigation();
  return toAstroFormat(navigationItems);
}
