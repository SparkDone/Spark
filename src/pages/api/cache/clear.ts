/**
 * 清空缓存的API端点
 */

import type { APIRoute } from 'astro';
import { apiCache } from '../../../lib/cache';
import { logger } from '../../../config/api';

export const POST: APIRoute = async ({ request }) => {
  try {
    // 获取缓存统计信息（清空前）
    const statsBefore = apiCache.getStats();
    
    // 清空缓存
    apiCache.clear();
    
    // 记录操作
    logger.info(`Cache cleared. Removed ${statsBefore.totalEntries} entries.`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Cache cleared successfully',
      clearedEntries: statsBefore.totalEntries,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    logger.error('Failed to clear cache:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to clear cache',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const GET: APIRoute = async ({ request }) => {
  try {
    const stats = apiCache.getStats();
    
    return new Response(JSON.stringify({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to get cache stats',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
