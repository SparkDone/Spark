/**
 * 健康检查端点
 * 用于监控应用和API状态
 */

import type { APIRoute } from 'astro';
import { config, logger } from '../config/api';

export const GET: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  
  try {
    // 检查Strapi连接
    const strapiHealth = await checkStrapiHealth();
    
    // 检查环境配置
    const configHealth = checkConfigHealth();
    
    const responseTime = Date.now() - startTime;
    
    // 计算整体健康状态
    let overallStatus = 'healthy';
    if (strapiHealth.status === 'unhealthy' || configHealth.status === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (strapiHealth.status === 'degraded' || configHealth.status === 'degraded') {
      overallStatus = 'degraded';
    }

    const healthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: '2.0.0',
      environment: import.meta.env.NODE_ENV || 'unknown',
      checks: {
        strapi: strapiHealth,
        config: configHealth,
      }
    };
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    return new Response(JSON.stringify(healthStatus, null, 2), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
  } catch (error) {
    logger.error('Health check failed:', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - startTime}ms`,
    }, null, 2), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
};

async function checkStrapiHealth() {
  try {
    // 如果没有启用Strapi，跳过检查
    if (!config.features.useStrapi) {
      return {
        status: 'skipped',
        message: 'Strapi integration is disabled',
        url: config.strapi.url,
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时，更短

    const response = await fetch(`${config.strapi.url}/api/articles?pagination[limit]=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(config.strapi.apiToken && { 'Authorization': `Bearer ${config.strapi.apiToken}` }),
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        status: 'healthy',
        message: 'Strapi API is responding',
        url: config.strapi.url,
      };
    } else {
      return {
        status: 'degraded',
        message: `Strapi API returned ${response.status}`,
        url: config.strapi.url,
      };
    }
  } catch (error) {
    // 如果Strapi不可用，但系统可以降级运行，返回degraded而不是unhealthy
    return {
      status: 'degraded',
      message: `Strapi connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      url: config.strapi.url,
    };
  }
}

function checkConfigHealth() {
  const issues = [];
  
  if (!config.strapi.url) {
    issues.push('STRAPI_URL not configured');
  }
  
  if (config.strapi.url.includes('localhost') && import.meta.env.PROD) {
    issues.push('Using localhost URL in production');
  }
  
  if (!config.features.useStrapi) {
    issues.push('Strapi integration disabled');
  }
  
  return {
    status: issues.length === 0 ? 'healthy' : 'warning',
    message: issues.length === 0 ? 'Configuration is valid' : 'Configuration issues detected',
    issues: issues.length > 0 ? issues : undefined,
    config: {
      strapiUrl: config.strapi.url,
      useStrapi: config.features.useStrapi,
      hasApiToken: !!config.strapi.apiToken,
    }
  };
}
