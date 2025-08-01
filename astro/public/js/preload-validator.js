/**
 * 预加载资源验证器 - 验证预加载的资源是否真的被使用
 */

(function() {
    'use strict';
    
    // 只在开发环境运行
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return;
    }
    
    class PreloadValidator {
        constructor() {
            this.preloadedResources = new Map();
            this.usedResources = new Set();
            this.validationResults = new Map();
            
            this.init();
        }
        
        init() {
            // 收集预加载的资源
            this.collectPreloadedResources();
            
            // 监控资源使用
            this.monitorResourceUsage();
            
            // 页面加载完成后验证
            window.addEventListener('load', () => {
                setTimeout(() => {
                    this.validatePreloadUsage();
                }, 3000); // 等待3秒后验证
            });
            
            console.log('🔍 预加载资源验证器已启动');
        }
        
        collectPreloadedResources() {
            const preloadLinks = document.querySelectorAll('link[rel="preload"], link[rel="modulepreload"]');
            
            preloadLinks.forEach(link => {
                const href = link.href;
                const as = link.getAttribute('as');
                const rel = link.rel;
                
                this.preloadedResources.set(href, {
                    element: link,
                    as: as,
                    rel: rel,
                    timestamp: Date.now()
                });
            });
            
            // console.log(`📦 发现 ${this.preloadedResources.size} 个预加载资源`); // 减少控制台输出
        }
        
        monitorResourceUsage() {
            // 监控脚本加载
            this.monitorScriptUsage();
            
            // 监控样式表使用
            this.monitorStyleUsage();
            
            // 监控字体使用
            this.monitorFontUsage();
        }
        
        monitorScriptUsage() {
            // 监控现有脚本
            const scripts = document.querySelectorAll('script[src]');
            scripts.forEach(script => {
                if (script.src) {
                    this.usedResources.add(script.src);
                }
            });
            
            // 监控动态加载的脚本
            const originalCreateElement = document.createElement;
            document.createElement = function(tagName) {
                const element = originalCreateElement.call(this, tagName);
                
                if (tagName.toLowerCase() === 'script') {
                    const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src').set;
                    Object.defineProperty(element, 'src', {
                        set: function(value) {
                            if (value) {
                                window.preloadValidator?.markResourceAsUsed(value);
                            }
                            originalSrcSetter.call(this, value);
                        },
                        get: function() {
                            return this.getAttribute('src');
                        }
                    });
                }
                
                return element;
            };
        }
        
        monitorStyleUsage() {
            // 监控现有样式表
            const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
            stylesheets.forEach(link => {
                if (link.href) {
                    this.usedResources.add(link.href);
                }
            });
        }
        
        monitorFontUsage() {
            // 监控字体加载
            if ('fonts' in document) {
                document.fonts.addEventListener('loadingdone', (event) => {
                    event.fontfaces.forEach(fontface => {
                        // 从字体URL中提取资源URL
                        const fontUrl = this.extractFontUrl(fontface);
                        if (fontUrl) {
                            this.markResourceAsUsed(fontUrl);
                        }
                    });
                });
            }
        }
        
        extractFontUrl(fontface) {
            // 尝试从FontFace对象中提取URL
            try {
                const source = fontface.source || '';
                const urlMatch = source.match(/url\(['"]?([^'"]+)['"]?\)/);
                return urlMatch ? urlMatch[1] : null;
            } catch (error) {
                return null;
            }
        }
        
        markResourceAsUsed(url) {
            this.usedResources.add(url);
        }
        
        validatePreloadUsage() {
            // console.group('🔍 预加载资源使用验证'); // 减少控制台输出
            
            let unusedCount = 0;
            let usedCount = 0;
            
            this.preloadedResources.forEach((info, url) => {
                const isUsed = this.isResourceUsed(url);
                
                this.validationResults.set(url, {
                    ...info,
                    isUsed: isUsed,
                    validatedAt: Date.now()
                });
                
                if (isUsed) {
                    usedCount++;
                    console.log(`✅ ${this.getResourceName(url)} - 已使用`);
                } else {
                    unusedCount++;
                    console.warn(`⚠️ ${this.getResourceName(url)} - 未使用 (${info.as})`);
                    
                    // 提供优化建议
                    this.provideSuggestion(url, info);
                }
            });
            
            console.log(`📊 验证结果: ${usedCount} 个已使用, ${unusedCount} 个未使用`);
            
            if (unusedCount > 0) {
                console.log('💡 建议: 考虑移除未使用的预加载资源或实现条件预加载');
            }
            
            console.groupEnd();
            
            // 暴露结果到全局对象
            window.preloadValidationResults = this.validationResults;
        }
        
        isResourceUsed(preloadUrl) {
            // 直接匹配
            if (this.usedResources.has(preloadUrl)) {
                return true;
            }
            
            // 模糊匹配（处理查询参数等差异）
            const preloadPath = new URL(preloadUrl).pathname;
            for (const usedUrl of this.usedResources) {
                try {
                    const usedPath = new URL(usedUrl).pathname;
                    if (usedPath === preloadPath) {
                        return true;
                    }
                } catch (error) {
                    // 忽略URL解析错误
                }
            }
            
            // 检查是否是模块脚本
            if (preloadUrl.includes('.js')) {
                const scripts = document.querySelectorAll('script[type="module"]');
                for (const script of scripts) {
                    if (script.src && this.isSameResource(script.src, preloadUrl)) {
                        return true;
                    }
                }
            }
            
            return false;
        }
        
        isSameResource(url1, url2) {
            try {
                const path1 = new URL(url1).pathname;
                const path2 = new URL(url2).pathname;
                return path1 === path2;
            } catch (error) {
                return url1 === url2;
            }
        }
        
        provideSuggestion(url, info) {
            const resourceName = this.getResourceName(url);
            
            if (url.includes('page.gHQa9edh.js')) {
                const currentPath = window.location.pathname;
                const isHomePage = currentPath === '/';
                const isArchivePage = currentPath.startsWith('/archive');
                
                if (!isHomePage && !isArchivePage) {
                    console.info(`💡 ${resourceName}: 这个脚本只在首页和归档页使用，当前页面不预加载是正确的`);
                } else {
                    console.warn(`🔧 ${resourceName}: 应该在当前页面使用但没有使用，检查脚本加载逻辑`);
                }
            } else if (info.as === 'font') {
                console.info(`💡 ${resourceName}: 字体可能延迟加载，或者当前页面不使用此字体`);
            } else if (info.as === 'style') {
                console.info(`💡 ${resourceName}: 样式表可能条件加载，或者被其他样式表覆盖`);
            } else {
                console.info(`💡 ${resourceName}: 考虑实现条件预加载或移除此预加载`);
            }
        }
        
        getResourceName(url) {
            try {
                const urlObj = new URL(url);
                return urlObj.pathname.split('/').pop() || urlObj.hostname;
            } catch {
                return url.substring(url.lastIndexOf('/') + 1) || url;
            }
        }
        
        // 导出验证结果
        exportResults() {
            const results = {
                timestamp: new Date().toISOString(),
                currentPage: window.location.pathname,
                preloadedCount: this.preloadedResources.size,
                usedCount: Array.from(this.validationResults.values()).filter(r => r.isUsed).length,
                unusedCount: Array.from(this.validationResults.values()).filter(r => !r.isUsed).length,
                details: Object.fromEntries(this.validationResults)
            };
            
            console.log('📊 预加载验证结果:', results);
            return results;
        }
    }
    
    // 初始化验证器
    window.preloadValidator = new PreloadValidator();
    
    // 添加全局快捷键 Ctrl+Shift+V 显示验证结果
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'V') {
            e.preventDefault();
            window.preloadValidator.exportResults();
        }
    });
    
    console.log('🔧 预加载验证快捷键: Ctrl+Shift+V 显示验证结果');
})();
