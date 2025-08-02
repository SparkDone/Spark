/**
 * 通用布局切换器
 * 通过改变容器的 data-layout 属性来控制布局
 */

class UniversalLayoutSwitcher {
  constructor(options = {}) {
    // 优先级：页面指定的默认布局 > 用户偏好 > 全局默认
    // 如果页面明确指定了默认布局，则使用页面设置
    if (options.defaultLayout) {
      this.currentLayout = options.defaultLayout;
    } else {
      // 否则使用用户偏好或全局默认
      this.currentLayout = localStorage.getItem('preferred-layout') || 'grid';
    }

    this.targetSelector = options.targetSelector || '.universal-post-list';
    this.isInitialized = false;
    this.init();
  }

  init() {
    // 等待DOM完全加载
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupButtons());
    } else {
      this.setupButtons();
    }

    // 备用初始化
    setTimeout(() => {
      if (!this.isInitialized) {
        this.setupButtons();
      }
    }, 100);
  }

  setupButtons() {
    const buttons = document.querySelectorAll('.layout-switch-btn');
    if (buttons.length === 0) {
      console.warn('布局切换按钮未找到，延迟重试');
      // 增加重试次数和间隔
      if (!this.retryCount) this.retryCount = 0;
      if (this.retryCount < 5) {
        this.retryCount++;
        setTimeout(() => this.setupButtons(), 200);
      } else {
        console.error('❌ 布局切换按钮初始化失败，已达到最大重试次数');
      }
      return;
    }

    // 只在开发环境显示详细日志
    const isDev = window.location.hostname === 'localhost';
    if (isDev) console.log('🔧 设置布局切换按钮', buttons.length);
    this.retryCount = 0; // 重置重试计数

    buttons.forEach(button => {
      // 移除所有可能的outline样式
      this.removeOutlineStyles(button);

      // 移除旧的事件监听器（使用更安全的方式）
      const oldHandler = button._layoutSwitcherHandler;
      if (oldHandler) {
        button.removeEventListener('click', oldHandler);
      }

      // 创建新的事件处理器
      const newHandler = this.handleClick.bind(this);
      button._layoutSwitcherHandler = newHandler;

      // 绑定新的事件监听器
      button.addEventListener('click', newHandler, {
        passive: false,
        capture: true
      });

      // 防止任何focus事件显示outline
      button.addEventListener('focus', (e) => {
        this.removeOutlineStyles(e.target);
      });

      button.addEventListener('focusin', (e) => {
        this.removeOutlineStyles(e.target);
      });
    });

    // 智能初始化：只在布局不匹配时才切换
    this.initializeLayout();
    this.isInitialized = true;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('✅ 布局切换器初始化完成');
    }
  }

  /**
   * 智能初始化布局 - 避免不必要的DOM操作
   */
  initializeLayout() {
    const containers = document.querySelectorAll(this.targetSelector);

    if (containers.length === 0) {
      console.warn(`⚠️ 未找到目标容器: ${this.targetSelector}`);
      return;
    }

    // 检查页面是否有明确的布局设置
    const switcher = document.querySelector('.layout-switcher');
    if (switcher) {
      const pageDefaultLayout = switcher.getAttribute('data-default-layout');
      if (pageDefaultLayout && pageDefaultLayout !== this.currentLayout) {
        // 页面有明确的布局设置，使用页面设置
        this.currentLayout = pageDefaultLayout;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.log(`🔄 使用页面指定的布局: ${pageDefaultLayout}`);
        }
      }
    }

    // 检查容器当前的布局状态
    let needsUpdate = false;
    containers.forEach(container => {
      const currentLayout = container.getAttribute('data-layout');
      if (currentLayout !== this.currentLayout) {
        needsUpdate = true;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.log(`🔄 容器布局不匹配: ${currentLayout} -> ${this.currentLayout}`);
        }
      }
    });

    // 只在需要时才执行布局切换
    if (needsUpdate) {
      this.switchLayout(this.currentLayout);
    } else {
      // 即使不需要切换，也要更新按钮状态
      this.updateButtonStates(this.currentLayout);
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`✅ 布局已匹配，无需切换: ${this.currentLayout}`);
      }
    }
  }

  /**
   * 更新按钮状态（不触发布局切换）
   */
  updateButtonStates(layout) {
    const buttons = document.querySelectorAll('.layout-switch-btn');
    buttons.forEach(btn => {
      const btnLayout = btn.getAttribute('data-layout');
      const isActive = btnLayout === layout;
      btn.setAttribute('data-active', isActive.toString());
      btn.classList.toggle('active', isActive);
    });
  }

  handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('🖱️ 布局按钮被点击');
    }

    // 立即移除焦点和outline
    this.removeOutlineStyles(e.target);
    e.target.blur();

    // 获取布局类型
    let layout = e.target.getAttribute('data-layout');
    if (!layout) {
      // 如果点击的是SVG或其他子元素，向上查找
      const button = e.target.closest('.layout-switch-btn');
      if (button) {
        layout = button.getAttribute('data-layout');
      }
    }

    if (layout && layout !== this.currentLayout) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`🔄 切换布局: ${this.currentLayout} -> ${layout}`);
      }
      this.switchLayout(layout);
    }
  }

  removeOutlineStyles(element) {
    if (element && element.style) {
      element.style.outline = 'none';
      element.style.outlineWidth = '0';
      element.style.outlineStyle = 'none';
      element.style.outlineColor = 'transparent';
      element.style.outlineOffset = '0';
      element.style.boxShadow = 'none';
      element.style.border = 'none';
    }
  }

  switchLayout(layout) {
    if (!layout) return;

    // 只在开发环境显示详细日志
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log(`🔄 执行布局切换: ${layout}`);
    }
    this.currentLayout = layout;

    // 更新按钮状态
    const buttons = document.querySelectorAll('.layout-switch-btn');
    buttons.forEach(btn => {
      const btnLayout = btn.getAttribute('data-layout');
      const isActive = btnLayout === layout;
      btn.setAttribute('data-active', isActive.toString());
      btn.classList.toggle('active', isActive);

      // 添加视觉反馈
      if (isActive) {
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          btn.style.transform = '';
        }, 150);
      }
    });

    // 切换布局视图 - 新的方式
    this.applyLayoutToContainer(layout);

    // 保存到localStorage
    localStorage.setItem('preferred-layout', layout);

    // 触发自定义事件
    document.dispatchEvent(new CustomEvent('layout-changed', {
      detail: { layout }
    }));

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log(`✅ 布局已切换到: ${layout}`);
    }
  }

  applyLayoutToContainer(layout) {
    // 查找目标容器
    const containers = document.querySelectorAll(this.targetSelector);

    if (containers.length === 0) {
      console.warn(`⚠️ 未找到目标容器: ${this.targetSelector}`);
      return;
    }

    let hasChanges = false;

    // 更新所有匹配的容器
    containers.forEach(container => {
      const oldLayout = container.getAttribute('data-layout');

      // 只在布局真正改变时才应用
      if (oldLayout !== layout) {
        // 直接切换布局，无动画
        container.setAttribute('data-layout', layout);
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.log(`🔄 容器布局: ${oldLayout} -> ${layout}`);
        }
        hasChanges = true;
      }
    });

    if (hasChanges && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log(`✅ 已应用布局 ${layout} 到 ${containers.length} 个容器`);
    }
  }
}

// 全局初始化函数
window.initUniversalLayoutSwitcher = function(options = {}) {
  if (window.universalLayoutSwitcherInstance) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('🔄 通用布局切换器已存在，重新初始化');
    }
    // 清理旧实例
    window.universalLayoutSwitcherInstance = null;
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🚀 创建新的布局切换器实例');
  }
  window.universalLayoutSwitcherInstance = new UniversalLayoutSwitcher(options);
  return window.universalLayoutSwitcherInstance;
};

// 调试函数
window.debugLayoutSwitcher = function() {
  console.log('🔍 布局切换器调试信息:');
  console.log('- 实例存在:', !!window.universalLayoutSwitcherInstance);
  console.log('- 按钮数量:', document.querySelectorAll('.layout-switch-btn').length);
  console.log('- 容器数量:', document.querySelectorAll('.universal-post-list').length);
  console.log('- 当前布局:', window.universalLayoutSwitcherInstance?.currentLayout);

  const switcher = document.querySelector('.layout-switcher');
  if (switcher) {
    console.log('- 默认布局:', switcher.getAttribute('data-default-layout'));
    console.log('- 目标选择器:', switcher.getAttribute('data-target-selector'));
  }

  const containers = document.querySelectorAll('.universal-post-list');
  containers.forEach((container, index) => {
    console.log(`- 容器${index + 1}布局:`, container.getAttribute('data-layout'));
  });
};

// 强制重新初始化函数
window.forceReinitLayoutSwitcher = function() {
  console.log('🔄 强制重新初始化布局切换器');

  // 清除旧实例
  if (window.universalLayoutSwitcherInstance) {
    window.universalLayoutSwitcherInstance = null;
  }

  // 查找布局切换器
  const switcher = document.querySelector('.layout-switcher');
  if (switcher) {
    const defaultLayout = switcher.getAttribute('data-default-layout') || 'grid';
    const targetSelector = switcher.getAttribute('data-target-selector') || '.universal-post-list';

    window.initUniversalLayoutSwitcher({
      defaultLayout,
      targetSelector
    });

    console.log('✅ 强制重新初始化完成');
  } else {
    console.error('❌ 未找到布局切换器元素');
  }
};

// 调试函数
window.debugUniversalLayoutSwitcher = function() {
  console.log('🔍 通用布局切换器调试信息:');
  console.log('实例:', window.universalLayoutSwitcherInstance);
  console.log('当前布局:', window.universalLayoutSwitcherInstance?.currentLayout);
  console.log('是否已初始化:', window.universalLayoutSwitcherInstance?.isInitialized);
  console.log('目标选择器:', window.universalLayoutSwitcherInstance?.targetSelector);

  const buttons = document.querySelectorAll('.layout-switch-btn');
  console.log('按钮数量:', buttons.length);
  buttons.forEach((btn, index) => {
    console.log(`按钮${index}:`, {
      layout: btn.getAttribute('data-layout'),
      active: btn.getAttribute('data-active'),
      hasClass: btn.classList.contains('active')
    });
  });

  const containers = document.querySelectorAll(window.universalLayoutSwitcherInstance?.targetSelector || '.universal-post-list');
  console.log('容器数量:', containers.length);
  containers.forEach((container, index) => {
    console.log(`容器${index}:`, {
      currentLayout: container.getAttribute('data-layout'),
      totalPosts: container.getAttribute('data-total-posts'),
      className: container.className
    });
  });
};

// 强制切换函数
window.forceUniversalLayoutSwitch = function(layout) {
  console.log(`🔧 强制切换到布局: ${layout}`);
  if (window.universalLayoutSwitcherInstance) {
    window.universalLayoutSwitcherInstance.switchLayout(layout);
  } else {
    console.error('通用布局切换器实例不存在');
  }
};

// 优化的自动初始化 - 延迟执行避免阻塞
function initLayoutSwitcherDelayed() {
  // 延迟初始化，让页面先完成基本渲染
  setTimeout(() => {
    const switcher = document.querySelector('.layout-switcher');
    if (switcher) {
      const defaultLayout = switcher.getAttribute('data-default-layout') || 'grid';
      const targetSelector = switcher.getAttribute('data-target-selector') || '.universal-post-list';

      window.initUniversalLayoutSwitcher({
        defaultLayout,
        targetSelector
      });
    }
  }, 50); // 延迟50ms，让页面先渲染
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLayoutSwitcherDelayed);
} else {
  initLayoutSwitcherDelayed();
}
