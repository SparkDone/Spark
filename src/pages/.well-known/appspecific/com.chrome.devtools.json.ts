/**
 * Chrome DevTools 配置文件
 * 避免404错误
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
