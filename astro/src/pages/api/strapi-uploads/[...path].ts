import type { APIRoute } from 'astro';

/**
 * 图片代理API路由
 * 代理Strapi上传的图片，解决CORS和访问问题
 */

export const prerender = false; // 动态API端点

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { path } = params;
    
    if (!path) {
      return new Response('Path is required', { status: 400 });
    }
    
    // 构建Strapi图片URL
    const strapiUrl = import.meta.env.STRAPI_PUBLIC_URL || 
                     import.meta.env.STRAPI_URL || 
                     'https://api.sparkdone.com';
    
    const imageUrl = `${strapiUrl}/uploads/${path}`;
    
    console.log(`🖼️ 代理图片请求: ${imageUrl}`);
    
    // 获取图片
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Astro-Image-Proxy/1.0',
        // 如果需要认证，可以添加
        // 'Authorization': `Bearer ${import.meta.env.STRAPI_API_TOKEN}`
      }
    });
    
    if (!response.ok) {
      console.error(`❌ 图片获取失败: ${response.status} ${response.statusText}`);
      return new Response(`Image not found: ${response.status}`, { 
        status: response.status 
      });
    }
    
    // 获取图片数据
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // 返回图片
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // 缓存1年
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
    
  } catch (error) {
    console.error('❌ 图片代理错误:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

// 支持OPTIONS请求（CORS预检）
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
