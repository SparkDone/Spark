/**
 * HTML优化脚本 - 构建后处理HTML文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 移除重复的CSS样式块
 */
function removeDuplicateStyles(html) {
  const styleBlocks = new Set();
  const duplicateIndices = [];
  
  // 匹配所有style标签
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
  const matches = [];
  let match;
  
  while ((match = styleRegex.exec(html)) !== null) {
    matches.push({
      fullMatch: match[0],
      content: match[1].trim(),
      index: match.index
    });
  }
  
  // 找出重复的样式块
  const seenContent = new Map();
  matches.forEach((styleMatch, index) => {
    if (seenContent.has(styleMatch.content)) {
      duplicateIndices.push(index);
    } else {
      seenContent.set(styleMatch.content, index);
    }
  });
  
  // 从后往前移除重复的样式块（避免索引变化）
  let optimizedHtml = html;
  duplicateIndices.reverse().forEach(index => {
    const duplicateMatch = matches[index];
    optimizedHtml = optimizedHtml.replace(duplicateMatch.fullMatch, '');
  });
  
  console.log(`✅ 移除了 ${duplicateIndices.length} 个重复的CSS样式块`);
  return optimizedHtml;
}

/**
 * 移除调试相关的CSS和HTML
 */
function removeDebugContent(html) {
  let optimizedHtml = html;
  let removedCount = 0;
  
  // 调试相关的CSS样式模式
  const debugPatterns = [
    // 调试相关的style标签内容
    /body\{font-family:Arial,sans-serif;margin:20px\}\.debug-info\[data-astro-cid-[^\]]+\][^}]*\}[^<]*/g,
    /body\{font-family:Arial,sans-serif;margin:20px\}\.test-section\[data-astro-cid-[^\]]+\][^}]*\}[^<]*/g,
    
    // 完整的调试样式块
    /<style[^>]*>body\{font-family:Arial,sans-serif;margin:20px\}\.debug-info[\s\S]*?<\/style>/g,
    /<style[^>]*>body\{font-family:Arial,sans-serif;margin:20px\}\.test-section[\s\S]*?<\/style>/g,
  ];
  
  debugPatterns.forEach(pattern => {
    const matches = optimizedHtml.match(pattern);
    if (matches) {
      removedCount += matches.length;
      optimizedHtml = optimizedHtml.replace(pattern, '');
    }
  });
  
  console.log(`✅ 移除了 ${removedCount} 个调试相关的CSS块`);
  return optimizedHtml;
}

/**
 * 合并相同的内联样式
 */
function mergeInlineStyles(html) {
  // 提取所有style标签内容
  const styleContents = [];
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let match;
  
  while ((match = styleRegex.exec(html)) !== null) {
    styleContents.push(match[1]);
  }
  
  if (styleContents.length <= 1) {
    return html;
  }
  
  // 合并所有CSS内容
  const mergedCSS = styleContents.join('');
  
  // 移除所有原有的style标签
  let optimizedHtml = html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
  
  // 在head结束前插入合并后的样式
  optimizedHtml = optimizedHtml.replace(
    '</head>',
    `<style>${mergedCSS}</style>\n</head>`
  );
  
  console.log(`✅ 合并了 ${styleContents.length} 个内联样式块为 1 个`);
  return optimizedHtml;
}

/**
 * 清理空的样式块
 */
function removeEmptyStyles(html) {
  const emptyStyleRegex = /<style[^>]*>\s*<\/style>/g;
  const matches = html.match(emptyStyleRegex);
  const count = matches ? matches.length : 0;
  
  const optimizedHtml = html.replace(emptyStyleRegex, '');
  
  if (count > 0) {
    console.log(`✅ 移除了 ${count} 个空的样式块`);
  }
  
  return optimizedHtml;
}

/**
 * 优化图片标签
 */
function optimizeImages(html) {
  let count = 0;

  // 为没有loading属性的图片添加lazy loading
  const optimizedHtml = html.replace(
    /<img([^>]*?)(?!\s+loading=)([^>]*?)>/g,
    (match, before, after) => {
      count++;
      return `<img${before} loading="lazy" decoding="async"${after}>`;
    }
  );

  if (count > 0) {
    console.log(`✅ 优化了 ${count} 个图片标签`);
  }

  return optimizedHtml;
}

/**
 * 添加资源预加载提示
 */
function addResourceHints(html) {
  // 动态获取Strapi URL - 默认使用你的域名
  const strapiUrl = process.env.STRAPI_PUBLIC_URL || process.env.STRAPI_URL || 'https://api.sparkdone.com:1337';
  const strapiDomain = new URL(strapiUrl).hostname;
  const strapiProtocol = new URL(strapiUrl).protocol;

  const hints = [
    '<!-- 资源预加载优化 -->',
    `<link rel="dns-prefetch" href="//${strapiDomain}">`,
    `<link rel="preconnect" href="${strapiProtocol}//${strapiDomain}" crossorigin>`,
    // 移除硬编码的CSS预加载，避免404错误
    // '注释：这些文件名在每次构建时都会变化'
  ];

  // 在第一个link标签前插入资源提示
  const optimizedHtml = html.replace(
    /<link rel="stylesheet"/,
    `${hints.join('\n')}\n<link rel="stylesheet"`
  );

  console.log('✅ 添加了资源预加载提示');
  return optimizedHtml;
}

/**
 * 优化内联JavaScript（压缩小的脚本）
 */
function optimizeInlineJS(html) {
  // 压缩小的内联JavaScript（小于500字符）
  return html.replace(/<script[^>]*>([\s\S]*?)<\/script>/g, (match, jsContent) => {
    // 跳过外部脚本和大型脚本
    if (match.includes('src=') || jsContent.length > 500) {
      return match;
    }

    // 简单的JS压缩
    const compressedJS = jsContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
      .replace(/\/\/.*$/gm, '') // 移除单行注释
      .replace(/\s+/g, ' ') // 合并空白
      .replace(/;\s*}/g, '}') // 移除分号前的空格
      .replace(/{\s*/g, '{') // 移除大括号后的空格
      .replace(/\s*}/g, '}') // 移除大括号前的空格
      .trim();

    return match.replace(jsContent, compressedJS);
  });
}

/**
 * 压缩HTML（保守压缩，保持可读性）
 */
function compressHTML(html) {
  return html
    // 移除多余的空行
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // 移除行首行尾空白
    .replace(/^\s+|\s+$/gm, '')
    // 移除HTML注释（保留条件注释和特殊注释）
    .replace(/<!--(?!\[if)(?!.*?资源预加载)[\s\S]*?-->/g, '')
    // 移除标签间的多余空白（保守处理）
    .replace(/>\s+</g, '><')
    .trim();
}

/**
 * 优化单个HTML文件
 */
function optimizeHTMLFile(filePath) {
  console.log(`\n🔧 优化文件: ${filePath}`);
  
  const originalHtml = fs.readFileSync(filePath, 'utf-8');
  const originalSize = originalHtml.length;
  
  let optimizedHtml = originalHtml;
  
  // 应用优化步骤
  optimizedHtml = removeDuplicateStyles(optimizedHtml);
  optimizedHtml = removeDebugContent(optimizedHtml);
  optimizedHtml = removeEmptyStyles(optimizedHtml);
  optimizedHtml = mergeInlineStyles(optimizedHtml);
  optimizedHtml = addResourceHints(optimizedHtml);
  optimizedHtml = optimizeImages(optimizedHtml);
  optimizedHtml = optimizeInlineJS(optimizedHtml);
  optimizedHtml = compressHTML(optimizedHtml);
  
  const optimizedSize = optimizedHtml.length;
  const savings = originalSize - optimizedSize;
  const savingsPercentage = ((savings / originalSize) * 100).toFixed(2);
  
  // 写入优化后的文件
  fs.writeFileSync(filePath, optimizedHtml, 'utf-8');
  
  console.log(`📊 优化结果:`);
  console.log(`   原始大小: ${originalSize} 字节`);
  console.log(`   优化后大小: ${optimizedSize} 字节`);
  console.log(`   节省: ${savings} 字节 (${savingsPercentage}%)`);
}

/**
 * 递归查找HTML文件
 */
function findHTMLFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始HTML优化...');

  // 显示环境信息
  console.log('🌍 环境信息:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || '未设置'}`);
  console.log(`   STRAPI_URL: ${process.env.STRAPI_URL || '未设置'}`);
  console.log(`   STRAPI_PUBLIC_URL: ${process.env.STRAPI_PUBLIC_URL || '未设置'}`);

  const distDir = path.join(__dirname, '../dist');

  if (!fs.existsSync(distDir)) {
    console.error('❌ dist目录不存在，请先运行构建命令');
    process.exit(1);
  }
  
  const htmlFiles = findHTMLFiles(distDir);
  
  if (htmlFiles.length === 0) {
    console.log('⚠️ 未找到HTML文件');
    return;
  }
  
  console.log(`📁 找到 ${htmlFiles.length} 个HTML文件`);
  
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  
  htmlFiles.forEach(filePath => {
    const originalSize = fs.statSync(filePath).size;
    optimizeHTMLFile(filePath);
    const optimizedSize = fs.statSync(filePath).size;
    
    totalOriginalSize += originalSize;
    totalOptimizedSize += optimizedSize;
  });
  
  const totalSavings = totalOriginalSize - totalOptimizedSize;
  const totalSavingsPercentage = ((totalSavings / totalOriginalSize) * 100).toFixed(2);
  
  console.log('\n🎉 HTML优化完成！');
  console.log(`📊 总体优化结果:`);
  console.log(`   处理文件: ${htmlFiles.length} 个`);
  console.log(`   原始总大小: ${totalOriginalSize} 字节`);
  console.log(`   优化后总大小: ${totalOptimizedSize} 字节`);
  console.log(`   总节省: ${totalSavings} 字节 (${totalSavingsPercentage}%)`);
}

// 运行主函数
main();
