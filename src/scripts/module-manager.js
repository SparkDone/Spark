/**
 * 模块化脚本管理器
 * 用于统一管理和加载页面脚本
 */

class ModuleManager {
    constructor() {
        this.loadedModules = new Set();
        this.loadingModules = new Map();
        this.moduleConfig = {
            // 关键模块 - 立即加载
            critical: [
                'theme-manager',
                'error-handler'
            ],
            // 重要模块 - 页面加载后立即加载
            important: [
                'font-loader',
                'layout-switcher'
            ],
            // 延迟模块 - 用户交互时加载
            deferred: [
                'search-system'
            ],
            // 条件模块 - 按需加载
            conditional: {
                'image-wrapper': () => document.querySelector('img[data-src]'),
                'markdown-renderer': () => document.querySelector('.prose')
                // 移除performance-monitor，因为它通过script标签直接加载
            }
        };
        
        this.init();
    }

    /**
     * 初始化模块管理器
     */
    init() {
        // 防止重复初始化
        if (window.moduleManagerInitialized) {
            if (import.meta.env.DEV && !import.meta.env.PROD) {
                console.log('⚠️ 模块管理器已初始化，跳过重复初始化');
            }
            return;
        }

        window.moduleManagerInitialized = true;

        if (import.meta.env.DEV && !import.meta.env.PROD) {
            console.log('🚀 模块管理器初始化');
        }
        
        // 立即加载关键模块
        this.loadCriticalModules();
        
        // DOM加载完成后加载重要模块
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.loadImportantModules();
                this.setupDeferredLoading();
                this.checkConditionalModules();
            });
        } else {
            this.loadImportantModules();
            this.setupDeferredLoading();
            this.checkConditionalModules();
        }
    }

    /**
     * 加载关键模块
     */
    async loadCriticalModules() {
        if (import.meta.env.DEV) console.log('⚡ 加载关键模块');

        for (const moduleName of this.moduleConfig.critical) {
            try {
                await this.loadModule(moduleName);
            } catch (error) {
                console.error(`❌ 关键模块加载失败: ${moduleName}`, error);
            }
        }
    }

    /**
     * 加载重要模块
     */
    async loadImportantModules() {
        if (import.meta.env.DEV) console.log('📦 加载重要模块');

        // 并行加载重要模块
        const loadPromises = this.moduleConfig.important.map(moduleName =>
            this.loadModule(moduleName).catch(error => {
                console.warn(`⚠️ 重要模块加载失败: ${moduleName}`, error);
            })
        );

        await Promise.allSettled(loadPromises);
    }

    /**
     * 设置延迟加载
     */
    setupDeferredLoading() {
        console.log('⏰ 设置延迟加载');
        
        // 用户交互时加载延迟模块
        const loadDeferredModules = () => {
            this.moduleConfig.deferred.forEach(moduleName => {
                this.loadModule(moduleName).catch(error => {
                    console.warn(`⚠️ 延迟模块加载失败: ${moduleName}`, error);
                });
            });
            
            // 移除事件监听器
            document.removeEventListener('click', loadDeferredModules, { once: true });
            document.removeEventListener('scroll', loadDeferredModules, { once: true });
            document.removeEventListener('keydown', loadDeferredModules, { once: true });
        };

        // 监听用户交互
        document.addEventListener('click', loadDeferredModules, { once: true });
        document.addEventListener('scroll', loadDeferredModules, { once: true });
        document.addEventListener('keydown', loadDeferredModules, { once: true });
        
        // 3秒后自动加载（兜底策略）
        setTimeout(loadDeferredModules, 3000);
    }

    /**
     * 检查条件模块
     */
    checkConditionalModules() {
        console.log('🔍 检查条件模块');
        
        Object.entries(this.moduleConfig.conditional).forEach(([moduleName, condition]) => {
            if (condition()) {
                console.log(`✅ 条件满足，加载模块: ${moduleName}`);
                this.loadModule(moduleName).catch(error => {
                    console.warn(`⚠️ 条件模块加载失败: ${moduleName}`, error);
                });
            }
        });
    }

    /**
     * 加载单个模块
     */
    async loadModule(moduleName) {
        // 检查是否已加载
        if (this.loadedModules.has(moduleName)) {
            return;
        }

        // 检查是否正在加载
        if (this.loadingModules.has(moduleName)) {
            return this.loadingModules.get(moduleName);
        }

        if (import.meta.env.DEV) {
            console.log(`📥 开始加载模块: ${moduleName}`);
        }
        
        const loadPromise = this.importModule(moduleName);
        this.loadingModules.set(moduleName, loadPromise);

        try {
            const module = await loadPromise;
            this.loadedModules.add(moduleName);
            this.loadingModules.delete(moduleName);
            
            if (import.meta.env.DEV) {
                console.log(`✅ 模块加载完成: ${moduleName}`);
            }
            
            // 触发模块加载完成事件
            document.dispatchEvent(new CustomEvent('module:loaded', {
                detail: { moduleName, module }
            }));
            
            return module;
        } catch (error) {
            this.loadingModules.delete(moduleName);
            console.error(`❌ 模块加载失败: ${moduleName}`, error);
            throw error;
        }
    }

    /**
     * 动态导入模块
     */
    async importModule(moduleName) {
        const moduleMap = {
            'theme-manager': () => import('./theme-manager.js'),
            'error-handler': () => import('./error-handler.js'),
            'font-loader': () => import('./font-loader.js'),
            'layout-switcher': () => import('./layout-switcher.js'),
            'search-system': () => import('../components/Search.svelte'),
            'image-wrapper': () => import('../components/misc/ImageWrapper.astro'),
            'markdown-renderer': () => import('../components/misc/Markdown.astro'),

            'lazy-loader': () => import('../utils/lazy-loader.ts'),
            'bundle-optimizer': () => import('../utils/bundle-optimizer.ts')
        };

        const moduleLoader = moduleMap[moduleName];
        if (!moduleLoader) {
            console.warn(`⚠️ 未知模块: ${moduleName}，跳过加载`);
            return null;
        }

        return moduleLoader();
    }

    /**
     * 手动加载模块
     */
    async loadModuleManually(moduleName) {
        return this.loadModule(moduleName);
    }

    /**
     * 预加载模块
     */
    preloadModule(moduleName) {
        // 使用link标签预加载模块
        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = this.getModulePath(moduleName);
        document.head.appendChild(link);
        
        console.log(`🚀 预加载模块: ${moduleName}`);
    }

    /**
     * 获取模块路径
     */
    getModulePath(moduleName) {
        const pathMap = {
            'theme-manager': '/src/scripts/theme-manager.js',
            'error-handler': '/src/scripts/error-handler.js',
            'font-loader': '/src/scripts/font-loader.js',
            'layout-switcher': '/src/scripts/layout-switcher.js',
            'search-system': '/src/components/Search.svelte',
            'image-wrapper': '/src/components/misc/ImageWrapper.astro',
            'markdown-renderer': '/src/components/misc/Markdown.astro',

            'lazy-loader': '/src/utils/lazy-loader.ts',
            'bundle-optimizer': '/src/utils/bundle-optimizer.ts'
        };

        return pathMap[moduleName] || `/src/utils/${moduleName}.js`;
    }

    /**
     * 获取加载状态
     */
    getLoadStatus() {
        return {
            loaded: Array.from(this.loadedModules),
            loading: Array.from(this.loadingModules.keys()),
            total: Object.keys(this.moduleConfig).reduce((total, category) => {
                if (Array.isArray(this.moduleConfig[category])) {
                    return total + this.moduleConfig[category].length;
                } else if (typeof this.moduleConfig[category] === 'object') {
                    return total + Object.keys(this.moduleConfig[category]).length;
                }
                return total;
            }, 0)
        };
    }

    /**
     * 卸载模块
     */
    unloadModule(moduleName) {
        this.loadedModules.delete(moduleName);
        console.log(`🗑️ 模块已卸载: ${moduleName}`);
    }
}

// 创建全局实例
window.moduleManager = new ModuleManager();

// 导出供其他模块使用
export default ModuleManager;
