/**
 * Pagefind搜索功能加载器 - 改进版本
 * 添加WebAssembly兼容性检查和错误处理
 */

// 全局错误处理
window.addEventListener('error', function(event) {
    if (event.filename && event.filename.includes('pagefind')) {
        console.warn('⚠️ Pagefind加载错误，启用回退方案:', event.error);
        setupPagefindFallback();
    }
});

// 全局Promise rejection处理
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes('pagefind')) {
        console.warn('⚠️ Pagefind Promise rejection，启用回退方案:', event.reason);
        setupPagefindFallback();
        event.preventDefault();
    }
});

// 检查WebAssembly支持
function checkWasmSupport() {
    try {
        return typeof WebAssembly === 'object' && 
               typeof WebAssembly.instantiate === 'function';
    } catch (e) {
        return false;
    }
}

// 设置Pagefind回退方案
function setupPagefindFallback() {
    console.log('🔄 设置Pagefind回退方案');
    window.pagefind = {
        search: async () => ({ results: [] }),
        options: async () => {}
    };
    document.dispatchEvent(new CustomEvent('pagefindloaderror'));
}

// 改进的Pagefind加载
async function loadPagefind() {
    try {
        // 检查WebAssembly支持
        if (!checkWasmSupport()) {
            console.warn('⚠️ 浏览器不支持WebAssembly，使用回退方案');
            setupPagefindFallback();
            return;
        }

        // 设置超时
        const timeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Pagefind加载超时')), 10000);
        });

        // 加载Pagefind
        const pagefindPromise = import('/pagefind/pagefind.js');
        const pagefind = await Promise.race([pagefindPromise, timeout]);
        
        // 配置Pagefind
        await pagefind.options({ 
            excerptLength: 20,
            // 添加更多配置选项以提高稳定性
            showImages: false,
            showExcerpt: true
        });
        
        window.pagefind = pagefind;
        console.log('✅ Pagefind加载成功');
        document.dispatchEvent(new CustomEvent('pagefindready'));
        
    } catch (error) {
        console.warn('⚠️ Pagefind加载失败:', error.message);
        setupPagefindFallback();
    }
}

// 简化初始化
function initializePagefind() {
    // 避免重复初始化
    if (window.pagefind && window.pagefind.search) {
        console.log('✅ Pagefind已初始化');
        return;
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPagefind);
    } else {
        loadPagefind();
    }
}

// 导出函数（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadPagefind, initializePagefind };
}

// 自动初始化
initializePagefind();
