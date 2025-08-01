/**
 * 分类名称到URL slug的映射
 * 解决中文分类名在URL中的编码问题
 */

export const categorySlugMap: Record<string, string> = {
  // 中文分类映射到英文slug
  'github项目推荐': 'github-projects',
  'fffff f': 'fffff-f',
  
  // 可以继续添加更多分类映射
  '技术分享': 'tech-sharing',
  '生活随笔': 'life-notes',
  '学习笔记': 'study-notes',
  '项目经验': 'project-experience',
  '工具推荐': 'tool-recommendations',
};

// 反向映射：从slug到分类名
export const slugToCategoryMap: Record<string, string> = Object.fromEntries(
  Object.entries(categorySlugMap).map(([name, slug]) => [slug, name])
);

/**
 * 获取分类的URL slug
 * 优先使用手动映射，否则自动生成安全的slug
 */
export function getCategorySlug(categoryName: string): string {
  // 如果有手动映射，优先使用
  if (categorySlugMap[categoryName]) {
    return categorySlugMap[categoryName];
  }

  // 自动生成slug：保留中文字符，只处理空格和特殊符号
  const autoSlug = categoryName
    .trim()
    .replace(/\s+/g, '-')           // 空格转连字符
    .replace(/[^\w\u4e00-\u9fff\-]/g, '') // 保留中英文、数字、连字符
    .replace(/--+/g, '-')           // 多个连字符合并为一个
    .replace(/^-|-$/g, '');         // 移除首尾连字符

  return autoSlug || 'uncategorized';
}

/**
 * 从slug获取分类名
 * 需要动态查找，因为有些分类是自动生成的slug
 */
export function getCategoryFromSlug(slug: string, allCategories?: string[]): string {
  // 首先检查手动映射
  if (slugToCategoryMap[slug]) {
    return slugToCategoryMap[slug];
  }

  // 如果提供了所有分类列表，尝试匹配自动生成的slug
  if (allCategories) {
    for (const category of allCategories) {
      if (getCategorySlug(category) === slug) {
        return category;
      }
    }
  }

  // 最后尝试将slug转换回可能的分类名
  return slug.replace(/-/g, ' ');
}

/**
 * 获取所有分类的slug列表
 */
export function getAllCategorySlugs(): string[] {
  return Object.values(categorySlugMap);
}

/**
 * 检查slug是否存在
 */
export function isValidCategorySlug(slug: string): boolean {
  return slug in slugToCategoryMap;
}
