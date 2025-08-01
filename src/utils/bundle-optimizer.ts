/**
 * JavaScript包大小优化工具
 * 用于动态加载和代码分割
 */

interface ModuleCache {
  [key: string]: Promise<any>;
}

interface LoadOptions {
  timeout?: number;
  retry?: number;
  cache?: boolean;
}

/**
 * 模块动态加载器
 */
export class ModuleLoader {
  private cache: ModuleCache = {};
  private loadingStates = new Map<string, boolean>();

  /**
   * 动态导入模块
   */
  async loadModule<T = any>(
    moduleFactory: () => Promise<T>,
    moduleName: string,
    options: LoadOptions = {}
  ): Promise<T> {
    const {
      timeout = 10000,
      retry = 3,
      cache = true
    } = options;

    // 检查缓存
    if (cache && this.cache[moduleName]) {
      return this.cache[moduleName];
    }

    // 检查是否正在加载
    if (this.loadingStates.get(moduleName)) {
      // 等待加载完成
      while (this.loadingStates.get(moduleName)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.cache[moduleName];
    }

    this.loadingStates.set(moduleName, true);

    const loadPromise = this.loadWithRetry(moduleFactory, retry, timeout);

    if (cache) {
      this.cache[moduleName] = loadPromise;
    }

    try {
      const module = await loadPromise;
      console.log(`📦 模块加载成功: ${moduleName}`);
      return module;
    } catch (error) {
      console.error(`❌ 模块加载失败: ${moduleName}`, error);
      // 清除失败的缓存
      if (cache) {
        delete this.cache[moduleName];
      }
      throw error;
    } finally {
      this.loadingStates.set(moduleName, false);
    }
  }

  private async loadWithRetry<T>(
    moduleFactory: () => Promise<T>,
    maxRetries: number,
    timeout: number
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await Promise.race([
          moduleFactory(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Module load timeout')), timeout)
          )
        ]);
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ 模块加载重试 ${attempt}/${maxRetries}:`, error);
        
        if (attempt < maxRetries) {
          // 指数退避
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError!;
  }

  /**
   * 预加载模块
   */
  preloadModule<T>(moduleFactory: () => Promise<T>, moduleName: string): void {
    if (!this.cache[moduleName] && !this.loadingStates.get(moduleName)) {
      this.loadModule(moduleFactory, moduleName).catch(error => {
        console.warn(`⚠️ 模块预加载失败: ${moduleName}`, error);
      });
    }
  }

  /**
   * 清除缓存
   */
  clearCache(moduleName?: string): void {
    if (moduleName) {
      delete this.cache[moduleName];
    } else {
      this.cache = {};
    }
  }

  /**
   * 获取缓存状态
   */
  getCacheInfo(): { total: number; loaded: string[] } {
    const loaded = Object.keys(this.cache);
    return {
      total: loaded.length,
      loaded
    };
  }
}

/**
 * 组件动态加载器
 */
export class ComponentLoader extends ModuleLoader {
  /**
   * 加载Svelte组件
   */
  async loadSvelteComponent(componentPath: string): Promise<any> {
    return this.loadModule(
      () => import(/* @vite-ignore */ componentPath),
      `svelte:${componentPath}`
    );
  }

  /**
   * 加载Astro组件
   */
  async loadAstroComponent(componentPath: string): Promise<any> {
    return this.loadModule(
      () => import(/* @vite-ignore */ componentPath),
      `astro:${componentPath}`
    );
  }

  /**
   * 加载工具库
   */
  async loadUtility(utilityPath: string): Promise<any> {
    return this.loadModule(
      () => import(/* @vite-ignore */ utilityPath),
      `utility:${utilityPath}`
    );
  }
}

/**
 * 功能模块管理器
 */
export class FeatureManager {
  private componentLoader = new ComponentLoader();
  private enabledFeatures = new Set<string>();

  /**
   * 启用功能
   */
  async enableFeature(featureName: string, loader: () => Promise<any>): Promise<void> {
    if (this.enabledFeatures.has(featureName)) {
      return;
    }

    try {
      await this.componentLoader.loadModule(loader, `feature:${featureName}`);
      this.enabledFeatures.add(featureName);
      console.log(`🎯 功能已启用: ${featureName}`);
    } catch (error) {
      console.error(`❌ 功能启用失败: ${featureName}`, error);
      throw error;
    }
  }

  /**
   * 检查功能是否已启用
   */
  isFeatureEnabled(featureName: string): boolean {
    return this.enabledFeatures.has(featureName);
  }

  /**
   * 预加载关键功能
   */
  preloadCriticalFeatures(): void {
    // 预加载搜索功能
    this.componentLoader.preloadModule(
      () => import('../components/Search.svelte'),
      'search-component'
    );

    // 预加载主题切换
    this.componentLoader.preloadModule(
      () => import('../components/LightDarkSwitch.svelte'),
      'theme-switch'
    );

    // 预加载布局切换器
    this.componentLoader.preloadModule(
      () => import('../scripts/layout-switcher.js'),
      'layout-switcher'
    );
  }
}

/**
 * 代码分割助手
 */
export const CodeSplitting = {
  /**
   * 路由级别的代码分割
   */
  async loadPageModule(pageName: string): Promise<any> {
    const loader = new ModuleLoader();
    return loader.loadModule(
      () => import(/* @vite-ignore */ `../pages/${pageName}.astro`),
      `page:${pageName}`
    );
  },

  /**
   * 功能级别的代码分割
   */
  async loadFeature(featureName: string): Promise<any> {
    const featureLoaders: Record<string, () => Promise<any>> = {
      // 注意：移除了不存在的组件引用，避免构建错误
      // 'photo-gallery': () => import('../components/misc/PhotoGallery.astro'),
      // 'comment-system': () => import('../components/misc/CommentSystem.astro'),
      // 'analytics': () => import('../utils/analytics.js'),
      // 'search-advanced': () => import('../components/misc/AdvancedSearch.astro')
    };

    const loader = featureLoaders[featureName];
    if (!loader) {
      throw new Error(`Unknown feature: ${featureName}`);
    }

    const moduleLoader = new ModuleLoader();
    return moduleLoader.loadModule(loader, `feature:${featureName}`);
  },

  /**
   * 第三方库的代码分割
   */
  async loadLibrary(libraryName: string): Promise<any> {
    const libraryLoaders: Record<string, () => Promise<any>> = {
      'photoswipe': () => import('photoswipe'),
      // 'prismjs': () => import('prismjs'),
      // 'chart': () => import('chart.js'),
      // 'markdown': () => import('marked')
    };

    const loader = libraryLoaders[libraryName];
    if (!loader) {
      throw new Error(`Unknown library: ${libraryName}`);
    }

    const moduleLoader = new ModuleLoader();
    return moduleLoader.loadModule(loader, `library:${libraryName}`);
  }
};

// 创建全局实例
export const globalComponentLoader = new ComponentLoader();
export const globalFeatureManager = new FeatureManager();

// 默认导出
export default ModuleLoader;
