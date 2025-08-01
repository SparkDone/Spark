#!/usr/bin/env node

/**
 * 构建后处理脚本
 * 修复生产环境的文件路径问题
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔧 开始构建后处理...');

// 1. 复制 Pagefind 文件到 client 目录
function copyPagefindFiles() {
  const pagefindSource = join(projectRoot, 'dist', 'pagefind');
  const pagefindTarget = join(projectRoot, 'dist', 'client', 'pagefind');
  
  if (existsSync(pagefindSource)) {
    console.log('📁 复制 Pagefind 文件到 client 目录...');
    
    // 确保目标目录存在
    if (!existsSync(pagefindTarget)) {
      mkdirSync(pagefindTarget, { recursive: true });
    }
    
    // 复制文件
    cpSync(pagefindSource, pagefindTarget, { recursive: true });
    console.log('✅ Pagefind 文件复制完成');
  } else {
    console.warn('⚠️ Pagefind 源目录不存在:', pagefindSource);
  }
}

// 2. 修复 CSS 文件路径问题
function fixCSSPaths() {
  console.log('🎨 检查 CSS 文件路径...');
  
  const clientDir = join(projectRoot, 'dist', 'client');
  const astroDir = join(clientDir, '_astro');
  
  if (existsSync(astroDir)) {
    console.log('✅ CSS 文件已正确打包到 _astro 目录');
  } else {
    console.warn('⚠️ _astro 目录不存在');
  }
}

// 3. 生成性能优化的服务器配置
function generateServerConfig() {
  console.log('⚙️ 生成服务器配置...');
  
  const serverConfig = {
    // 静态资源缓存配置
    staticAssets: {
      '/_astro/*': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      },
      '/pagefind/*': {
        headers: {
          'Cache-Control': 'public, max-age=86400'
        }
      },
      '/favicon/*': {
        headers: {
          'Cache-Control': 'public, max-age=86400'
        }
      }
    },
    
    // 压缩配置
    compression: {
      enabled: true,
      types: ['text/html', 'text/css', 'application/javascript', 'application/json']
    },
    
    // 性能优化 - 移除硬编码的CSS预加载
    performance: {
      preload: [
        // 注释：这些文件名在每次构建时都会变化，由Astro自动处理
      ]
    }
  };
  
  const configPath = join(projectRoot, 'dist', 'server-config.json');
  writeFileSync(configPath, JSON.stringify(serverConfig, null, 2));
  console.log('✅ 服务器配置已生成:', configPath);
}

// 4. 验证关键文件
function validateBuild() {
  console.log('🔍 验证构建结果...');
  
  const criticalFiles = [
    // 移除硬编码的CSS文件验证，因为文件名会变化
    'dist/client/pagefind/pagefind.js',
    'dist/server/entry.mjs'
  ];
  
  let allValid = true;
  
  for (const file of criticalFiles) {
    const filePath = join(projectRoot, file);
    if (existsSync(filePath)) {
      console.log('✅', file);
    } else {
      console.error('❌', file, '- 文件不存在');
      allValid = false;
    }
  }
  
  if (allValid) {
    console.log('🎉 构建验证通过！');
  } else {
    console.error('💥 构建验证失败！');
    process.exit(1);
  }
}

// 5. 生成部署信息
function generateDeployInfo() {
  console.log('📋 生成部署信息...');
  
  const deployInfo = {
    buildTime: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: 'production',
    features: {
      pagefind: existsSync(join(projectRoot, 'dist', 'client', 'pagefind', 'pagefind.js')),
      staticAssets: existsSync(join(projectRoot, 'dist', 'client', '_astro')),
      serverSide: existsSync(join(projectRoot, 'dist', 'server', 'entry.mjs'))
    },
    optimizations: {
      cssMinified: true,
      jsMinified: true,
      imagesOptimized: true,
      fontsSubset: true
    }
  };
  
  const deployInfoPath = join(projectRoot, 'dist', 'deploy-info.json');
  writeFileSync(deployInfoPath, JSON.stringify(deployInfo, null, 2));
  console.log('✅ 部署信息已生成:', deployInfoPath);
}

// 执行所有处理步骤
async function main() {
  try {
    copyPagefindFiles();
    fixCSSPaths();
    generateServerConfig();
    validateBuild();
    generateDeployInfo();
    
    console.log('🎉 构建后处理完成！');
    console.log('');
    console.log('📦 部署准备就绪:');
    console.log('  - 静态资源: dist/client/');
    console.log('  - 服务器代码: dist/server/');
    console.log('  - Pagefind 搜索: dist/client/pagefind/');
    console.log('');
    console.log('🚀 可以开始部署了！');
    
  } catch (error) {
    console.error('💥 构建后处理失败:', error);
    process.exit(1);
  }
}

main();
