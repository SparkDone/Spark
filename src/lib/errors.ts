/**
 * 自定义错误类型
 */
export class APIError extends Error {
  constructor(
    message: string, 
    public status: number, 
    public endpoint?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'APIError';
  }

  get isRetryable(): boolean {
    return this.status >= 500 || this.status === 429; // 服务器错误或限流
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

export class ContentNotFoundError extends Error {
  constructor(slug: string) {
    super(`Content not found: ${slug}`);
    this.name = 'ContentNotFoundError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * 错误边界函数，提供降级处理
 */
export async function withErrorBoundary<T>(
  fn: () => Promise<T>, 
  fallback: T,
  context?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // 对于401错误，只记录警告而不是错误
    if (error instanceof APIError && error.status === 401) {
      console.warn(`🔐 Authentication failed in ${context || 'unknown context'}: ${error.message}`);
      console.warn('💡 This is expected in development when Strapi is not running or API token is not configured');
    } else {
      console.error(`❌ Error in ${context || 'unknown context'}:`, error);

      // 如果是其他API错误，记录更详细的信息
      if (error instanceof APIError) {
        console.error(`API Error - Status: ${error.status}, Endpoint: ${error.endpoint}`);
      }
    }

    return fallback;
  }
}

/**
 * 重试机制，支持指数退避
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // 如果是客户端错误（4xx），不重试
      if (error instanceof APIError && error.isClientError) {
        throw error;
      }
      
      // 最后一次尝试失败，抛出错误
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 计算延迟时间（指数退避）
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * 用户友好的错误消息
 */
export function getUserFriendlyErrorMessage(error: Error): string {
  if (error instanceof APIError) {
    switch (error.status) {
      case 404:
        return '请求的内容不存在';
      case 429:
        return '请求过于频繁，请稍后再试';
      case 500:
        return '服务器暂时不可用，请稍后再试';
      case 503:
        return '服务正在维护中，请稍后再试';
      default:
        return '网络请求失败，请检查网络连接';
    }
  }
  
  if (error instanceof NetworkError) {
    return '网络连接失败，请检查网络设置';
  }
  
  if (error instanceof ContentNotFoundError) {
    return '找不到请求的内容';
  }
  
  return '发生了未知错误，请稍后再试';
}
