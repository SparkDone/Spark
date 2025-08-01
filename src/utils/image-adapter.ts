/**
 * 图片URL适配器
 * 处理Strapi图片URL的转换，支持本地化和CDN
 */

// 动态加载图片映射数据（构建时生成）
let imageMapping: Record<string, string> = {};

// 尝试加载构建时生成的映射文件
try {
  const mappingData = await import('../data/image-mapping.json');
  imageMapping = mappingData.default || {};
} catch (error) {
  console.warn('⚠️ 无法加载图片映射文件，使用API代理模式');
}

/**
 * 获取环境变量中的Strapi公网URL
 */
function getStrapiPublicUrl(): string {
  // 优先使用公网URL，然后是内网URL，最后使用默认值
  return import.meta.env.STRAPI_PUBLIC_URL ||
         import.meta.env.STRAPI_URL ||
         'http://localhost:1337';
}

/**
 * 转换Strapi图片URL
 * @param strapiImageUrl - Strapi返回的图片URL
 * @param fallbackUrl - 备用URL
 * @returns 转换后的图片URL
 */
export function adaptImageUrl(strapiImageUrl: string, fallbackUrl?: string): string {
  if (!strapiImageUrl) {
    return fallbackUrl || '';
  }

  // 调试信息已移除

  // 如果已经是完整的HTTP URL，直接返回
  if (strapiImageUrl.startsWith('http://') || strapiImageUrl.startsWith('https://')) {
    return strapiImageUrl;
  }

  // 如果是相对路径，优先使用本地映射
  if (strapiImageUrl.startsWith('/')) {
    // 如果已经是本地静态资源路径，直接返回
    if (strapiImageUrl.startsWith('/images/strapi/')) {
      return strapiImageUrl;
    }

    // 如果已经是代理URL，直接返回，避免重复处理
    if (strapiImageUrl.startsWith('/api/strapi-uploads/')) {
      return strapiImageUrl;
    }

    // 检查是否有本地映射
    if (imageMapping && imageMapping[strapiImageUrl]) {
      return imageMapping[strapiImageUrl];
    }

    // 静态构建：优先使用本地映射，否则使用远程URL
    if (imageMapping && imageMapping[strapiImageUrl]) {
      return imageMapping[strapiImageUrl];
    }

    // 如果没有本地映射，直接使用Strapi URL（需要配置CORS）
    const strapiPublicUrl = getStrapiPublicUrl();
    return `${strapiPublicUrl}${strapiImageUrl}`;
  }

  // 其他情况，直接返回
  return strapiImageUrl;
}

// 为了兼容性，保留同步版本的别名
export const adaptImageUrlSync = adaptImageUrl;

/**
 * 批量转换图片URL
 */
export function adaptImageUrls(urls: string[]): string[] {
  return urls.map(url => adaptImageUrl(url));
}

/**
 * 转换文章封面图片
 */
export function adaptArticleCover(article: any): string {
  if (!article.cover) {
    return 'https://via.placeholder.com/800x400/f3f4f6/9ca3af?text=Article';
  }

  return adaptImageUrl(article.cover.url);
}

/**
 * 转换Banner图片
 */
export function adaptBannerImage(banner: any): string {
  if (!banner.image) {
    return 'https://via.placeholder.com/1200x600/4f46e5/ffffff?text=Banner';
  }

  return adaptImageUrl(banner.image.url);
}

/**
 * 转换作者头像
 */
export function adaptAuthorAvatar(author: any): string {
  if (!author.avatar || !Array.isArray(author.avatar) || author.avatar.length === 0) {
    return 'https://via.placeholder.com/150x150/f3f4f6/9ca3af?text=Avatar';
  }

  const avatar = author.avatar[0];
  return adaptImageUrl(avatar.url);
}

/**
 * 处理文章内容中的图片URL
 */
export function adaptContentImages(content: string): string {
  if (!content) return content;

  // 匹配Markdown图片语法
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    const adaptedUrl = adaptImageUrl(url);
    return `![${alt}](${adaptedUrl})`;
  });
}

/**
 * 获取图片的响应式尺寸URL
 */
export function getResponsiveImageUrls(baseUrl: string, sizes: number[] = [320, 640, 768, 1024, 1280, 1920]): string[] {
  const adaptedUrl = adaptImageUrl(baseUrl);
  
  // 如果是本地图片，返回原图
  if (adaptedUrl.startsWith('/')) {
    return [adaptedUrl];
  }

  // 如果是远程图片，尝试生成不同尺寸（如果支持）
  if (adaptedUrl.includes('localhost') || adaptedUrl.includes('strapi')) {
    // Strapi支持图片变换
    return sizes.map(size => `${adaptedUrl}?format=webp&width=${size}&quality=80`);
  }

  // 其他情况返回原图
  return [adaptedUrl];
}

/**
 * 检查图片是否可用
 */
export async function checkImageAvailability(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 获取图片元数据
 */
export interface ImageMetadata {
  url: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
}

export function getImageMetadata(strapiImage: any): ImageMetadata {
  const url = adaptImageUrl(strapiImage.url);
  
  return {
    url,
    width: strapiImage.width,
    height: strapiImage.height,
    format: strapiImage.ext?.replace('.', ''),
    size: strapiImage.size
  };
}

/**
 * 生成图片的srcset属性
 */
export function generateSrcSet(baseUrl: string, sizes: number[] = [320, 640, 768, 1024, 1280]): string {
  const urls = getResponsiveImageUrls(baseUrl, sizes);
  
  if (urls.length === 1) {
    return urls[0];
  }

  return urls.map((url, index) => `${url} ${sizes[index]}w`).join(', ');
}

/**
 * 导出配置信息
 */
export const imageConfig = {
  strapiPublicUrl: getStrapiPublicUrl(),
  hasLocalMapping: Object.keys(imageMapping).length > 0,
  mappingCount: Object.keys(imageMapping).length
};

// 开发模式下输出调试信息（仅开发环境且非构建模式）
if (import.meta.env.DEV && !import.meta.env.PROD) {
  console.log('🖼️ 图片适配器配置:', imageConfig);
}
