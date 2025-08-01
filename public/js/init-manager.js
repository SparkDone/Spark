/**
 * 统一初始化管理器 - 防止重复初始化和减少控制台噪音
 */

(function() {
    'use strict';
    
    class InitManager {
        constructor() {
            this.initializedModules = new Set();
            this.initCallbacks = new Map();
            this.isDebugMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            // 创建全局初始化管理器
            window.initManager = this;
            
            this.init();
        }
        
        init() {
            // 防止重复创建
            if (window.initManagerCreated) {
                return;
            }
            window.initManagerCreated = true;
            
            // 减少日志输出
            
            // 监听页面切换事件
            this.setupPageTransitionHandlers();
        }
        
        /**
         * 注册模块初始化
         * @param {string} moduleName - 模块名称
         * @param {Function} initCallback - 初始化回调
         * @param {Object} options - 选项
         */
        register(moduleName, initCallback, options = {}) {
            const {
                allowReinit = false,
                silent = false,
                priority = 'normal'
            } = options;
            
            // 检查是否已经初始化
            if (this.initializedModules.has(moduleName) && !allowReinit) {
                if (this.isDebugMode && !silent) {
                    console.log(`⚠️ 模块 ${moduleName} 已初始化，跳过重复初始化`);
                }
                return false;
            }
            
            // 存储回调
            this.initCallbacks.set(moduleName, {
                callback: initCallback,
                options: options
            });
            
            return true;
        }
        
        /**
         * 执行模块初始化
         * @param {string} moduleName - 模块名称
         * @param {...any} args - 传递给初始化函数的参数
         */
        async execute(moduleName, ...args) {
            const moduleInfo = this.initCallbacks.get(moduleName);
            
            if (!moduleInfo) {
                if (this.isDebugMode) {
                    console.warn(`⚠️ 未找到模块: ${moduleName}`);
                }
                return false;
            }
            
            const { callback, options } = moduleInfo;
            const { silent = false, allowReinit = false } = options;
            
            // 检查重复初始化
            if (this.initializedModules.has(moduleName) && !allowReinit) {
                if (this.isDebugMode && !silent) {
                    console.log(`⚠️ 模块 ${moduleName} 已初始化，跳过执行`);
                }
                return false;
            }
            
            try {
                // 执行初始化
                const result = await callback(...args);
                
                // 标记为已初始化
                this.initializedModules.add(moduleName);
                
                // 减少日志输出，只显示重要的初始化
                if (this.isDebugMode && !silent && ['banner-carousel', 'layout-switcher'].includes(moduleName)) {
                    console.log(`✅ 模块 ${moduleName} 初始化完成`);
                }
                
                return result;
            } catch (error) {
                if (this.isDebugMode) {
                    console.error(`❌ 模块 ${moduleName} 初始化失败:`, error);
                }
                return false;
            }
        }
        
        /**
         * 重置模块状态
         * @param {string} moduleName - 模块名称
         */
        reset(moduleName) {
            this.initializedModules.delete(moduleName);
            
            if (this.isDebugMode) {
                console.log(`🔄 模块 ${moduleName} 状态已重置`);
            }
        }
        
        /**
         * 重置所有模块状态
         */
        resetAll() {
            this.initializedModules.clear();
            
            if (this.isDebugMode) {
                console.log('🔄 所有模块状态已重置');
            }
        }
        
        /**
         * 检查模块是否已初始化
         * @param {string} moduleName - 模块名称
         */
        isInitialized(moduleName) {
            return this.initializedModules.has(moduleName);
        }
        
        /**
         * 获取已初始化的模块列表
         */
        getInitializedModules() {
            return Array.from(this.initializedModules);
        }
        
        /**
         * 设置页面切换处理器
         */
        setupPageTransitionHandlers() {
            let isTransitioning = false;

            // Swup页面切换支持
            const setupSwupHandlers = () => {
                if (window.swup) {
                    // 页面切换开始
                    window.swup.hooks.on('animation:out:start', () => {
                        isTransitioning = true;
                        // 减少日志
                    });

                    // 页面切换前重置某些模块（减少重置的模块）
                    window.swup.hooks.on('content:replace', () => {
                        // 只重置真正需要重新初始化的模块
                        const reinitModules = [
                            'banner-carousel' // 只重置轮播组件
                        ];

                        reinitModules.forEach(module => {
                            this.reset(module);
                        });

                        // 减少日志
                    }, { before: true });

                    // 页面切换完成
                    window.swup.hooks.on('animation:in:end', () => {
                        isTransitioning = false;
                        // 减少日志
                    });
                }
            };
            
            // 如果Swup已加载，直接设置
            if (window.swup) {
                setupSwupHandlers();
            } else {
                // 监听Swup加载事件
                document.addEventListener('swup:enable', setupSwupHandlers);
            }
        }
        
        /**
         * 批量执行模块初始化
         * @param {Array} modules - 模块名称数组
         */
        async executeAll(modules) {
            const results = [];
            
            for (const module of modules) {
                const result = await this.execute(module);
                results.push({ module, success: result });
            }
            
            return results;
        }
        
        /**
         * 获取初始化统计信息
         */
        getStats() {
            return {
                totalRegistered: this.initCallbacks.size,
                totalInitialized: this.initializedModules.size,
                registeredModules: Array.from(this.initCallbacks.keys()),
                initializedModules: Array.from(this.initializedModules),
                uninitializedModules: Array.from(this.initCallbacks.keys()).filter(
                    name => !this.initializedModules.has(name)
                )
            };
        }
        
        /**
         * 显示调试信息
         */
        debug() {
            if (!this.isDebugMode) {
                console.log('调试信息仅在开发环境下可用');
                return;
            }
            
            const stats = this.getStats();
            
            console.group('🎯 初始化管理器状态');
            console.log('已注册模块:', stats.registeredModules);
            console.log('已初始化模块:', stats.initializedModules);
            console.log('未初始化模块:', stats.uninitializedModules);
            console.log('初始化率:', `${stats.totalInitialized}/${stats.totalRegistered} (${Math.round(stats.totalInitialized / stats.totalRegistered * 100)}%)`);
            console.groupEnd();
        }
    }
    
    // 创建全局初始化管理器实例
    new InitManager();
    
    // 添加快捷键 Ctrl+Shift+I 显示调试信息
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            window.initManager?.debug();
        }
    });
    
    // 减少重复的快捷键提示
    if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
        !window.initManagerShortcutShown) {
        console.log('🔧 初始化管理器快捷键: Ctrl+Shift+I 显示调试信息');
        window.initManagerShortcutShown = true;
    }
})();
