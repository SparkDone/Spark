/**
 * 分类预热器 - 客户端预热即将访问的分类
 */

(function() {
  'use strict';

  // 防止重复加载
  if (window.categoryPreheaterLoaded) {
    return;
  }
  window.categoryPreheaterLoaded = true;

  // 预热缓存和初始化状态
  const preheatCache = new Set();
  let isInitialized = false;
  let popularCategoriesPreheated = false;

/**
 * 预热分类数据
 */
async function preheatCategory(categorySlug) {
  if (preheatCache.has(categorySlug)) {
    return; // 已经预热过
  }
  
  try {
    // 只在开发环境显示详细日志
    if (window.location.hostname === 'localhost') {
      console.log(`🔥 预热分类: ${categorySlug}`);
    }

    // 预加载分类页面的关键资源 - 直接访问分类页面而不是API
    const response = await fetch(`/categories/${categorySlug}/`, {
      method: 'HEAD' // 只获取头部信息，不下载内容
    });

    if (response.ok) {
      preheatCache.add(categorySlug);
      if (window.location.hostname === 'localhost') {
        console.log(`✅ 分类预热成功: ${categorySlug}`);
      }
    }
  } catch (error) {
    if (window.location.hostname === 'localhost') {
      console.warn(`⚠️ 分类预热失败: ${categorySlug}`, error);
    }
  }
}

/**
 * 初始化分类预热器
 */
function initializeCategoryPreheater() {
  // 防止重复初始化
  if (isInitialized) {
    // 减少重复日志输出
    return;
  }

  // 为所有分类链接添加鼠标悬停预热
  const categoryLinks = document.querySelectorAll('a[href*="/categories/"]');
  
  categoryLinks.forEach(link => {
    let hoverTimer = null;
    
    link.addEventListener('mouseenter', () => {
      // 延迟200ms开始预热，避免快速划过时的无效预热
      hoverTimer = setTimeout(() => {
        const href = link.getAttribute('href');
        const match = href.match(/\/categories\/([^\/]+)/);
        
        if (match && match[1]) {
          const categorySlug = decodeURIComponent(match[1]);
          preheatCategory(categorySlug);
        }
      }, 200);
    });
    
    link.addEventListener('mouseleave', () => {
      // 取消预热
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    });
    
    // 移动端触摸预热
    link.addEventListener('touchstart', () => {
      const href = link.getAttribute('href');
      const match = href.match(/\/categories\/([^\/]+)/);
      
      if (match && match[1]) {
        const categorySlug = decodeURIComponent(match[1]);
        preheatCategory(categorySlug);
      }
    }, { passive: true });
  });

  isInitialized = true;
  console.log(`🔥 分类预热器已初始化，监听 ${categoryLinks.length} 个分类链接`);
}

/**
 * 预热热门分类
 */
async function preheatPopularCategories() {
  // 防止重复预热
  if (popularCategoriesPreheated) {
    console.log('🔄 热门分类已预热，跳过重复预热');
    return;
  }

  try {
    // 获取侧边栏中的热门分类
    const categoryButtons = document.querySelectorAll('#categories a[href*="/categories/"]');
    const popularCategories = Array.from(categoryButtons)
      .slice(0, 3) // 只预热前3个热门分类
      .map(link => {
        const href = link.getAttribute('href');
        const match = href.match(/\/categories\/([^\/]+)/);
        return match ? decodeURIComponent(match[1]) : null;
      })
      .filter(Boolean);
    
    console.log('🔥 开始预热热门分类:', popularCategories);

    // 延迟预热，避免影响页面初始加载
    setTimeout(() => {
      popularCategories.forEach(category => {
        preheatCategory(category);
      });
      popularCategoriesPreheated = true;
    }, 2000);

  } catch (error) {
    console.warn('⚠️ 预热热门分类失败:', error);
    popularCategoriesPreheated = true; // 即使失败也标记为已尝试
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeCategoryPreheater();
    preheatPopularCategories();
  });
} else {
  initializeCategoryPreheater();
  preheatPopularCategories();
}

  // 导出函数供其他脚本使用
  if (typeof window !== 'undefined') {
    window.categoryPreheater = {
      preheatCategory,
      initializeCategoryPreheater,
      preheatPopularCategories
    };
  }

})(); // IIFE结束
