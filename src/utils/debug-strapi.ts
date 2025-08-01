/**
 * Strapi调试工具 - 用于检查API响应结构
 */

import { getIndexSettings } from "../lib/strapi";

/**
 * 调试Strapi Index Settings数据结构
 */
export async function debugStrapiIndexSettings() {
  try {
    console.log('🔍 开始调试Strapi Index Settings...');
    
    const response = await getIndexSettings();
    
    console.log('📋 完整响应结构:', {
      response: response,
      hasData: !!response.data,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : null
    });
    
    if (response.data) {
      const data = response.data;
      console.log('📊 Index Settings 数据详情:', {
        id: data.id,
        site_title: data.site_title,
        site_subtitle: data.site_subtitle,
        site_description: data.site_description,
        default_homepage_layout: data.default_homepage_layout,
        show_author_section: data.show_author_section,
        logo_light: data.logo_light ? {
          id: data.logo_light.id,
          url: data.logo_light.url,
          alternativeText: data.logo_light.alternativeText
        } : null,
        logo_dark: data.logo_dark ? {
          id: data.logo_dark.id,
          url: data.logo_dark.url,
          alternativeText: data.logo_dark.alternativeText
        } : null
      });
      
      // 检查LOGO URL格式
      if (data.logo_light?.url) {
        const strapiUrl = import.meta.env.STRAPI_PUBLIC_URL || import.meta.env.STRAPI_URL || 'http://localhost:1337';
        const fullLogoUrl = `${strapiUrl}${data.logo_light.url}`;
        console.log('🖼️ LOGO Light 完整URL:', fullLogoUrl);
      }
      
      if (data.logo_dark?.url) {
        const strapiUrl = import.meta.env.STRAPI_PUBLIC_URL || import.meta.env.STRAPI_URL || 'http://localhost:1337';
        const fullLogoUrl = `${strapiUrl}${data.logo_dark.url}`;
        console.log('🖼️ LOGO Dark 完整URL:', fullLogoUrl);
      }
    } else {
      console.warn('⚠️ response.data 为空或未定义');
    }
    
    return response;
  } catch (error) {
    console.error('❌ 调试Strapi Index Settings失败:', error);
    throw error;
  }
}

/**
 * 在浏览器控制台中运行调试
 */
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.debugStrapiIndexSettings = debugStrapiIndexSettings;
  console.log('🔧 调试工具已加载，在控制台运行: debugStrapiIndexSettings()');
}
