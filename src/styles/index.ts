/**
 * 样式模块管理器
 * 统一管理所有 CSS 模块的导入
 */

export const styleModules = {
  // 基础样式 - 最先加载
  base: [
    '/src/styles/base/reset.css',
    '/src/styles/base/variables.css', // 已存在
    '/src/styles/base/typography.css', // 待创建
  ],
  
  // 布局样式
  layouts: [
    '/src/styles/layouts/main-grid.css', // 待创建
    '/src/styles/layouts/layout.css',    // 待创建
  ],
  
  // 组件样式 - 按依赖顺序排列
  components: [
    '/src/styles/components/navbar.css',     // 待创建
    '/src/styles/components/logo.css',      // 待创建
    '/src/styles/components/post-card.css', // 待创建
    '/src/styles/components/post-list.css', // 待创建
    '/src/styles/components/search.css',    // 待创建
    '/src/styles/components/buttons.css',   // 待创建
  ],
  
  // 页面特定样式
  pages: [
    '/src/styles/pages/index.css',    // 待创建
    '/src/styles/pages/category.css', // 待创建
    '/src/styles/pages/404.css',      // 待创建
  ],
  
  // 工具类和动画
  utilities: [
    '/src/styles/utilities/animations.css', // 待创建
    '/src/styles/utilities/helpers.css',    // 待创建
  ],
  
  // 第三方库样式 - 已存在的保持不变
  vendors: [
    '/src/styles/photoswipe.css',        // 已存在
    '/src/styles/scrollbar.css',         // 已存在
    '/src/styles/transition.css',        // 已存在
    '/src/styles/expressive-code.css',   // 已存在
    '/src/styles/markdown-extend.css',   // 已存在
  ]
};

/**
 * 获取指定类型的样式模块
 */
export function getStyleModules(type: keyof typeof styleModules): string[] {
  return styleModules[type] || [];
}

/**
 * 获取所有样式模块（按加载顺序）
 */
export function getAllStyleModules(): string[] {
  return [
    ...styleModules.base,
    ...styleModules.layouts,
    ...styleModules.components,
    ...styleModules.pages,
    ...styleModules.utilities,
    ...styleModules.vendors,
  ];
}

/**
 * 迁移状态跟踪
 */
export const migrationStatus = {
  base: {
    reset: '✅ 已完成',
    variables: '✅ 已存在',
    typography: '🔄 进行中',
  },
  components: {
    logo: '✅ 已完成',
    navbar: '📋 待开始',
    postCard: '✅ 已完成',
    postList: '✅ 已完成',
    search: '📋 待开始',
    buttons: '📋 待开始',
  },
  pages: {
    index: '📋 待开始',
    category: '📋 待开始',
    error404: '📋 待开始',
  },
  utilities: {
    animations: '📋 待开始',
    helpers: '📋 待开始',
  }
};
