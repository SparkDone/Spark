/**
 * 全局错误处理器 - 处理常见的浏览器扩展错误和其他非关键错误
 */

(function() {
    'use strict';
    
    // 需要忽略的错误模式
    const ignoredErrors = [
        // 浏览器扩展相关错误
        'A listener indicated an asynchronous response by returning true',
        'message channel closed before a response was received',
        'Extension context invalidated',
        'Could not establish connection',
        'Receiving end does not exist',
        'The message port closed before a response was received',
        'Error: Could not establish connection. Receiving end does not exist',
        'Could not establish connection. Receiving end does not exist',
        'but the message channel closed before a response was received',

        // 网络相关的非关键错误
        'Failed to fetch',
        'NetworkError',
        'Load failed',

        // 第三方脚本错误
        'Script error',
        'Non-Error promise rejection captured',

        // 资源加载错误（非关键）
        'ChunkLoadError',
        'Loading chunk',

        // 开发环境相关
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',

        // 触摸事件相关（已修复但可能仍有残留）
        'Added non-passive event listener to a scroll-blocking',
        'Consider marking event handler as \'passive\'',

        // WebAssembly/Pagefind相关（在CSP修复前可能出现）
        'Failed to load the Pagefind WASM',
        'WebAssembly.instantiate(): Refused to compile',
        'unsafe-eval\' is not an allowed source'
    ];
    
    // 需要忽略的错误来源
    const ignoredSources = [
        'chrome-extension://',
        'moz-extension://',
        'safari-extension://',
        'ms-browser-extension://',
        'extension://',
        'about:blank'
    ];
    
    /**
     * 检查是否应该忽略这个错误
     */
    function shouldIgnoreError(message, source, error) {
        // 检查错误消息
        if (message && typeof message === 'string') {
            for (const pattern of ignoredErrors) {
                if (message.includes(pattern)) {
                    return true;
                }
            }
        }
        
        // 检查错误来源
        if (source && typeof source === 'string') {
            for (const pattern of ignoredSources) {
                if (source.includes(pattern)) {
                    return true;
                }
            }
        }
        
        // 检查错误对象
        if (error && error.message) {
            for (const pattern of ignoredErrors) {
                if (error.message.includes(pattern)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * 全局错误处理器
     */
    window.addEventListener('error', function(event) {
        const { message, filename, error } = event;
        
        if (shouldIgnoreError(message, filename, error)) {
            // 阻止错误冒泡到控制台
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
        
        // 对于真正的错误，在开发环境下记录详细信息
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.group('🐛 JavaScript错误');
            console.error('消息:', message);
            console.error('文件:', filename);
            console.error('行号:', event.lineno);
            console.error('列号:', event.colno);
            console.error('错误对象:', error);
            console.groupEnd();
        }
    });
    
    /**
     * Promise rejection 处理器
     */
    window.addEventListener('unhandledrejection', function(event) {
        const reason = event.reason;
        let message = '';
        
        if (reason && typeof reason === 'object') {
            message = reason.message || reason.toString();
        } else {
            message = String(reason);
        }
        
        if (shouldIgnoreError(message, '', reason)) {
            // 阻止错误显示在控制台
            event.preventDefault();
            return;
        }
        
        // 对于真正的错误，在开发环境下记录
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.group('🐛 未处理的Promise rejection');
            console.error('原因:', reason);
            console.error('事件:', event);
            console.groupEnd();
        }
    });
    
    /**
     * 资源加载错误处理器
     */
    document.addEventListener('error', function(event) {
        const target = event.target;
        
        if (target && target !== window) {
            const tagName = target.tagName ? target.tagName.toLowerCase() : '';
            const src = target.src || target.href || '';
            
            // 检查是否是需要忽略的资源错误
            if (shouldIgnoreError('', src, null)) {
                return;
            }
            
            // 处理特定类型的资源加载错误
            switch (tagName) {
                case 'img':
                    // 图片加载失败，可以设置默认图片
                    if (target.src && !target.src.includes('placeholder')) {
                        console.warn('🖼️ 图片加载失败:', src);
                        // 可以设置默认图片
                        // target.src = '/images/placeholder.png';
                    }
                    break;
                    
                case 'script':
                    // 脚本加载失败
                    if (!src.includes('extension')) {
                        // 检查是否是Astro构建的脚本文件缓存问题
                        if (src.includes('index.astro_astro_type_script') || src.includes('_astro/')) {
                            console.warn('🔄 Astro脚本文件可能需要刷新缓存:', src);
                            console.info('💡 建议：按 Ctrl+F5 强制刷新页面清除缓存');

                            // 尝试自动刷新页面（仅在开发环境）
                            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                                console.log('🔄 开发环境：3秒后自动刷新页面');
                                setTimeout(() => {
                                    window.location.reload(true);
                                }, 3000);
                            }
                        } else {
                            console.warn('📜 脚本加载失败:', src);
                        }
                    }
                    break;
                    
                case 'link':
                    // 样式表或其他资源加载失败
                    if (target.rel === 'stylesheet') {
                        console.warn('🎨 样式表加载失败:', src);
                    } else if (target.rel === 'preload') {
                        // 预加载资源失败，这通常不是关键错误
                        console.info('📦 预加载资源失败（非关键）:', src);
                    }
                    break;
            }
        }
    }, true);
    
    /**
     * 控制台清理 - 过滤扩展相关的警告
     */
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // 在开发环境下，重写console.warn来过滤已知的非关键警告
        const originalWarn = console.warn;
        console.warn = function(...args) {
            const message = args.join(' ');
            
            // 过滤预加载资源未使用的警告
            if (message.includes('was preloaded using link preload but not used')) {
                // 由于我们已经移除了JavaScript预加载，这些警告应该很少出现
                // 如果出现，可能是CSS或其他资源的预加载问题
                console.info('ℹ️ 预加载资源未使用，这可能是正常的优化行为');
                return;
            }
            
            // 过滤其他已知的非关键警告
            for (const pattern of ignoredErrors) {
                if (message.includes(pattern)) {
                    return;
                }
            }
            
            // 显示其他警告
            originalWarn.apply(console, args);
        };
    }
    
    console.log('🛡️ 全局错误处理器已启动');
})();
