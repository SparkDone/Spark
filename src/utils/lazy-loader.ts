/**
 * 懒加载工具类
 * 用于实现组件和资源的懒加载
 */

interface LazyLoadOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
}

interface LazyComponentOptions extends LazyLoadOptions {
  placeholder?: string;
  errorFallback?: string;
  loadingClass?: string;
  loadedClass?: string;
  errorClass?: string;
}

/**
 * 通用懒加载观察器
 */
export class LazyLoader {
  private observer: IntersectionObserver;
  private options: LazyLoadOptions;

  constructor(options: LazyLoadOptions = {}) {
    this.options = {
      root: null,
      rootMargin: '100px', // 增加预加载距离，提前加载图片
      threshold: 0.1,
      once: true,
      ...options
    };

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        root: this.options.root,
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold
      }
    );
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        const callback = element.dataset.lazyCallback;
        
        if (callback && (window as any)[callback]) {
          (window as any)[callback](element);
        }

        // 触发自定义事件
        element.dispatchEvent(new CustomEvent('lazy:load', {
          detail: { element, entry }
        }));

        if (this.options.once) {
          this.observer.unobserve(element);
        }
      }
    });
  }

  observe(element: Element) {
    this.observer.observe(element);
  }

  unobserve(element: Element) {
    this.observer.unobserve(element);
  }

  disconnect() {
    this.observer.disconnect();
  }
}

/**
 * 懒加载组件管理器
 */
export class LazyComponentManager {
  private loader: LazyLoader;
  private loadedComponents = new Set<string>();

  constructor(options: LazyComponentOptions = {}) {
    this.loader = new LazyLoader(options);
  }

  /**
   * 注册懒加载组件
   */
  registerComponent(element: HTMLElement, componentName: string, loadFunction: () => Promise<any>) {
    element.dataset.lazyComponent = componentName;
    element.dataset.lazyCallback = `loadComponent_${componentName}`;

    // 注册全局加载函数
    (window as any)[`loadComponent_${componentName}`] = async (el: HTMLElement) => {
      if (this.loadedComponents.has(componentName)) {
        return;
      }

      try {
        el.classList.add('loading');
        const component = await loadFunction();
        
        // 标记为已加载
        this.loadedComponents.add(componentName);
        el.classList.remove('loading');
        el.classList.add('loaded');

        console.log(`✅ 懒加载组件已加载: ${componentName}`);
        
        // 触发加载完成事件
        el.dispatchEvent(new CustomEvent('component:loaded', {
          detail: { componentName, component }
        }));

      } catch (error) {
        console.error(`❌ 懒加载组件失败: ${componentName}`, error);
        el.classList.remove('loading');
        el.classList.add('error');
      }
    };

    this.loader.observe(element);
  }

  /**
   * 预加载组件
   */
  async preloadComponent(componentName: string, loadFunction: () => Promise<any>) {
    if (this.loadedComponents.has(componentName)) {
      return;
    }

    try {
      await loadFunction();
      this.loadedComponents.add(componentName);
      console.log(`🚀 组件预加载完成: ${componentName}`);
    } catch (error) {
      console.error(`❌ 组件预加载失败: ${componentName}`, error);
    }
  }

  disconnect() {
    this.loader.disconnect();
  }
}

/**
 * 图片懒加载
 */
export function setupImageLazyLoading() {
  const imageLoader = new LazyLoader({
    rootMargin: '100px',
    threshold: 0.1
  });

  // 处理图片懒加载
  document.addEventListener('lazy:load', (event: any) => {
    const img = event.detail.element as HTMLImageElement;
    if (img.tagName === 'IMG' && img.dataset.src) {
      const originalSrc = img.dataset.src;
      img.src = originalSrc;
      img.removeAttribute('data-src');
      
      img.onload = () => {
        img.classList.add('loaded');
      };
      
      img.onerror = () => {
        img.classList.add('error');
      };
    }
  });

  // 观察所有带有 data-src 的图片
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageLoader.observe(img);
  });
}

/**
 * 脚本懒加载
 */
export async function loadScript(src: string, options: { async?: boolean; defer?: boolean } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = options.async ?? true;
    script.defer = options.defer ?? false;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  });
}

/**
 * CSS懒加载
 */
export async function loadCSS(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;

    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));

    document.head.appendChild(link);
  });
}

// 默认导出
export default LazyLoader;
