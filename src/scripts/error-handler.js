/**
 * 全局错误处理脚本
 * 可以替代Layout.astro中的内联错误处理脚本
 */

export function initializeErrorHandler(options = {}) {
  const {
    suppressStrapiErrors = true,
    enableLogging = true
  } = options;

  if (enableLogging) {
    console.log('🛡️ 全局错误处理器已初始化');
  }

  // 检查是否是需要抑制的错误
  function shouldSuppressError(errorMessage, errorName) {
    if (!suppressStrapiErrors) return false;
    
    return errorMessage.includes('401 Unauthorized') ||
           errorMessage.includes('Strapi API error') ||
           errorMessage.includes('APIError') ||
           errorName === 'SilentAPIError';
  }

  // 增强的全局错误处理器 - 防止Strapi相关错误显示给用户
  window.addEventListener('error', function(event) {
    const errorMessage = event.error?.message || event.message || '';
    const errorName = event.error?.name || '';

    if (shouldSuppressError(errorMessage, errorName)) {
      if (enableLogging) {
        console.warn('🔐 Suppressed Strapi error from displaying to user:', errorMessage);
      }
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }

    // 记录其他错误
    if (enableLogging && errorMessage) {
      console.error('❌ Global error:', errorMessage);
    }
  });

  window.addEventListener('unhandledrejection', function(event) {
    const errorMessage = event.reason?.message || event.reason || '';
    const errorName = event.reason?.name || '';

    if (shouldSuppressError(errorMessage, errorName)) {
      if (enableLogging) {
        console.warn('🔐 Suppressed Strapi promise rejection from displaying to user:', errorMessage);
      }
      event.preventDefault();
      return false;
    }

    // 记录其他Promise拒绝
    if (enableLogging && errorMessage) {
      console.error('❌ Unhandled promise rejection:', errorMessage);
    }
  });
}

// 导出错误处理工具
export const errorHandler = {
  suppressError(error) {
    console.warn('🔇 手动抑制错误:', error);
  },
  
  logError(error, context = 'Unknown') {
    console.error(`❌ [${context}] Error:`, error);
  },
  
  logWarning(message, context = 'Unknown') {
    console.warn(`⚠️ [${context}] Warning:`, message);
  }
};

// 如果在浏览器环境中，自动挂载到window
if (typeof window !== 'undefined') {
  window.errorHandler = errorHandler;
}
