/**
 * Strapi 数据适配器
 * 将 Strapi API 数据转换为 Astro 内容格式
 */

import type { StrapiArticle } from './strapi';
import type { PostEntry } from '../types/post';
import { getCategoryUrl } from '../utils/url-utils';
import { adaptImageUrl } from '../utils/image-adapter';

// 将 Strapi 文章转换为 Astro 文章格式
export function adaptStrapiArticle(strapiArticle: StrapiArticle): PostEntry {
  // Strapi v5 数据结构已扁平化，不再有 attributes 包装
  const article = strapiArticle;
  
  return {
    id: `strapi-${article.id}`, // 保留Strapi ID用于浏览次数更新
    slug: article.slug,
    body: article.content,
    collection: 'posts',
    data: {
      strapiId: article.id, // 添加strapiId字段方便访问
      documentId: article.documentId, // Strapi v5 文档ID，用于API操作
      title: article.title,
      published: new Date(article.published),
      updated: article.updated ? new Date(article.updated) : undefined,
      draft: article.draft,
      description: article.description || '',
      image: (() => {
        const rawImageUrl = article.image?.url || '';
        // 使用图片适配器处理URL
        return adaptImageUrl(rawImageUrl);
      })(),
      tags: article.tags?.map(tag => tag.name) || [],
      category: article.category?.name || '',
      categorySlug: article.category?.slug || '',
      featured: article.featured || false, // 添加featured字段


      // SEO 字段
      metaTitle: article.metaTitle || '',
      metaDescription: article.metaDescription || '',
      keywords: article.keywords || '',

      // Author 字段 - 返回完整的作者信息
      author: (() => {
        const authorData = article.author;
        if (!authorData) {
          return 'Unknown Author';
        }

        const authorInfo = {
          name: authorData.name,
          slug: authorData.slug,
          bio: authorData.bio,
          email: authorData.email,
          website: authorData.website,
          github: authorData.github,
          twitter: authorData.twitter,
          linkedin: authorData.linkedin,
          avatar: (() => {
            // Strapi v5 中头像是数组结构
            const avatarData = authorData.avatar;
            if (avatarData && Array.isArray(avatarData) && avatarData.length > 0) {
              const avatar = avatarData[0];
              if (avatar.url.startsWith('/')) {
                // 使用Strapi URL
                return `http://localhost:1337${avatar.url}`;
              }
              return avatar.url;
            }
            return null;
          })()
        };

        return authorInfo;
      })(),

      // 内部使用字段（暂时为空，后续可以实现）
      prevTitle: '',
      prevSlug: '',
      nextTitle: '',
      nextSlug: '',
    },
    render: async () => {
      // 使用 reading-time 插件计算字数和阅读时间
      const getReadingTime = (await import('reading-time')).default;
      const content = article.content || '';
      const readingTimeStats = getReadingTime(content);

      // 简单的 Markdown 转 HTML 处理
      const htmlContent = content
        .replace(/\n\n/g, '</p><p>')  // 段落
        .replace(/\n/g, '<br>')       // 换行
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // 粗体
        .replace(/\*(.*?)\*/g, '<em>$1</em>')              // 斜体
        .replace(/`(.*?)`/g, '<code>$1</code>')            // 代码
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')             // H1
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')            // H2
        .replace(/^### (.*$)/gm, '<h3>$1</h3>');          // H3

      const finalHtml = htmlContent.startsWith('<') ? htmlContent : `<p>${htmlContent}</p>`;



      // 返回渲染函数，用于兼容 PostEntry 接口
      return {
        Content: () => finalHtml,  // 直接返回 HTML 字符串
        headings: [],
        remarkPluginFrontmatter: {
          words: readingTimeStats.words,
          minutes: Math.max(1, Math.round(readingTimeStats.minutes)),
          excerpt: article.description || content.substring(0, 150) + '...',
        },
      };
    },
  } as PostEntry;
}

// 将 Strapi 文章数组转换为 Astro 文章数组
export function adaptStrapiArticles(strapiArticles: StrapiArticle[]): PostEntry[] {
  return strapiArticles.map(adaptStrapiArticle);
}

// 为文章添加前后导航信息
export async function addNavigationInfo(articles: PostEntry[]): Promise<PostEntry[]> {
  // 使用新的排序逻辑：featured文章优先，然后按时间排序
  const { sortArticlesWithFeatured } = await import('@/scripts/article-sorter.js');
  const sortedArticles = sortArticlesWithFeatured(articles);

  for (let i = 1; i < sortedArticles.length; i++) {
    sortedArticles[i].data.nextSlug = sortedArticles[i - 1].slug;
    sortedArticles[i].data.nextTitle = sortedArticles[i - 1].data.title;
  }
  
  for (let i = 0; i < sortedArticles.length - 1; i++) {
    sortedArticles[i].data.prevSlug = sortedArticles[i + 1].slug;
    sortedArticles[i].data.prevTitle = sortedArticles[i + 1].data.title;
  }

  return sortedArticles;
}

// 获取标签列表和计数
export function getTagsFromArticles(articles: PostEntry[]): Array<{ name: string; count: number }> {
  const tagCount: { [key: string]: number } = {};
  
  articles.forEach(article => {
    if (article.data.tags) {
      article.data.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    }
  });

  return Object.entries(tagCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
}

// 获取分类列表和计数
export function getCategoriesFromArticles(articles: PostEntry[]): Array<{ name: string; count: number; url: string }> {
  const categoryCount: { [key: string]: number } = {};

  articles.forEach(article => {
    const category = article.data.category || 'Uncategorized';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });

  return Object.entries(categoryCount)
    .map(([name, count]) => ({
      name,
      count,
      url: getCategoryUrl(name)
    }))
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
}
