/**
 * 页面工具函数 - 字体加载和错误处理
 * 简化版本，移除过度工程化的功能
 */

// 简化的字体加载管理
function initializeFontLoader() {
    // 防止重复初始化
    if (window.fontLoaderInitialized) return;
    window.fontLoaderInitialized = true;

    // 设置字体加载状态
    document.documentElement.classList.add('fonts-loading');

    // 使用浏览器原生字体加载API
    document.fonts.ready
        .then(() => {
            document.documentElement.classList.remove('fonts-loading');
            document.documentElement.classList.add('fonts-loaded');
        })
        .catch(() => {
            // 出错时也要显示内容
            document.documentElement.classList.remove('fonts-loading');
            document.documentElement.classList.add('fonts-loaded');
        });

    // 备用超时机制（1秒后强制显示）
    setTimeout(() => {
        if (document.documentElement.classList.contains('fonts-loading')) {
            document.documentElement.classList.remove('fonts-loading');
            document.documentElement.classList.add('fonts-loaded');
        }
    }, 1000);
}

// 简化的错误处理管理
function initializeErrorHandler() {
    // 防止重复初始化
    if (window.errorHandlerInitialized) return;
    window.errorHandlerInitialized = true;

    // 需要抑制的错误类型
    const suppressedErrors = [
        '401 Unauthorized',
        'Strapi API error',
        'APIError',
        'import.meta',
        'Cannot use \'import.meta\' outside a module'
    ];

    // 检查是否需要抑制错误
    function shouldSuppressError(message) {
        return suppressedErrors.some(error => 
            (message || '').toString().includes(error)
        );
    }

    // 全局错误处理
    window.addEventListener('error', function(event) {
        const errorMessage = event.error?.message || event.message || '';
        
        if (shouldSuppressError(errorMessage)) {
            event.preventDefault();
            return false;
        }
    });

    // Promise rejection处理
    window.addEventListener('unhandledrejection', function(event) {
        const errorMessage = event.reason?.message || event.reason || '';
        
        if (shouldSuppressError(errorMessage)) {
            event.preventDefault();
            return false;
        }
    });
}

// 页面转换优化
function initializePageTransition() {
    document.documentElement.style.setProperty('--content-delay', '0ms');
}

// 初始化所有功能
function initializePageUtils() {
    initializePageTransition();
    initializeFontLoader();
    initializeErrorHandler();
}

// 导出函数（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializePageUtils,
        initializeFontLoader,
        initializeErrorHandler,
        initializePageTransition
    };
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePageUtils);
} else {
    initializePageUtils();
}
