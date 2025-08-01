/**
 * 资源预加载监控脚本
 * 监控资源预加载的效果和性能
 */

// 防止重复声明
if (typeof window.ResourcePreloadMonitor !== 'undefined') {
    console.log('🔄 ResourcePreloadMonitor已存在，跳过重复加载');
} else {

class ResourcePreloadMonitor {
    constructor() {
        this.metrics = {
            preloadedResources: 0,
            successfulPreloads: 0,
            failedPreloads: 0,
            totalPreloadTime: 0,
            averagePreloadTime: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        this.preloadedUrls = new Set();
        this.preloadStartTimes = new Map();
        
        this.init();
    }
    
    init() {
        // 监控预加载资源
        this.monitorPreloadLinks();
        
        // 监控资源加载性能
        this.monitorResourceTiming();
        
        // 监控字体加载
        this.monitorFontLoading();
        
        // 创建监控面板（仅开发环境） - 暂时禁用以避免界面干扰
        // if (this.isDevelopment()) {
        //     this.createMonitorPanel();
        // }
        
        // console.log('📊 资源预加载监控已启动'); // 减少控制台输出
    }
    
    isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1';
    }
    
    monitorPreloadLinks() {
        // 监控现有的预加载链接
        const preloadLinks = document.querySelectorAll('link[rel="preload"], link[rel="modulepreload"], link[rel="dns-prefetch"], link[rel="preconnect"]');
        
        preloadLinks.forEach(link => {
            this.metrics.preloadedResources++;
            const url = link.href;
            
            if (url && !this.preloadedUrls.has(url)) {
                this.preloadedUrls.add(url);
                this.preloadStartTimes.set(url, performance.now());
                
                // 监听加载事件
                link.addEventListener('load', () => {
                    this.onPreloadSuccess(url);
                });
                
                link.addEventListener('error', () => {
                    this.onPreloadError(url);
                });
            }
        });
        
        // 监控动态添加的预加载链接
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'LINK') {
                        const rel = node.getAttribute('rel');
                        if (rel && (rel.includes('preload') || rel.includes('preconnect') || rel.includes('dns-prefetch'))) {
                            this.metrics.preloadedResources++;
                            const url = node.href;
                            
                            if (url && !this.preloadedUrls.has(url)) {
                                this.preloadedUrls.add(url);
                                this.preloadStartTimes.set(url, performance.now());
                                
                                node.addEventListener('load', () => this.onPreloadSuccess(url));
                                node.addEventListener('error', () => this.onPreloadError(url));
                            }
                        }
                    }
                });
            });
        });
        
        observer.observe(document.head, { childList: true });
    }
    
    monitorResourceTiming() {
        // 使用Performance API监控资源加载
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (this.preloadedUrls.has(entry.name)) {
                        this.analyzeResourceTiming(entry);
                    }
                });
            });
            
            observer.observe({ entryTypes: ['resource'] });
        }
    }
    
    monitorFontLoading() {
        if ('fonts' in document) {
            document.fonts.addEventListener('loadingdone', (event) => {
                console.log(`✅ 字体加载完成: ${event.fontfaces.length} 个字体`);
            });
            
            document.fonts.addEventListener('loadingerror', (event) => {
                console.warn(`❌ 字体加载失败: ${event.fontfaces.length} 个字体`);
            });
        }
    }
    
    onPreloadSuccess(url) {
        this.metrics.successfulPreloads++;
        const startTime = this.preloadStartTimes.get(url);
        
        if (startTime) {
            const loadTime = performance.now() - startTime;
            this.metrics.totalPreloadTime += loadTime;
            this.metrics.averagePreloadTime = this.metrics.totalPreloadTime / this.metrics.successfulPreloads;
            
            console.log(`✅ 预加载成功: ${this.getResourceName(url)} (${loadTime.toFixed(2)}ms)`);
        }
        
        this.updateMonitorPanel();
    }
    
    onPreloadError(url) {
        this.metrics.failedPreloads++;
        console.warn(`❌ 预加载失败: ${this.getResourceName(url)}`);
        this.updateMonitorPanel();
    }
    
    analyzeResourceTiming(entry) {
        const url = entry.name;
        const startTime = this.preloadStartTimes.get(url);
        
        if (startTime && entry.fetchStart > 0) {
            // 检查是否命中缓存
            if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
                this.metrics.cacheHits++;
                console.log(`🎯 缓存命中: ${this.getResourceName(url)}`);
            } else {
                this.metrics.cacheMisses++;
            }
            
            // 分析加载时间
            const dnsTime = entry.domainLookupEnd - entry.domainLookupStart;
            const connectTime = entry.connectEnd - entry.connectStart;
            const requestTime = entry.responseStart - entry.requestStart;
            const responseTime = entry.responseEnd - entry.responseStart;
            
            if (this.isDevelopment()) {
                console.group(`📊 ${this.getResourceName(url)} 性能分析`);
                console.log(`DNS查询: ${dnsTime.toFixed(2)}ms`);
                console.log(`连接建立: ${connectTime.toFixed(2)}ms`);
                console.log(`请求时间: ${requestTime.toFixed(2)}ms`);
                console.log(`响应时间: ${responseTime.toFixed(2)}ms`);
                console.log(`总时间: ${entry.duration.toFixed(2)}ms`);
                console.log(`传输大小: ${entry.transferSize} bytes`);
                console.log(`解码大小: ${entry.decodedBodySize} bytes`);
                console.groupEnd();
            }
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
    
    createMonitorPanel() {
        const panel = document.createElement('div');
        panel.id = 'resource-preload-panel';
        panel.style.cssText = `
            position: fixed;
            top: 60px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            min-width: 250px;
            max-height: 400px;
            overflow-y: auto;
            display: none;
        `;
        
        // 确保body存在后再添加面板
        if (document.body) {
            document.body.appendChild(panel);
        } else {
            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    if (document.body) {
                        document.body.appendChild(panel);
                    }
                });
            } else {
                console.warn('⚠️ document.body不存在，跳过资源监控面板创建');
                return;
            }
        }
        
        // 添加切换按钮
        const toggleButton = document.createElement('button');
        toggleButton.textContent = '📊';
        toggleButton.title = '资源预加载监控';
        toggleButton.style.cssText = `
            position: fixed;
            top: 60px;
            right: 270px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 10001;
            font-size: 16px;
        `;
        
        toggleButton.addEventListener('click', () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
        
        // 确保body存在后再添加按钮
        if (document.body) {
            document.body.appendChild(toggleButton);
        } else {
            console.warn('⚠️ document.body不存在，跳过资源监控按钮创建');
            return;
        }
        
        this.monitorPanel = panel;
        this.updateMonitorPanel();
    }
    
    updateMonitorPanel() {
        if (!this.monitorPanel) return;
        
        const { 
            preloadedResources, 
            successfulPreloads, 
            failedPreloads, 
            averagePreloadTime,
            cacheHits,
            cacheMisses
        } = this.metrics;
        
        const successRate = preloadedResources > 0 ? 
            ((successfulPreloads / preloadedResources) * 100).toFixed(1) : 0;
        
        const cacheHitRate = (cacheHits + cacheMisses) > 0 ? 
            ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1) : 0;
        
        this.monitorPanel.innerHTML = `
            <div><strong>📊 资源预加载监控</strong></div>
            <hr style="margin: 10px 0; border: 1px solid #333;">
            <div>预加载资源: ${preloadedResources}</div>
            <div>成功加载: ${successfulPreloads}</div>
            <div>加载失败: ${failedPreloads}</div>
            <div>成功率: ${successRate}%</div>
            <div>平均加载时间: ${averagePreloadTime.toFixed(2)}ms</div>
            <hr style="margin: 10px 0; border: 1px solid #333;">
            <div>缓存命中: ${cacheHits}</div>
            <div>缓存未命中: ${cacheMisses}</div>
            <div>缓存命中率: ${cacheHitRate}%</div>
            <div>性能评级: ${this.getPerformanceGrade()}</div>
            <hr style="margin: 10px 0; border: 1px solid #333;">
            <div style="margin-top: 10px;">
                <button onclick="resourceMonitor.reset()" style="background: #333; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; margin-right: 5px;">重置</button>
                <button onclick="resourceMonitor.exportData()" style="background: #333; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">导出</button>
            </div>
            <div style="margin-top: 10px; font-size: 10px; color: #ccc;">
                预加载的URL: ${this.preloadedUrls.size} 个
            </div>
        `;
    }
    
    getPerformanceGrade() {
        const { successfulPreloads, preloadedResources, averagePreloadTime, cacheHits, cacheMisses } = this.metrics;
        
        if (preloadedResources === 0) return 'N/A';
        
        const successRate = (successfulPreloads / preloadedResources) * 100;
        const cacheHitRate = (cacheHits + cacheMisses) > 0 ? (cacheHits / (cacheHits + cacheMisses)) * 100 : 0;
        
        if (successRate >= 95 && averagePreloadTime < 100 && cacheHitRate >= 80) {
            return '🟢 优秀';
        } else if (successRate >= 85 && averagePreloadTime < 200 && cacheHitRate >= 60) {
            return '🟡 良好';
        } else {
            return '🔴 需要优化';
        }
    }
    
    reset() {
        this.metrics = {
            preloadedResources: 0,
            successfulPreloads: 0,
            failedPreloads: 0,
            totalPreloadTime: 0,
            averagePreloadTime: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        this.preloadedUrls.clear();
        this.preloadStartTimes.clear();
        
        this.updateMonitorPanel();
        console.log('📊 资源预加载监控数据已重置');
    }
    
    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            preloadedUrls: Array.from(this.preloadedUrls),
            userAgent: navigator.userAgent,
            url: window.location.href,
            connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resource-preload-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('📊 资源预加载数据已导出', data);
    }
    
    getReport() {
        return {
            ...this.metrics,
            preloadedUrls: Array.from(this.preloadedUrls),
            performanceGrade: this.getPerformanceGrade(),
            timestamp: new Date().toISOString()
        };
    }
}

// 初始化资源预加载监控 - 确保DOM加载完成
function initResourceMonitor() {
    const resourceMonitor = new ResourcePreloadMonitor();
    window.ResourcePreloadMonitor = ResourcePreloadMonitor;

    // 暴露到全局作用域（仅开发环境）
    if (resourceMonitor.isDevelopment()) {
        window.resourceMonitor = resourceMonitor;
    }
}

// 等待DOM加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResourceMonitor);
} else {
    // DOM已加载，延迟执行避免阻塞
    setTimeout(initResourceMonitor, 100);
}

} // 闭合防重复加载的if语句

// 页面卸载时输出报告
window.addEventListener('beforeunload', () => {
    if (resourceMonitor.metrics.preloadedResources > 0) {
        console.log('📊 资源预加载性能报告:', resourceMonitor.getReport());
    }
});
