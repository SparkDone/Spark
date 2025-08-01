/**
 * 文章排序工具
 * 实现featured文章优先，然后按时间排序的逻辑
 */

/**
 * 对文章进行排序：featured文章优先，然后按发布时间排序
 * @param {Array} articles - 文章数组
 * @returns {Array} 排序后的文章数组
 */
export function sortArticlesWithFeatured(articles) {
  if (!Array.isArray(articles)) {
    console.warn('sortArticlesWithFeatured: 输入不是数组，返回空数组');
    return [];
  }

  return [...articles].sort((a, b) => {
    // 获取featured状态
    const aFeatured = getFeaturedStatus(a);
    const bFeatured = getFeaturedStatus(b);
    
    // 如果一个是featured，另一个不是，featured优先
    if (aFeatured && !bFeatured) {
      return -1;
    }
    if (!aFeatured && bFeatured) {
      return 1;
    }
    
    // 如果都是featured或都不是featured，按发布时间排序（新的在前）
    const aDate = getPublishedDate(a);
    const bDate = getPublishedDate(b);
    
    return bDate - aDate; // 降序排列，新的在前
  });
}

/**
 * 获取文章的featured状态
 * @param {Object} article - 文章对象
 * @returns {boolean} featured状态
 */
function getFeaturedStatus(article) {
  // 支持多种数据结构
  if (article?.data?.featured !== undefined) {
    return Boolean(article.data.featured);
  }
  if (article?.featured !== undefined) {
    return Boolean(article.featured);
  }
  if (article?.attributes?.featured !== undefined) {
    return Boolean(article.attributes.featured);
  }
  return false;
}

/**
 * 获取文章的发布日期
 * @param {Object} article - 文章对象
 * @returns {Date} 发布日期
 */
function getPublishedDate(article) {
  let dateValue = null;
  
  // 支持多种数据结构
  if (article?.data?.published) {
    dateValue = article.data.published;
  } else if (article?.published) {
    dateValue = article.published;
  } else if (article?.attributes?.published) {
    dateValue = article.attributes.published;
  } else if (article?.publishedAt) {
    dateValue = article.publishedAt;
  } else if (article?.attributes?.publishedAt) {
    dateValue = article.attributes.publishedAt;
  }
  
  // 转换为Date对象
  if (dateValue) {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // 如果没有有效日期，返回很早的日期作为默认值
  return new Date(0);
}

/**
 * 对文章进行分组：featured文章和普通文章
 * @param {Array} articles - 文章数组
 * @returns {Object} 包含featured和normal数组的对象
 */
export function groupArticlesByFeatured(articles) {
  if (!Array.isArray(articles)) {
    return { featured: [], normal: [] };
  }

  const featured = [];
  const normal = [];
  
  articles.forEach(article => {
    if (getFeaturedStatus(article)) {
      featured.push(article);
    } else {
      normal.push(article);
    }
  });
  
  // 对每组内部按时间排序
  featured.sort((a, b) => getPublishedDate(b) - getPublishedDate(a));
  normal.sort((a, b) => getPublishedDate(b) - getPublishedDate(a));
  
  return { featured, normal };
}

/**
 * 获取排序后的文章列表（featured优先）
 * @param {Array} articles - 文章数组
 * @param {Object} options - 排序选项
 * @returns {Array} 排序后的文章数组
 */
export function getSortedArticles(articles, options = {}) {
  const {
    featuredFirst = true,
    sortBy = 'published',
    sortOrder = 'desc'
  } = options;
  
  if (!featuredFirst) {
    // 如果不需要featured优先，使用普通排序
    return sortArticlesByDate(articles, sortBy, sortOrder);
  }
  
  return sortArticlesWithFeatured(articles);
}

/**
 * 按日期排序文章（不考虑featured状态）
 * @param {Array} articles - 文章数组
 * @param {string} sortBy - 排序字段
 * @param {string} sortOrder - 排序顺序 ('asc' | 'desc')
 * @returns {Array} 排序后的文章数组
 */
function sortArticlesByDate(articles, sortBy = 'published', sortOrder = 'desc') {
  if (!Array.isArray(articles)) {
    return [];
  }
  
  return [...articles].sort((a, b) => {
    const aDate = getPublishedDate(a);
    const bDate = getPublishedDate(b);
    
    if (sortOrder === 'asc') {
      return aDate - bDate;
    } else {
      return bDate - aDate;
    }
  });
}

/**
 * 调试函数：打印文章排序信息
 * @param {Array} articles - 文章数组
 */
export function debugArticleSorting(articles) {
  if (!Array.isArray(articles)) {
    console.log('debugArticleSorting: 输入不是数组');
    return;
  }
  
  console.log('=== 文章排序调试信息 ===');
  console.log(`总文章数: ${articles.length}`);
  
  const { featured, normal } = groupArticlesByFeatured(articles);
  console.log(`Featured文章数: ${featured.length}`);
  console.log(`普通文章数: ${normal.length}`);
  
  if (featured.length > 0) {
    console.log('\nFeatured文章:');
    featured.forEach((article, index) => {
      const title = article?.data?.title || article?.title || article?.attributes?.title || '未知标题';
      const date = getPublishedDate(article).toISOString().split('T')[0];
      console.log(`  ${index + 1}. ${title} (${date})`);
    });
  }
  
  if (normal.length > 0) {
    console.log('\n普通文章 (前5篇):');
    normal.slice(0, 5).forEach((article, index) => {
      const title = article?.data?.title || article?.title || article?.attributes?.title || '未知标题';
      const date = getPublishedDate(article).toISOString().split('T')[0];
      console.log(`  ${index + 1}. ${title} (${date})`);
    });
  }
  
  console.log('=== 调试信息结束 ===');
}
