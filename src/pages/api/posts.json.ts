import { getSortedPosts } from '../../utils/hybrid-content-utils';
import { PAGE_SIZE } from '../../constants/constants';

// 动态API端点 - 支持分页查询
export const prerender = false;

export async function GET({ url }) {
  try {
    // 从查询参数获取页码
    const pageParam = url.searchParams.get('page') || '1';
    const page = parseInt(pageParam);
    
    console.log(`📄 请求页码: ${pageParam} -> ${page}`);
    
    if (isNaN(page) || page < 1) {
      console.error(`❌ 无效页码: ${pageParam}`);
      return new Response(JSON.stringify({ 
        error: 'Invalid page number' 
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // 获取所有文章
    console.log('📚 开始获取文章列表...');
    const allBlogPosts = await getSortedPosts();
    console.log(`📚 获取到文章总数: ${allBlogPosts.length}`);
    
    // 计算分页数据
    const totalPages = Math.ceil(allBlogPosts.length / PAGE_SIZE);
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    
    console.log(`📊 分页信息: 页码=${page}, 总页数=${totalPages}, 起始=${start}, 结束=${end}`);
    
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
    
    const data = allBlogPosts.slice(start, end);
    
    // 返回分页数据
    return new Response(JSON.stringify({
      data,
      meta: {
        start,
        end: Math.min(end, allBlogPosts.length),
        size: PAGE_SIZE,
        total: allBlogPosts.length,
        currentPage: page,
        lastPage: totalPages,
        hasMore: page < totalPages
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=60'
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
