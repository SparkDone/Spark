/**
 * 性能监控面板 - 监控分类预热和缓存效果
 */

(function() {
  'use strict';

  // 防止重复加载
  if (window.performanceMonitorLoaded) {
    return;
  }
  window.performanceMonitorLoaded = true;

  // 性能数据收集
  const performanceData = {
  categoryLoadTimes: new Map(),
  cacheHits: 0,
  cacheMisses: 0,
  preheatSuccess: 0,
  preheatFailed: 0,
  startTime: Date.now()
};

/**
 * 记录分类加载时间
 */
function recordCategoryLoadTime(category, loadTime) {
  performanceData.categoryLoadTimes.set(category, loadTime);
  
  // 只在开发环境显示
  if (window.location.hostname === 'localhost') {
    console.log(`⏱️ 分类 "${category}" 加载时间: ${loadTime}ms`);
  }
}

/**
 * 记录缓存命中
 */
function recordCacheHit(category) {
  performanceData.cacheHits++;
  
  if (window.location.hostname === 'localhost') {
    console.log(`🎯 缓存命中: ${category}`);
  }
}

/**
 * 记录缓存未命中
 */
function recordCacheMiss(category) {
  performanceData.cacheMisses++;
  
  if (window.location.hostname === 'localhost') {
    console.log(`🔄 缓存未命中: ${category}`);
  }
}

/**
 * 记录预热成功
 */
function recordPreheatSuccess(category) {
  performanceData.preheatSuccess++;
  
  if (window.location.hostname === 'localhost') {
    console.log(`🔥 预热成功: ${category}`);
  }
}

/**
 * 记录预热失败
 */
function recordPreheatFailed(category) {
  performanceData.preheatFailed++;
  
  if (window.location.hostname === 'localhost') {
    console.warn(`❌ 预热失败: ${category}`);
  }
}

/**
 * 获取性能统计
 */
function getPerformanceStats() {
  const totalRequests = performanceData.cacheHits + performanceData.cacheMisses;
  const cacheHitRate = totalRequests > 0 ? (performanceData.cacheHits / totalRequests * 100).toFixed(1) : 0;
  const avgLoadTime = performanceData.categoryLoadTimes.size > 0 
    ? Array.from(performanceData.categoryLoadTimes.values()).reduce((a, b) => a + b, 0) / performanceData.categoryLoadTimes.size
    : 0;
  
  return {
    运行时间: `${Math.round((Date.now() - performanceData.startTime) / 1000)}秒`,
    缓存命中率: `${cacheHitRate}%`,
    缓存命中次数: performanceData.cacheHits,
    缓存未命中次数: performanceData.cacheMisses,
    预热成功次数: performanceData.preheatSuccess,
    预热失败次数: performanceData.preheatFailed,
    平均加载时间: `${avgLoadTime.toFixed(0)}ms`,
    已加载分类数: performanceData.categoryLoadTimes.size,
    分类加载详情: Object.fromEntries(performanceData.categoryLoadTimes)
  };
}

/**
 * 显示性能面板
 */
function showPerformancePanel() {
  const stats = getPerformanceStats();
  
  console.group('📊 分类加载性能统计');
  Object.entries(stats).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
  console.groupEnd();
  
  return stats;
}

/**
 * 创建性能监控快捷键
 */
function setupPerformanceShortcuts() {
  // 只在开发环境启用
  if (window.location.hostname !== 'localhost') {
    return;
  }
  
  // Ctrl+Shift+P 显示性能面板
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      showPerformancePanel();
    }
  });
  
  console.log('🔧 性能监控快捷键已启用: Ctrl+Shift+P 显示性能统计');
}

/**
 * 监控页面导航性能
 */
function monitorNavigationPerformance() {
  // 监控页面加载时间
  window.addEventListener('load', () => {
    if (performance.navigation) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      console.log(`📄 页面总加载时间: ${loadTime}ms`);
    }
  });
  
  // 监控分类页面导航
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  function trackNavigation(url) {
    const categoryMatch = url.match(/\/categories\/([^\/]+)/);
    if (categoryMatch) {
      const category = decodeURIComponent(categoryMatch[1]);
      const startTime = Date.now();
      
      // 记录导航开始时间
      setTimeout(() => {
        const loadTime = Date.now() - startTime;
        recordCategoryLoadTime(category, loadTime);
      }, 100);
    }
  }
  
  history.pushState = function(state, title, url) {
    trackNavigation(url);
    return originalPushState.apply(this, arguments);
  };
  
  history.replaceState = function(state, title, url) {
    trackNavigation(url);
    return originalReplaceState.apply(this, arguments);
  };
}

// 初始化性能监控
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupPerformanceShortcuts();
    monitorNavigationPerformance();
  });
} else {
  setupPerformanceShortcuts();
  monitorNavigationPerformance();
}

  // 导出到全局对象
  if (typeof window !== 'undefined') {
    window.performanceMonitor = {
      recordCategoryLoadTime,
      recordCacheHit,
      recordCacheMiss,
      recordPreheatSuccess,
      recordPreheatFailed,
      getPerformanceStats,
      showPerformancePanel
    };

    // 5分钟后自动显示一次性能统计
    setTimeout(() => {
      if (window.location.hostname === 'localhost') {
        console.log('📊 5分钟性能自动报告:');
        showPerformancePanel();
      }
    }, 5 * 60 * 1000);
  }

})(); // IIFE结束
