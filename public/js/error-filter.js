/**
 * 全局错误过滤器
 * 过滤Chrome扩展和其他不相关的错误
 */

(function() {
    'use strict';
    
    // 检查是否为开发环境
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.hostname.includes('localhost');
    
    // Chrome扩展错误关键词
    const extensionErrorKeywords = [
        'extension',
        'Could not establish connection',
        'Receiving end does not exist',
        'message channel closed',
        'chrome-extension://',
        'moz-extension://',
        'safari-extension://',
        'Extension context invalidated',
        'The message port closed before a response was received'
    ];
    
    // 检查是否为扩展错误
    function isExtensionError(message, source, error) {
        if (!message && !source && !error) return false;
        
        const messageStr = String(message || '').toLowerCase();
        const sourceStr = String(source || '').toLowerCase();
        const errorStr = String(error?.message || error || '').toLowerCase();
        
        return extensionErrorKeywords.some(keyword => 
            messageStr.includes(keyword.toLowerCase()) ||
            sourceStr.includes(keyword.toLowerCase()) ||
            errorStr.includes(keyword.toLowerCase())
        );
    }
    
    // 原始的错误处理函数
    const originalOnError = window.onerror;
    const originalOnUnhandledRejection = window.onunhandledrejection;
    
    // 重写全局错误处理
    window.onerror = function(message, source, lineno, colno, error) {
        // 过滤扩展错误
        if (isExtensionError(message, source, error)) {
            if (isDev) {
                console.debug('🔇 已过滤Chrome扩展错误:', message);
            }
            return true; // 阻止错误显示
        }
        
        // 调用原始处理函数
        if (originalOnError) {
            return originalOnError.call(this, message, source, lineno, colno, error);
        }
        
        // 在开发环境显示其他错误
        if (isDev) {
            console.error('🚨 页面错误:', {
                message,
                source,
                line: lineno,
                column: colno,
                error
            });
        }
        
        return false;
    };
    
    // 重写Promise错误处理
    window.onunhandledrejection = function(event) {
        const reason = event.reason;
        
        // 过滤扩展错误
        if (isExtensionError(null, null, reason)) {
            if (isDev) {
                console.debug('🔇 已过滤Chrome扩展Promise错误:', reason);
            }
            event.preventDefault(); // 阻止错误显示
            return;
        }
        
        // 调用原始处理函数
        if (originalOnUnhandledRejection) {
            return originalOnUnhandledRejection.call(this, event);
        }
        
        // 在开发环境显示其他Promise错误
        if (isDev) {
            console.error('🚨 未处理的Promise拒绝:', reason);
        }
    };
    
    // 添加事件监听器版本（作为备用）
    window.addEventListener('error', function(event) {
        if (isExtensionError(event.message, event.filename, event.error)) {
            event.stopPropagation();
            event.preventDefault();
        }
    }, true);
    
    window.addEventListener('unhandledrejection', function(event) {
        if (isExtensionError(null, null, event.reason)) {
            event.stopPropagation();
            event.preventDefault();
        }
    }, true);
    
    // 控制台日志过滤（可选）
    if (!isDev) {
        // 生产环境下减少控制台输出
        const originalConsoleLog = console.log;
        const originalConsoleInfo = console.info;
        const originalConsoleDebug = console.debug;
        
        console.log = function(...args) {
            // 只显示重要的日志
            const message = args.join(' ');
            if (message.includes('✅') || message.includes('❌') || message.includes('⚠️')) {
                originalConsoleLog.apply(console, args);
            }
        };
        
        console.info = function(...args) {
            // 生产环境下静默info日志
        };
        
        console.debug = function(...args) {
            // 生产环境下静默debug日志
        };
    }
    
    if (isDev) {
        console.log('🛡️ 全局错误过滤器已启动');
    }
    
})();
