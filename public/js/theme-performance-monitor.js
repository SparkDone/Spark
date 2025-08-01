/**
 * 主题切换性能监控脚本
 * 用于监控和优化主题切换的性能
 */

// 防止重复声明
if (typeof window.ThemePerformanceMonitor !== 'undefined') {
    console.log('🔄 ThemePerformanceMonitor已存在，跳过重复加载');
} else {

class ThemePerformanceMonitor {
    constructor() {
        this.metrics = {
            switchCount: 0,
            totalSwitchTime: 0,
            averageSwitchTime: 0,
            slowSwitches: 0,
            fastSwitches: 0
        };
        
        this.thresholds = {
            slow: 300, // 超过300ms认为是慢切换
            fast: 100  // 低于100ms认为是快切换
        };
        
        this.init();
    }
    
    init() {
        // 监听主题切换事件
        this.observeThemeChanges();
        
        // 添加性能监控面板（仅开发环境） - 暂时禁用以避免界面干扰
        // if (this.isDevelopment()) {
        //     this.createPerformancePanel();
        // }
        
        // console.log('🎨 主题切换性能监控已启动'); // 减少控制台输出
    }
    
    isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1';
    }
    
    observeThemeChanges() {
        const html = document.documentElement;
        let switchStartTime = 0;
        
        // 监听主题切换开始
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const classList = html.classList;
                    
                    if (classList.contains('theme-transitioning')) {
                        // 主题切换开始
                        switchStartTime = performance.now();
                        this.onThemeSwitchStart();
                    } else if (switchStartTime > 0) {
                        // 主题切换结束
                        const switchTime = performance.now() - switchStartTime;
                        this.onThemeSwitchEnd(switchTime);
                        switchStartTime = 0;
                    }
                }
            });
        });
        
        observer.observe(html, {
            attributes: true,
            attributeFilter: ['class']
        });
        
        // 监听主题切换按钮点击
        this.observeThemeButton();
    }
    
    observeThemeButton() {
        const themeButton = document.getElementById('scheme-switch');
        if (themeButton) {
            themeButton.addEventListener('click', () => {
                this.onThemeButtonClick();
            });
        }
    }
    
    onThemeButtonClick() {
        console.log('🖱️ 主题切换按钮被点击');
    }
    
    onThemeSwitchStart() {
        console.log('🎨 主题切换开始');
    }
    
    onThemeSwitchEnd(switchTime) {
        this.metrics.switchCount++;
        this.metrics.totalSwitchTime += switchTime;
        this.metrics.averageSwitchTime = this.metrics.totalSwitchTime / this.metrics.switchCount;
        
        if (switchTime > this.thresholds.slow) {
            this.metrics.slowSwitches++;
            console.warn(`⚠️ 慢速主题切换: ${switchTime.toFixed(2)}ms`);
        } else if (switchTime < this.thresholds.fast) {
            this.metrics.fastSwitches++;
            console.log(`⚡ 快速主题切换: ${switchTime.toFixed(2)}ms`);
        } else {
            console.log(`✅ 正常主题切换: ${switchTime.toFixed(2)}ms`);
        }
        
        this.updatePerformancePanel();
    }
    
    createPerformancePanel() {
        const panel = document.createElement('div');
        panel.id = 'theme-performance-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            min-width: 200px;
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
                console.warn('⚠️ document.body不存在，跳过性能监控面板创建');
                return;
            }
        }
        
        // 添加切换按钮
        const toggleButton = document.createElement('button');
        toggleButton.textContent = '📊';
        toggleButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 220px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 10001;
        `;
        
        toggleButton.addEventListener('click', () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
        
        // 确保body存在后再添加按钮
        if (document.body) {
            document.body.appendChild(toggleButton);
        } else {
            console.warn('⚠️ document.body不存在，跳过性能监控按钮创建');
            return;
        }
        
        this.performancePanel = panel;
    }
    
    updatePerformancePanel() {
        if (!this.performancePanel) return;
        
        const { switchCount, averageSwitchTime, slowSwitches, fastSwitches } = this.metrics;
        
        this.performancePanel.innerHTML = `
            <div><strong>主题切换性能</strong></div>
            <div>切换次数: ${switchCount}</div>
            <div>平均时间: ${averageSwitchTime.toFixed(2)}ms</div>
            <div>快速切换: ${fastSwitches}</div>
            <div>慢速切换: ${slowSwitches}</div>
            <div>性能评级: ${this.getPerformanceGrade()}</div>
            <div style="margin-top: 10px;">
                <button onclick="themeMonitor.reset()" style="background: #333; color: white; border: none; padding: 3px 6px; border-radius: 3px; cursor: pointer;">重置</button>
                <button onclick="themeMonitor.exportData()" style="background: #333; color: white; border: none; padding: 3px 6px; border-radius: 3px; cursor: pointer; margin-left: 5px;">导出</button>
            </div>
        `;
    }
    
    getPerformanceGrade() {
        const { averageSwitchTime, slowSwitches, switchCount } = this.metrics;
        
        if (switchCount === 0) return 'N/A';
        
        const slowRatio = slowSwitches / switchCount;
        
        if (averageSwitchTime < 100 && slowRatio < 0.1) {
            return '🟢 优秀';
        } else if (averageSwitchTime < 200 && slowRatio < 0.3) {
            return '🟡 良好';
        } else {
            return '🔴 需要优化';
        }
    }
    
    reset() {
        this.metrics = {
            switchCount: 0,
            totalSwitchTime: 0,
            averageSwitchTime: 0,
            slowSwitches: 0,
            fastSwitches: 0
        };
        
        this.updatePerformancePanel();
        console.log('📊 性能监控数据已重置');
    }
    
    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `theme-performance-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('📊 性能数据已导出', data);
    }
    
    getReport() {
        return {
            ...this.metrics,
            performanceGrade: this.getPerformanceGrade(),
            timestamp: new Date().toISOString()
        };
    }
}

// 初始化性能监控 - 确保DOM加载完成
function initThemeMonitor() {
    const themeMonitor = new ThemePerformanceMonitor();
    window.ThemePerformanceMonitor = ThemePerformanceMonitor;

    // 暴露到全局作用域（仅开发环境）
    if (themeMonitor.isDevelopment()) {
        window.themeMonitor = themeMonitor;
    }
}

// 等待DOM加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeMonitor);
} else {
    // DOM已加载，延迟执行避免阻塞
    setTimeout(initThemeMonitor, 100);
}

} // 闭合防重复加载的if语句

// 页面卸载时输出性能报告
window.addEventListener('beforeunload', () => {
    if (themeMonitor.metrics.switchCount > 0) {
        console.log('📊 主题切换性能报告:', themeMonitor.getReport());
    }
});
