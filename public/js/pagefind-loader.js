/**
 * Pagefind搜索功能加载器
 * 简化版本，移除过度复杂的初始化逻辑
 */

// 简化的Pagefind加载
async function loadPagefind() {
    try {
        const pagefind = await import('/pagefind/pagefind.js');
        await pagefind.options({ excerptLength: 20 });
        window.pagefind = pagefind;
        document.dispatchEvent(new CustomEvent('pagefindready'));
    } catch (error) {
        window.pagefind = { search: async () => ({ results: [] }) };
    }
}

// 简化初始化
function initializePagefind() {
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
