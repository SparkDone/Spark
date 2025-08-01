/**
 * 字体加载管理脚本
 * 可以替代Layout.astro中的内联字体加载脚本
 */

export function initializeFontLoader(options = {}) {
  const {
    fontFamily = 'Noto Sans SC',
    timeout = 500,
    fallbackTimeout = 1000
  } = options;

  console.log(`🔤 开始加载字体: ${fontFamily}`);
  
  // 立即设置字体加载状态
  document.documentElement.classList.add('fonts-loading');

  // 简化的字体加载，快速超时
  const timeoutPromise = new Promise(resolve => setTimeout(resolve, timeout));

  // 尝试加载字体，但不阻塞页面显示
  const fontPromises = [
    document.fonts.load(`400 1em '${fontFamily}'`).catch(() => {}),
    document.fonts.load(`500 1em '${fontFamily}'`).catch(() => {}),
    document.fonts.load(`700 1em '${fontFamily}'`).catch(() => {}),
  ];

  Promise.race([Promise.all(fontPromises), timeoutPromise])
    .then(() => {
      // 字体加载完成或超时
      document.documentElement.classList.remove('fonts-loading');
      document.documentElement.classList.add('fonts-loaded');
      console.log('✅ 字体加载完成');
    })
    .catch(error => {
      console.log("Font loading error:", error);
      // 出错时也要显示内容
      document.documentElement.classList.remove('fonts-loading');
      document.documentElement.classList.add('fonts-loaded');
    });

  // 确保页面在任何情况下都能显示（备用机制）
  setTimeout(() => {
    if (document.documentElement.classList.contains('fonts-loading')) {
      document.documentElement.classList.remove('fonts-loading');
      document.documentElement.classList.add('fonts-loaded');
      console.log('⚠️ 字体加载超时，强制显示页面');
    }
  }, fallbackTimeout);
}

// 导出字体管理工具
export const fontLoader = {
  isLoaded() {
    return document.documentElement.classList.contains('fonts-loaded');
  },
  
  forceLoad() {
    document.documentElement.classList.remove('fonts-loading');
    document.documentElement.classList.add('fonts-loaded');
    console.log('🔤 强制完成字体加载');
  }
};

// 如果在浏览器环境中，自动挂载到window
if (typeof window !== 'undefined') {
  window.fontLoader = fontLoader;
}
