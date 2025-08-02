/**
 * WebAssembly兼容性检查和Pagefind支持
 */

(function() {
    'use strict';
    
    class WasmCompatibilityChecker {
        constructor() {
            this.isSupported = false;
            this.cspAllowed = false;
            this.pagefindReady = false;
            
            this.init();
        }
        
        init() {
            this.checkWasmSupport();
            this.checkCSPCompatibility();
            this.setupPagefindFallback();
            
            // 减少日志输出
        }
        
        /**
         * 检查WebAssembly支持
         */
        checkWasmSupport() {
            try {
                if (typeof WebAssembly === 'object' && 
                    typeof WebAssembly.instantiate === 'function') {
                    this.isSupported = true;
                    
                    // 测试简单的WASM模块
                    const wasmCode = new Uint8Array([
                        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00
                    ]);
                    
                    WebAssembly.instantiate(wasmCode).then(() => {
                        this.cspAllowed = true;
                        this.onWasmReady();
                    }).catch((error) => {
                        this.cspAllowed = false;
                        this.onWasmBlocked(error);
                    });
                } else {
                    this.isSupported = false;
                    this.onWasmNotSupported();
                }
            } catch (error) {
                this.isSupported = false;
                this.onWasmError(error);
            }
        }
        
        /**
         * 检查CSP兼容性
         */
        checkCSPCompatibility() {
            // 检查meta标签中的CSP
            const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (cspMeta) {
                const cspContent = cspMeta.getAttribute('content') || '';
                const hasUnsafeEval = cspContent.includes('unsafe-eval');
                const hasWasmUnsafeEval = cspContent.includes('wasm-unsafe-eval');
                
                if (hasUnsafeEval || hasWasmUnsafeEval) {
                    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                        console.log('✅ CSP允许WebAssembly执行');
                    }
                } else {
                    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                        console.warn('⚠️ CSP可能阻止WebAssembly执行');
                    }
                }
            }
        }
        
        /**
         * WebAssembly准备就绪
         */
        onWasmReady() {
            // 减少日志输出
            
            // 触发自定义事件
            document.dispatchEvent(new CustomEvent('wasm:ready', {
                detail: { supported: true, cspAllowed: true }
            }));
        }
        
        /**
         * WebAssembly被CSP阻止
         */
        onWasmBlocked(error) {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.warn('⚠️ WebAssembly被CSP阻止，Pagefind搜索可能无法工作');
                console.warn('错误详情:', error);
                console.info('💡 解决方案: 在CSP中添加 \'unsafe-eval\' 或 \'wasm-unsafe-eval\'');
            }
            
            this.setupSearchFallback();
            
            // 触发自定义事件
            document.dispatchEvent(new CustomEvent('wasm:blocked', {
                detail: { supported: true, cspAllowed: false, error: error }
            }));
        }
        
        /**
         * WebAssembly不支持
         */
        onWasmNotSupported() {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.warn('⚠️ 浏览器不支持WebAssembly，Pagefind搜索无法工作');
            }
            
            this.setupSearchFallback();
            
            // 触发自定义事件
            document.dispatchEvent(new CustomEvent('wasm:unsupported', {
                detail: { supported: false, cspAllowed: false }
            }));
        }
        
        /**
         * WebAssembly错误
         */
        onWasmError(error) {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.error('❌ WebAssembly检查出错:', error);
            }
            
            this.setupSearchFallback();
        }
        
        /**
         * 设置Pagefind回退方案
         */
        setupPagefindFallback() {
            // 监听Pagefind加载失败
            window.addEventListener('error', (event) => {
                if (event.filename && event.filename.includes('pagefind')) {
                    this.onPagefindError(event.error);
                }
            });
            
            // 监听Promise rejection（Pagefind WASM加载失败）
            window.addEventListener('unhandledrejection', (event) => {
                if (event.reason && 
                    (event.reason.message?.includes('Pagefind WASM') || 
                     event.reason.message?.includes('WebAssembly.instantiate'))) {
                    this.onPagefindError(event.reason);
                    event.preventDefault(); // 阻止错误显示在控制台
                }
            });
        }
        
        /**
         * Pagefind错误处理
         */
        onPagefindError(error) {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.warn('⚠️ Pagefind加载失败，启用搜索回退方案');
            }
            
            this.setupSearchFallback();
        }
        
        /**
         * 设置搜索回退方案
         */
        setupSearchFallback() {
            // 显示搜索不可用提示
            const searchInputs = document.querySelectorAll('input[type="search"], .search-input');
            searchInputs.forEach(input => {
                if (input.placeholder && !input.placeholder.includes('搜索暂时不可用')) {
                    input.placeholder = input.placeholder + ' (搜索暂时不可用)';
                    input.disabled = true;
                    input.style.opacity = '0.6';
                }
            });
            
            // 添加提示信息
            const searchContainers = document.querySelectorAll('.search-container, .search-wrapper');
            searchContainers.forEach(container => {
                if (!container.querySelector('.search-fallback-notice')) {
                    const notice = document.createElement('div');
                    notice.className = 'search-fallback-notice';
                    notice.style.cssText = `
                        font-size: 12px;
                        color: #666;
                        margin-top: 4px;
                        padding: 4px 8px;
                        background: #f5f5f5;
                        border-radius: 4px;
                        display: none;
                    `;
                    notice.textContent = '搜索功能暂时不可用，请检查浏览器兼容性';
                    container.appendChild(notice);
                    
                    // 显示提示
                    setTimeout(() => {
                        notice.style.display = 'block';
                    }, 1000);
                }
            });
            
            // 触发自定义事件
            document.dispatchEvent(new CustomEvent('search:fallback', {
                detail: { reason: 'wasm-not-available' }
            }));
        }
        
        /**
         * 获取兼容性报告
         */
        getCompatibilityReport() {
            return {
                webAssemblySupported: this.isSupported,
                cspAllowed: this.cspAllowed,
                pagefindReady: this.pagefindReady,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    // 创建全局兼容性检查器
    window.wasmChecker = new WasmCompatibilityChecker();
    
    // 添加快捷键 Ctrl+Shift+W 显示兼容性报告
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'W') {
            e.preventDefault();
            const report = window.wasmChecker.getCompatibilityReport();
            console.group('🔍 WebAssembly兼容性报告');
            console.log('WebAssembly支持:', report.webAssemblySupported);
            console.log('CSP允许:', report.cspAllowed);
            console.log('Pagefind状态:', report.pagefindReady);
            console.log('用户代理:', report.userAgent);
            console.groupEnd();
        }
    });
    
    // 减少快捷键提示
})();
