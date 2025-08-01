import type { APIRoute } from 'astro';
import { searchArticles } from '../../lib/strapi';
import { getSortedPosts } from '../../utils/strapi-content-utils';

export const prerender = false; // 动态API端点

export const GET: APIRoute = async ({ url }) => {
  try {
    const query = url.searchParams.get('q');
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 10;

    console.log(`🔍 搜索API被调用: "${query}", 限制: ${limit}`);

    if (!query || query.trim().length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Search query is required',
        data: []
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const searchTerm = query.toLowerCase().trim();
    let allResults = [];

    // 方法1：尝试Strapi搜索
    try {
      console.log(`🔍 尝试Strapi搜索: "${query}"`);
      const strapiResponse = await searchArticles(query);
      console.log(`📊 Strapi搜索响应:`, strapiResponse);

      const strapiArticles = strapiResponse.data || [];
      console.log(`✅ 从Strapi获取到 ${strapiArticles.length} 个搜索结果`);

      if (strapiArticles.length > 0) {
        allResults = strapiArticles;
        console.log(`🎯 使用Strapi搜索结果`);
      }
    } catch (strapiError) {
      console.warn(`⚠️ Strapi搜索失败:`, strapiError);
    }

    // 方法2：如果Strapi搜索失败或无结果，使用本地内容搜索
    if (allResults.length === 0) {
      try {
        console.log(`🔍 使用本地内容搜索: "${query}"`);
        const localPosts = await getSortedPosts();
        console.log(`📊 获取到 ${localPosts.length} 个本地文章`);

        // 搜索本地内容
        const matchedPosts = localPosts.filter(post => {
          const title = post.data.title?.toLowerCase() || '';
          const description = post.data.description?.toLowerCase() || '';
          const content = post.body?.toLowerCase() || '';
          const tags = post.data.tags?.join(' ').toLowerCase() || '';
          const category = post.data.category?.toLowerCase() || '';

          const titleMatch = title.includes(searchTerm);
          const descMatch = description.includes(searchTerm);
          const contentMatch = content.includes(searchTerm);
          const tagsMatch = tags.includes(searchTerm);
          const categoryMatch = category.includes(searchTerm);

          const isMatch = titleMatch || descMatch || contentMatch || tagsMatch || categoryMatch;

          if (isMatch) {
            console.log(`🎯 匹配文章: "${post.data.title}" - 标题:${titleMatch}, 描述:${descMatch}, 内容:${contentMatch}, 标签:${tagsMatch}, 分类:${categoryMatch}`);
          }

          return isMatch;
        });

        console.log(`✅ 本地搜索找到 ${matchedPosts.length} 个结果`);

        // 转换本地文章格式为API格式
        allResults = matchedPosts.map(post => ({
          id: post.data.strapiId || post.id,
          title: post.data.title,
          slug: post.slug,
          description: post.data.description || '',
          content: post.body || '',
          published: post.data.published,
          category: { name: post.data.category || '' },
          tags: (post.data.tags || []).map(tag => ({ name: tag })),
        }));

        console.log(`🎯 使用本地搜索结果`);
      } catch (localError) {
        console.error(`❌ 本地搜索也失败:`, localError);
      }
    }

    // 高亮关键词函数
    const highlightKeyword = (text: string, keyword: string): string => {
      if (!text || !keyword) return text;
      const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    };

    // 生成智能摘要函数
    const generateExcerpt = (content: string, keyword: string, maxLength: number = 150): string => {
      if (!content) return '';

      const lowerContent = content.toLowerCase();
      const lowerKeyword = keyword.toLowerCase();
      const keywordIndex = lowerContent.indexOf(lowerKeyword);

      if (keywordIndex !== -1) {
        // 找到关键词，提取周围的文本
        const start = Math.max(0, keywordIndex - 50);
        const end = Math.min(content.length, keywordIndex + keyword.length + 100);
        let excerpt = content.substring(start, end);

        if (start > 0) excerpt = '...' + excerpt;
        if (end < content.length) excerpt = excerpt + '...';

        return excerpt;
      } else {
        // 没找到关键词，返回开头部分
        return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
      }
    };

    // 限制结果数量并格式化
    const results = allResults.slice(0, limit).map(article => {
      const title = article.title || '';
      const description = article.description || '';
      const content = article.content || '';

      // 生成智能摘要
      const excerpt = description || generateExcerpt(content, searchTerm);

      return {
        title: highlightKeyword(title, searchTerm),
        slug: article.slug,
        url: `/posts/${article.slug}/`,
        description: highlightKeyword(description, searchTerm),
        excerpt: highlightKeyword(excerpt, searchTerm),
        category: article.category?.name || '',
        tags: article.tags?.map(tag => typeof tag === 'string' ? tag : tag.name) || [],
        published: article.published,
        data: {
          title: title, // 原始标题，不带高亮
          description: description,
        }
      };
    });

    console.log(`✅ 最终返回 ${results.length} 个搜索结果`);

    return new Response(JSON.stringify({
      success: true,
      data: results,
      total: results.length,
      query: query,
      source: allResults.length > 0 ? (allResults[0].id ? 'strapi' : 'local') : 'none'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 缓存5分钟
      }
    });

  } catch (error) {
    console.error('❌ 搜索API错误:', error);

    // 如果Strapi搜索失败，返回友好的错误信息
    return new Response(JSON.stringify({
      success: false,
      error: 'Strapi搜索服务暂时不可用',
      data: [],
      debug: import.meta.env.DEV ? error.message : undefined
    }), {
      status: 200, // 改为200，避免前端显示网络错误
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
