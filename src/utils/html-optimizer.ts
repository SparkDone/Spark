/**
 * HTML优化工具 - 清理和优化HTML输出
 */

/**
 * 移除重复的CSS样式块
 */
export function removeDuplicateStyles(html: string): string {
  const styleBlocks = new Set<string>();
  const duplicateStyles: string[] = [];
  
  // 匹配所有style标签
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let match;
  
  while ((match = styleRegex.exec(html)) !== null) {
    const styleContent = match[1].trim();
    
    if (styleBlocks.has(styleContent)) {
      // 记录重复的样式块
      duplicateStyles.push(match[0]);
    } else {
      styleBlocks.add(styleContent);
    }
  }
  
  // 移除重复的样式块
  let optimizedHtml = html;
  duplicateStyles.forEach(duplicateStyle => {
    const firstOccurrence = optimizedHtml.indexOf(duplicateStyle);
    const secondOccurrence = optimizedHtml.indexOf(duplicateStyle, firstOccurrence + 1);
    
    if (secondOccurrence !== -1) {
      optimizedHtml = optimizedHtml.replace(duplicateStyle, '');
    }
  });
  
  return optimizedHtml;
}

/**
 * 移除调试相关的CSS和HTML
 */
export function removeDebugContent(html: string): string {
  // 移除调试相关的CSS类
  const debugPatterns = [
    // 调试相关的style标签
    /<style[^>]*>[\s\S]*?\.debug-info\[data-astro-cid-[^\]]+\][\s\S]*?<\/style>/g,
    /<style[^>]*>[\s\S]*?\.test-section\[data-astro-cid-[^\]]+\][\s\S]*?<\/style>/g,
    
    // 调试相关的HTML元素
    /<div[^>]*class="[^"]*debug-info[^"]*"[\s\S]*?<\/div>/g,
    /<div[^>]*class="[^"]*test-section[^"]*"[\s\S]*?<\/div>/g,
    
    // 调试相关的注释
    /<!--[\s\S]*?调试[\s\S]*?-->/g,
    /<!--[\s\S]*?debug[\s\S]*?-->/gi,
  ];
  
  let optimizedHtml = html;
  debugPatterns.forEach(pattern => {
    optimizedHtml = optimizedHtml.replace(pattern, '');
  });
  
  return optimizedHtml;
}

/**
 * 压缩HTML（移除不必要的空白）
 */
export function compressHTML(html: string): string {
  return html
    // 移除HTML标签之间的多余空白
    .replace(/>\s+</g, '><')
    // 移除行首行尾空白
    .replace(/^\s+|\s+$/gm, '')
    // 合并多个空行为单个空行
    .replace(/\n\s*\n/g, '\n')
    // 移除注释（保留条件注释）
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    .trim();
}

/**
 * 优化内联CSS
 */
export function optimizeInlineCSS(html: string): string {
  // 合并相同的CSS规则
  const cssRules = new Map<string, Set<string>>();
  
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let match;
  
  while ((match = styleRegex.exec(html)) !== null) {
    const styleContent = match[1];
    
    // 解析CSS规则
    const ruleRegex = /([^{]+)\{([^}]+)\}/g;
    let ruleMatch;
    
    while ((ruleMatch = ruleRegex.exec(styleContent)) !== null) {
      const selector = ruleMatch[1].trim();
      const properties = ruleMatch[2].trim();
      
      if (!cssRules.has(selector)) {
        cssRules.set(selector, new Set());
      }
      
      // 分割属性并添加到集合中
      properties.split(';').forEach(prop => {
        const trimmedProp = prop.trim();
        if (trimmedProp) {
          cssRules.get(selector)!.add(trimmedProp);
        }
      });
    }
  }
  
  // 重新构建优化后的CSS
  const optimizedCSS = Array.from(cssRules.entries())
    .map(([selector, properties]) => {
      const props = Array.from(properties).join(';');
      return `${selector}{${props}}`;
    })
    .join('');
  
  // 替换原有的style标签
  return html.replace(
    /<style[^>]*>[\s\S]*?<\/style>/g,
    `<style>${optimizedCSS}</style>`
  );
}

/**
 * 添加资源预加载提示
 */
export function addResourceHints(html: string): string {
  // 获取Strapi URL，移除协议部分用于DNS预解析
  const strapiUrl = process.env.STRAPI_PUBLIC_URL || process.env.STRAPI_URL || 'http://localhost:1337';
  const strapiDomain = strapiUrl.replace(/^https?:\/\//, '');

  const hints = [
    // DNS预解析
    `<link rel="dns-prefetch" href="//${strapiDomain}">`,
    '<link rel="dns-prefetch" href="//fonts.googleapis.com">',

    // 预连接重要资源
    `<link rel="preconnect" href="${strapiUrl}" crossorigin>`,
    
    // 预加载关键CSS - 移除硬编码的文件名
    // 注释：这些文件名在每次构建时都会变化，硬编码会导致404错误
    // Astro会自动处理CSS的预加载和优化
  ];
  
  // 在head标签结束前插入资源提示
  return html.replace(
    '</head>',
    `${hints.join('\n')}\n</head>`
  );
}

/**
 * 优化图片标签
 */
export function optimizeImages(html: string): string {
  // 为图片添加loading="lazy"和decoding="async"
  return html.replace(
    /<img([^>]*?)(?!\s+loading=)(?!\s+decoding=)([^>]*?)>/g,
    '<img$1 loading="lazy" decoding="async"$2>'
  );
}

/**
 * 添加安全相关的meta标签
 */
export function addSecurityHeaders(html: string): string {
  const securityMetas = [
    '<meta http-equiv="X-Content-Type-Options" content="nosniff">',
    '<meta http-equiv="X-Frame-Options" content="DENY">',
    '<meta http-equiv="X-XSS-Protection" content="1; mode=block">',
    '<meta name="referrer" content="strict-origin-when-cross-origin">',
  ];
  
  // 在现有meta标签后添加安全标签
  return html.replace(
    /<meta name="viewport"[^>]*>/,
    `$&\n${securityMetas.join('\n')}`
  );
}

/**
 * 完整的HTML优化流程
 */
export function optimizeHTML(html: string, options: {
  removeDuplicates?: boolean;
  removeDebug?: boolean;
  compress?: boolean;
  addResourceHints?: boolean;
  addSecurity?: boolean;
  optimizeImages?: boolean;
} = {}): string {
  let optimizedHtml = html;
  
  const {
    removeDuplicates = true,
    removeDebug = true,
    compress = false, // 默认关闭，因为可能影响可读性
    addResourceHints = true,
    addSecurity = true,
    optimizeImages = true
  } = options;
  
  if (removeDuplicates) {
    optimizedHtml = removeDuplicateStyles(optimizedHtml);
  }
  
  if (removeDebug) {
    optimizedHtml = removeDebugContent(optimizedHtml);
  }
  
  if (addResourceHints) {
    optimizedHtml = addResourceHints(optimizedHtml);
  }
  
  if (addSecurity) {
    optimizedHtml = addSecurityHeaders(optimizedHtml);
  }
  
  if (optimizeImages) {
    optimizedHtml = optimizeImages(optimizedHtml);
  }
  
  if (compress) {
    optimizedHtml = compressHTML(optimizedHtml);
  }
  
  return optimizedHtml;
}

/**
 * 生成优化报告
 */
export function generateOptimizationReport(
  originalHtml: string,
  optimizedHtml: string
): {
  originalSize: number;
  optimizedSize: number;
  savings: number;
  savingsPercentage: number;
  optimizations: string[];
} {
  const originalSize = originalHtml.length;
  const optimizedSize = optimizedHtml.length;
  const savings = originalSize - optimizedSize;
  const savingsPercentage = (savings / originalSize) * 100;
  
  const optimizations: string[] = [];
  
  // 检测应用的优化
  if (originalHtml.includes('debug-info') && !optimizedHtml.includes('debug-info')) {
    optimizations.push('移除调试内容');
  }
  
  if (originalHtml.match(/<style[^>]*>[\s\S]*?<\/style>/g)?.length !== 
      optimizedHtml.match(/<style[^>]*>[\s\S]*?<\/style>/g)?.length) {
    optimizations.push('合并重复样式');
  }
  
  if (optimizedHtml.includes('rel="preload"')) {
    optimizations.push('添加资源预加载');
  }
  
  if (optimizedHtml.includes('X-Content-Type-Options')) {
    optimizations.push('添加安全头');
  }
  
  return {
    originalSize,
    optimizedSize,
    savings,
    savingsPercentage: Math.round(savingsPercentage * 100) / 100,
    optimizations
  };
}
