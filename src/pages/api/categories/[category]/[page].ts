import { PAGE_SIZE } from '../../../../constants/constants';
import { getPostsByCategory, getSortedPosts } from '../../../../utils/hybrid-content-utils';

// 禁用预渲染，支持动态分类API
export const prerender = false;

export async function GET({ params }) {
  try {
    const { category, page: pageParam } = params;
    const page = parseInt(pageParam);
    
    if (!category || isNaN(page) || page < 1) {
      return new Response(JSON.stringify({ 
        error: 'Invalid category or page number' 
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // 获取该分类的所有文章
    const categoryPosts = await getPostsByCategory(category);
    
    // 计算分页数据
    const totalPages = Math.ceil(categoryPosts.length / PAGE_SIZE);
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    
    // 验证页码有效性
    if (page > totalPages) {
      return new Response(JSON.stringify({ 
        error: 'Page number exceeds total pages',
        totalPages
      }), { 
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const data = categoryPosts.slice(start, end);
    
    // 返回分页数据
    return new Response(JSON.stringify({
      data,
      meta: {
        category,
        start,
        end: Math.min(end, categoryPosts.length),
        size: PAGE_SIZE,
        total: categoryPosts.length,
        currentPage: page,
        lastPage: totalPages,
        hasMore: page < totalPages
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        // 优化缓存策略：浏览器缓存5分钟，CDN缓存10分钟，允许过期后重新验证
        'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=600',
        // 添加ETag支持
        'ETag': `"${category}-${page}-${Date.now()}"`
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
