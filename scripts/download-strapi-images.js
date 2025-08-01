#!/usr/bin/env node

/**
 * 构建时下载Strapi图片脚本
 * 在构建过程中下载所有Strapi图片到本地，避免CORS问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置
const STRAPI_URL = process.env.STRAPI_URL || process.env.STRAPI_PUBLIC_URL || 'https://api.sparkdone.com';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const OUTPUT_DIR = path.join(__dirname, '../public/images/strapi');
const MAPPING_FILE = path.join(__dirname, '../src/data/image-mapping.json');

console.log('🖼️ 开始下载Strapi图片...');
console.log(`📡 Strapi URL: ${STRAPI_URL}`);
console.log(`📁 输出目录: ${OUTPUT_DIR}`);

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✅ 创建输出目录: ${OUTPUT_DIR}`);
}

/**
 * 获取所有文章数据
 */
async function fetchArticles() {
  try {
    const url = `${STRAPI_URL}/api/articles?populate=*`;
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }
    
    console.log(`📡 获取文章数据: ${url}`);
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ 获取到 ${data.data?.length || 0} 篇文章`);
    return data.data || [];
  } catch (error) {
    console.error('❌ 获取文章失败:', error.message);
    return [];
  }
}

/**
 * 获取网站配置数据
 */
async function fetchSiteConfig() {
  try {
    const endpoints = [
      '/api/index-settings?populate=*',
      '/api/site-config?populate=*',
      '/api/banners?populate=*'
    ];
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }
    
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const url = `${STRAPI_URL}${endpoint}`;
        console.log(`📡 获取配置数据: ${url}`);
        const response = await fetch(url, { headers });
        
        if (response.ok) {
          const data = await response.json();
          results.push(data);
        }
      } catch (error) {
        console.warn(`⚠️ 获取配置失败 ${endpoint}:`, error.message);
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ 获取配置失败:', error.message);
    return [];
  }
}

/**
 * 提取图片URL
 */
function extractImageUrls(data) {
  const imageUrls = new Set();
  
  function traverse(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
      obj.forEach(traverse);
      return;
    }
    
    // 检查常见的图片字段
    const imageFields = ['url', 'src', 'image', 'cover', 'banner', 'thumbnail', 'avatar'];
    
    for (const field of imageFields) {
      if (obj[field] && typeof obj[field] === 'string' && obj[field].startsWith('/uploads/')) {
        imageUrls.add(obj[field]);
      }
    }
    
    // 递归遍历所有属性
    Object.values(obj).forEach(traverse);
  }
  
  data.forEach(traverse);
  return Array.from(imageUrls);
}

/**
 * 下载单个图片
 */
async function downloadImage(imageUrl, outputPath) {
  try {
    const fullUrl = `${STRAPI_URL}${imageUrl}`;
    console.log(`⬇️ 下载图片: ${fullUrl}`);
    
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    
    console.log(`✅ 保存图片: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ 下载失败 ${imageUrl}:`, error.message);
    return false;
  }
}

/**
 * 生成唯一文件名
 */
function generateUniqueFilename(originalUrl) {
  const timestamp = Date.now();
  const ext = path.extname(originalUrl);
  const basename = path.basename(originalUrl, ext);
  return `${basename}-${timestamp}${ext}`;
}

/**
 * 主函数
 */
async function main() {
  try {
    // 获取所有数据
    const articles = await fetchArticles();
    const configs = await fetchSiteConfig();
    const allData = [...articles, ...configs];
    
    if (allData.length === 0) {
      console.warn('⚠️ 没有获取到任何数据，跳过图片下载');
      return;
    }
    
    // 提取图片URL
    const imageUrls = extractImageUrls(allData);
    console.log(`🖼️ 发现 ${imageUrls.length} 个图片URL`);
    
    if (imageUrls.length === 0) {
      console.warn('⚠️ 没有发现任何图片，跳过下载');
      return;
    }
    
    // 下载图片并生成映射
    const imageMapping = {};
    let successCount = 0;
    
    for (const imageUrl of imageUrls) {
      const filename = generateUniqueFilename(imageUrl);
      const outputPath = path.join(OUTPUT_DIR, filename);
      const localUrl = `/images/strapi/${filename}`;
      
      const success = await downloadImage(imageUrl, outputPath);
      if (success) {
        imageMapping[imageUrl] = localUrl;
        successCount++;
      }
    }
    
    // 保存映射文件
    fs.writeFileSync(MAPPING_FILE, JSON.stringify(imageMapping, null, 2));
    console.log(`✅ 保存映射文件: ${MAPPING_FILE}`);
    
    console.log(`🎉 图片下载完成！成功: ${successCount}/${imageUrls.length}`);
    
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

// 运行脚本
main();
