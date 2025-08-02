/**
 * 浏览器扩展冲突检测器
 * 检测并处理常见的浏览器扩展冲突问题
 */

(function() {
    'use strict';
    
    class ExtensionConflictDetector {
        constructor() {
            this.conflicts = [];
            this.init();
        }
        
        init() {
            this.detectAdBlockers();
            this.detectPasswordManagers();
            this.detectPrivacyExtensions();
            this.setupErrorHandling();
            this.reportConflicts();
        }
        
        /**
         * 检测广告拦截器
         */
        detectAdBlockers() {
            const adBlockerSignals = [
                'adblock',
                'ublock',
                'adguard',
                'ghostery',
                'privacy-badger'
            ];
            
            // 检查全局变量
            adBlockerSignals.forEach(signal => {
                if (window[signal] || window[signal + 'Origin']) {
                    this.conflicts.push({
                        type: 'adblocker',
                        name: signal,
                        severity: 'medium'
                    });
                }
            });
            
            // 检查DOM元素
            const adBlockerElements = document.querySelectorAll('[class*="ad"], [id*="ad"]');
            if (adBlockerElements.length > 0) {
                this.conflicts.push({
                    type: 'adblocker',
                    name: 'DOM-based detection',
                    severity: 'low'
                });
            }
        }
        
        /**
         * 检测密码管理器
         */
        detectPasswordManagers() {
            const passwordManagerSignals = [
                'lastpass',
                '1password',
                'bitwarden',
                'dashlane',
                'roboform'
            ];
            
            passwordManagerSignals.forEach(signal => {
                if (window[signal] || document.querySelector(`[data-${signal}]`)) {
                    this.conflicts.push({
                        type: 'password-manager',
                        name: signal,
                        severity: 'low'
                    });
                }
            });
        }
        
        /**
         * 检测隐私扩展
         */
        detectPrivacyExtensions() {
            const privacyExtensions = [
                'duckduckgo',
                'brave',
                'privacy-pass',
                'canvas-fingerprint-defender'
            ];
            
            privacyExtensions.forEach(ext => {
                if (window[ext] || document.querySelector(`[data-${ext}]`)) {
                    this.conflicts.push({
                        type: 'privacy-extension',
                        name: ext,
                        severity: 'low'
                    });
                }
            });
        }
        
        /**
         * 设置错误处理
         */
        setupErrorHandling() {
            // 监听消息通道错误
            window.addEventListener('error', (event) => {
                if (event.message && event.message.includes('message channel closed')) {
                    this.conflicts.push({
                        type: 'message-channel',
                        name: 'Browser extension conflict',
                        severity: 'medium',
                        error: event.message
                    });
                }
            });
            
            // 监听Promise rejection
            window.addEventListener('unhandledrejection', (event) => {
                if (event.reason && event.reason.message && 
                    (event.reason.message.includes('Receiving end does not exist') ||
                     event.reason.message.includes('message channel closed'))) {
                    this.conflicts.push({
                        type: 'extension-conflict',
                        name: 'Browser extension',
                        severity: 'medium',
                        error: event.reason.message
                    });
                    event.preventDefault();
                }
            });
        }
        
        /**
         * 报告冲突
         */
        reportConflicts() {
            if (this.conflicts.length > 0) {
                console.group('🔍 检测到浏览器扩展冲突');
                this.conflicts.forEach(conflict => {
                    console.warn(`⚠️ ${conflict.type}: ${conflict.name} (${conflict.severity})`);
                    if (conflict.error) {
                        console.warn(`   错误: ${conflict.error}`);
                    }
                });
                console.groupEnd();
                
                // 发送自定义事件
                document.dispatchEvent(new CustomEvent('extension-conflicts-detected', {
                    detail: { conflicts: this.conflicts }
                }));
            } else {
                console.log('✅ 未检测到明显的浏览器扩展冲突');
            }
        }
        
        /**
         * 获取冲突报告
         */
        getConflictReport() {
            return {
                total: this.conflicts.length,
                conflicts: this.conflicts,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.extensionConflictDetector = new ExtensionConflictDetector();
        });
    } else {
        window.extensionConflictDetector = new ExtensionConflictDetector();
    }
    
})(); 