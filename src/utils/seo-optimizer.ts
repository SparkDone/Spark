/**
 * SEO优化工具 - 提供SEO相关的优化功能
 */

import { getSiteConfig } from "../lib/config-integration";

/**
 * 生成优化的页面描述
 */
export function generateOptimizedDescription(
  title: string,
  content?: string,
  category?: string
): string {
  // 基础描述模板
  const baseDescription = "SparkDone - 专注于创意落地，分享技术教程、项目经验和实用工具";
  
  if (content) {
    // 从内容中提取前150个字符作为描述
    const cleanContent = content
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/\s+/g, ' ') // 合并空白字符
      .trim();
    
    if (cleanContent.length > 150) {
      return cleanContent.substring(0, 147) + '...';
    }
    return cleanContent || baseDescription;
  }
  
  if (category) {
    return `${baseDescription} - ${category}分类下的精选内容`;
  }
  
  return baseDescription;
}

/**
 * 生成关键词
 */
export function generateKeywords(
  title: string,
  category?: string,
  tags?: string[]
): string {
  const baseKeywords = [
    'SparkDone',
    '创意落地',
    '技术博客',
    '项目分享',
    '教程',
    '工具'
  ];
  
  const keywords = [...baseKeywords];
  
  if (category) {
    keywords.push(category);
  }
  
  if (tags && tags.length > 0) {
    keywords.push(...tags);
  }
  
  // 从标题中提取关键词
  const titleWords = title
    .split(/[\s,，。！？；：\-_]+/)
    .filter(word => word.length > 1)
    .slice(0, 3);
  
  keywords.push(...titleWords);
  
  // 去重并限制数量
  return [...new Set(keywords)].slice(0, 10).join(', ');
}

/**
 * 生成结构化数据
 */
export async function generateStructuredData(
  type: 'WebSite' | 'BlogPosting' | 'CollectionPage',
  data: {
    title: string;
    description: string;
    url: string;
    author?: string;
    datePublished?: Date;
    dateModified?: Date;
    category?: string;
    tags?: string[];
    image?: string;
  }
) {
  const siteConfig = await getSiteConfig();
  
  const baseData = {
    "@context": "https://schema.org",
    "@type": type,
    "name": data.title,
    "description": data.description,
    "url": data.url,
    "publisher": {
      "@type": "Organization",
      "name": siteConfig.title,
      "url": "https://sparkdone.com/"
    }
  };
  
  switch (type) {
    case 'WebSite':
      return {
        ...baseData,
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://sparkdone.com/search?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      };
      
    case 'BlogPosting':
      return {
        ...baseData,
        "@type": "BlogPosting",
        "headline": data.title,
        "author": {
          "@type": "Person",
          "name": data.author || "SparkDone"
        },
        "datePublished": data.datePublished?.toISOString(),
        "dateModified": data.dateModified?.toISOString(),
        "articleSection": data.category,
        "keywords": data.tags?.join(', '),
        ...(data.image && { "image": data.image }),
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": data.url
        }
      };
      
    case 'CollectionPage':
      return {
        ...baseData,
        "@type": "CollectionPage",
        "about": data.category,
        "keywords": generateKeywords(data.title, data.category, data.tags)
      };
      
    default:
      return baseData;
  }
}

/**
 * 生成Open Graph图片URL
 */
export function generateOGImage(
  title: string,
  category?: string
): string {
  // 可以集成动态OG图片生成服务
  const params = new URLSearchParams({
    title: title.substring(0, 60),
    ...(category && { category })
  });
  
  return `https://sparkdone.com/api/og?${params.toString()}`;
}

/**
 * 验证SEO标签完整性
 */
export function validateSEOTags(pageData: {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
}): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // 检查标题
  if (!pageData.title) {
    warnings.push('缺少页面标题');
  } else if (pageData.title.length > 60) {
    warnings.push('页面标题过长（建议60字符以内）');
  } else if (pageData.title.length < 10) {
    suggestions.push('页面标题可以更详细一些');
  }
  
  // 检查描述
  if (!pageData.description) {
    warnings.push('缺少页面描述');
  } else if (pageData.description.length > 160) {
    warnings.push('页面描述过长（建议160字符以内）');
  } else if (pageData.description.length < 50) {
    suggestions.push('页面描述可以更详细一些');
  }
  
  // 检查关键词
  if (!pageData.keywords) {
    suggestions.push('建议添加关键词');
  }
  
  // 检查OG图片
  if (!pageData.ogImage) {
    suggestions.push('建议添加Open Graph图片');
  }
  
  // 检查规范URL
  if (!pageData.canonicalUrl) {
    warnings.push('缺少规范URL');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions
  };
}

/**
 * 生成面包屑导航结构化数据
 */
export function generateBreadcrumbStructuredData(
  breadcrumbs: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}
