/**
 * 主题管理脚本
 * 可以替代Layout.astro中的内联主题脚本
 */

// 主题常量
const LIGHT_MODE = "light";
const DARK_MODE = "dark";
const AUTO_MODE = "auto";
const DEFAULT_THEME = "dark"; // 默认暗黑模式

export function initializeTheme(configHue = 260) {
  // Load the theme from local storage, 默认为暗黑模式
  const theme = localStorage.getItem('theme') || DEFAULT_THEME;

  // 如果是首次访问且没有设置主题，设置为暗黑模式
  if (!localStorage.getItem('theme')) {
    localStorage.setItem('theme', DARK_MODE);
  }

  switch (theme) {
    case LIGHT_MODE:
      document.documentElement.classList.remove('dark');
      break;
    case DARK_MODE:
      document.documentElement.classList.add('dark');
      break;
    case AUTO_MODE:
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      break;
    default:
      // 默认情况下使用暗黑模式
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', DARK_MODE);
  }

  // Load the hue from local storage
  const hue = localStorage.getItem('hue') || configHue;
  document.documentElement.style.setProperty('--hue', hue);

  // 只在开发环境显示初始化日志
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    console.log(`🎨 主题已初始化: ${theme}, 色调: ${hue}`);
  }
}

// 导出主题管理工具
export const themeManager = {
  setTheme(newTheme) {
    localStorage.setItem('theme', newTheme);
    location.reload(); // 简单的重新加载，确保主题正确应用
  },
  
  setHue(newHue) {
    localStorage.setItem('hue', newHue);
    document.documentElement.style.setProperty('--hue', newHue);
  },
  
  getCurrentTheme() {
    return localStorage.getItem('theme') || DEFAULT_THEME;
  },
  
  getCurrentHue() {
    return localStorage.getItem('hue') || 260;
  }
};

// 如果在浏览器环境中，自动挂载到window
if (typeof window !== 'undefined') {
  window.themeManager = themeManager;
}
