/**
 * 图片优化脚本
 * 生成响应式图片和现代格式
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const config = {
  inputDir: path.join(__dirname, '../public/images'),
  outputDir: path.join(__dirname, '../public/images/optimized'),
  sizes: [320, 640, 768, 1024, 1280, 1920],
  formats: ['webp', 'avif'],
  quality: {
    jpeg: 80,
    webp: 80,
    avif: 70
  }
};

// 支持的图片格式
const supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];

/**
 * 检查文件是否为图片
 */
function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return supportedFormats.includes(ext);
}

/**
 * 生成响应式图片
 */
async function generateResponsiveImages(inputPath, outputDir, filename) {
  const baseName = path.parse(filename).name;
  const originalExt = path.parse(filename).ext;
  
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`📸 处理图片: ${filename} (${metadata.width}x${metadata.height})`);
    
    // 生成不同尺寸
    for (const size of config.sizes) {
      // 跳过比原图更大的尺寸
      if (size > metadata.width) continue;
      
      // 原始格式
      const originalOutput = path.join(outputDir, `${baseName}-${size}w${originalExt}`);
      await image
        .resize(size, null, { withoutEnlargement: true })
        .jpeg({ quality: config.quality.jpeg })
        .png({ quality: config.quality.jpeg })
        .toFile(originalOutput);
      
      // 现代格式
      for (const format of config.formats) {
        const modernOutput = path.join(outputDir, `${baseName}-${size}w.${format}`);
        await image
          .resize(size, null, { withoutEnlargement: true })
          [format]({ quality: config.quality[format] })
          .toFile(modernOutput);
      }
    }
    
    // 生成原尺寸的现代格式
    for (const format of config.formats) {
      const modernOutput = path.join(outputDir, `${baseName}.${format}`);
      await image
        [format]({ quality: config.quality[format] })
        .toFile(modernOutput);
    }
    
    console.log(`✅ 完成: ${filename}`);
    
  } catch (error) {
    console.error(`❌ 处理失败 ${filename}:`, error.message);
  }
}

/**
 * 递归处理目录
 */
async function processDirectory(inputDir, outputDir) {
  try {
    await fs.mkdir(outputDir, { recursive: true });
    
    const files = await fs.readdir(inputDir);
    
    for (const file of files) {
      const inputPath = path.join(inputDir, file);
      const stat = await fs.stat(inputPath);
      
      if (stat.isDirectory()) {
        // 递归处理子目录
        const subOutputDir = path.join(outputDir, file);
        await processDirectory(inputPath, subOutputDir);
      } else if (isImageFile(file)) {
        // 处理图片文件
        await generateResponsiveImages(inputPath, outputDir, file);
      }
    }
  } catch (error) {
    console.error(`❌ 处理目录失败 ${inputDir}:`, error.message);
  }
}

/**
 * 生成图片映射文件
 */
async function generateImageMap(outputDir) {
  const imageMap = {};
  
  async function scanDirectory(dir, relativePath = '') {
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        await scanDirectory(fullPath, path.join(relativePath, file));
      } else if (isImageFile(file)) {
        const baseName = path.parse(file).name;
        const key = path.join(relativePath, baseName).replace(/\\/g, '/');
        
        if (!imageMap[key]) {
          imageMap[key] = {
            original: path.join(relativePath, file).replace(/\\/g, '/'),
            sizes: [],
            formats: {}
          };
        }
        
        // 检查是否为响应式尺寸
        const sizeMatch = baseName.match(/-(\d+)w$/);
        if (sizeMatch) {
          const size = parseInt(sizeMatch[1]);
          const originalBaseName = baseName.replace(/-\d+w$/, '');
          const originalKey = path.join(relativePath, originalBaseName).replace(/\\/g, '/');
          
          if (!imageMap[originalKey]) {
            imageMap[originalKey] = {
              original: '',
              sizes: [],
              formats: {}
            };
          }
          
          imageMap[originalKey].sizes.push({
            size,
            url: path.join(relativePath, file).replace(/\\/g, '/')
          });
        }
        
        // 检查现代格式
        const ext = path.extname(file).toLowerCase();
        if (ext === '.webp' || ext === '.avif') {
          const originalBaseName = baseName.replace(/-\d+w$/, '');
          const originalKey = path.join(relativePath, originalBaseName).replace(/\\/g, '/');
          
          if (!imageMap[originalKey]) {
            imageMap[originalKey] = {
              original: '',
              sizes: [],
              formats: {}
            };
          }
          
          imageMap[originalKey].formats[ext.slice(1)] = path.join(relativePath, file).replace(/\\/g, '/');
        }
      }
    }
  }
  
  await scanDirectory(outputDir);
  
  // 保存映射文件
  const mapPath = path.join(__dirname, '../src/data/image-map.json');
  await fs.writeFile(mapPath, JSON.stringify(imageMap, null, 2));
  console.log(`📋 图片映射文件已生成: ${mapPath}`);
}

/**
 * 主函数
 */
async function main() {
  console.log('🖼️ 开始图片优化...');
  console.log(`📁 输入目录: ${config.inputDir}`);
  console.log(`📁 输出目录: ${config.outputDir}`);
  console.log(`📐 生成尺寸: ${config.sizes.join(', ')}`);
  console.log(`🎨 生成格式: ${config.formats.join(', ')}`);
  
  try {
    // 检查输入目录是否存在
    await fs.access(config.inputDir);
    
    // 处理图片
    await processDirectory(config.inputDir, config.outputDir);
    
    // 生成映射文件
    await generateImageMap(config.outputDir);
    
    console.log('🎉 图片优化完成！');
    
  } catch (error) {
    console.error('❌ 图片优化失败:', error.message);
    process.exit(1);
  }
}

// 运行脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
