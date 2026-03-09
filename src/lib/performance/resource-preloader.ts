/**
 * 资源预加载器
 * 用于预加载常用资源和按需加载功能模块
 */

export interface PreloadResource {
  url: string;
  type: 'script' | 'style' | 'image' | 'font' | 'module';
  priority: 'high' | 'medium' | 'low';
  crossOrigin?: 'anonymous' | 'use-credentials';
  integrity?: string;
}

export interface ModuleInfo {
  name: string;
  loader: () => Promise<any>;
  dependencies?: string[];
  preload?: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface PreloadOptions {
  maxConcurrent: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export class ResourcePreloader {
  private loadedResources: Set<string> = new Set();
  private loadingResources: Map<string, Promise<void>> = new Map();
  private modules: Map<string, ModuleInfo> = new Map();
  private loadedModules: Map<string, any> = new Map();
  private options: PreloadOptions;
  private loadQueue: PreloadResource[] = [];
  private isProcessing = false;

  constructor(options: Partial<PreloadOptions> = {}) {
    this.options = {
      maxConcurrent: 6,
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...options
    };
  }

  /**
   * 预加载资源
   */
  async preload(resources: PreloadResource[]): Promise<void> {
    // 按优先级排序
    const sortedResources = resources.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    this.loadQueue.push(...sortedResources);
    
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  /**
   * 处理加载队列
   */
  private async processQueue(): Promise<void> {
    this.isProcessing = true;
    const concurrent: Promise<void>[] = [];

    while (this.loadQueue.length > 0 || concurrent.length > 0) {
      // 启动新的加载任务
      while (concurrent.length < this.options.maxConcurrent && this.loadQueue.length > 0) {
        const resource = this.loadQueue.shift()!;
        const loadPromise = this.loadResource(resource);
        concurrent.push(loadPromise);
      }

      // 等待至少一个任务完成
      if (concurrent.length > 0) {
        await Promise.race(concurrent);
        
        // 移除已完成的任务
        for (let i = concurrent.length - 1; i >= 0; i--) {
          const promise = concurrent[i];
          if (await this.isPromiseResolved(promise)) {
            concurrent.splice(i, 1);
          }
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * 检查Promise是否已解决
   */
  private async isPromiseResolved(promise: Promise<void>): Promise<boolean> {
    try {
      await Promise.race([promise, Promise.resolve()]);
      return true;
    } catch {
      return true; // 即使失败也算已解决
    }
  }

  /**
   * 加载单个资源
   */
  private async loadResource(resource: PreloadResource): Promise<void> {
    if (this.loadedResources.has(resource.url)) {
      return;
    }

    if (this.loadingResources.has(resource.url)) {
      return this.loadingResources.get(resource.url)!;
    }

    const loadPromise = this.performLoad(resource);
    this.loadingResources.set(resource.url, loadPromise);

    try {
      await loadPromise;
      this.loadedResources.add(resource.url);
    } finally {
      this.loadingResources.delete(resource.url);
    }
  }

  /**
   * 执行实际加载
   */
  private async performLoad(resource: PreloadResource): Promise<void> {
    let attempts = 0;
    
    while (attempts < this.options.retryAttempts) {
      try {
        await this.loadByType(resource);
        return;
      } catch (error) {
        attempts++;
        if (attempts >= this.options.retryAttempts) {
          console.warn(`资源加载失败: ${resource.url}`, error);
          throw error;
        }
        
        // 等待重试延迟
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay * attempts));
      }
    }
  }

  /**
   * 根据类型加载资源
   */
  private async loadByType(resource: PreloadResource): Promise<void> {
    switch (resource.type) {
      case 'script':
        return this.loadScript(resource);
      case 'style':
        return this.loadStyle(resource);
      case 'image':
        return this.loadImage(resource);
      case 'font':
        return this.loadFont(resource);
      case 'module':
        return this.loadModule(resource);
      default:
        throw new Error(`不支持的资源类型: ${resource.type}`);
    }
  }

  /**
   * 加载脚本
   */
  private async loadScript(resource: PreloadResource): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = resource.url;
      script.async = true;
      
      if (resource.crossOrigin) {
        script.crossOrigin = resource.crossOrigin;
      }
      
      if (resource.integrity) {
        script.integrity = resource.integrity;
      }

      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`脚本加载失败: ${resource.url}`));
      
      // 设置超时
      const timeout = setTimeout(() => {
        script.remove();
        reject(new Error(`脚本加载超时: ${resource.url}`));
      }, this.options.timeout);
      
      script.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * 加载样式
   */
  private async loadStyle(resource: PreloadResource): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = resource.url;
      
      if (resource.crossOrigin) {
        link.crossOrigin = resource.crossOrigin;
      }
      
      if (resource.integrity) {
        link.integrity = resource.integrity;
      }

      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`样式加载失败: ${resource.url}`));
      
      document.head.appendChild(link);
    });
  }

  /**
   * 加载图片
   */
  private async loadImage(resource: PreloadResource): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      if (resource.crossOrigin) {
        img.crossOrigin = resource.crossOrigin;
      }

      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`图片加载失败: ${resource.url}`));
      
      img.src = resource.url;
    });
  }

  /**
   * 加载字体
   */
  private async loadFont(resource: PreloadResource): Promise<void> {
    if ('fonts' in document) {
      try {
        await (document as any).fonts.load(`1em ${resource.url}`);
      } catch (error) {
        throw new Error(`字体加载失败: ${resource.url}`);
      }
    } else {
      // 降级方案：创建隐藏元素测试字体加载
      return this.loadFontFallback(resource);
    }
  }

  /**
   * 字体加载降级方案
   */
  private async loadFontFallback(resource: PreloadResource): Promise<void> {
    return new Promise((resolve, reject) => {
      const testElement = document.createElement('div');
      testElement.style.fontFamily = resource.url;
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      testElement.style.visibility = 'hidden';
      testElement.textContent = 'Test';
      
      document.body.appendChild(testElement);
      
      // 简单的超时机制
      setTimeout(() => {
        document.body.removeChild(testElement);
        resolve();
      }, 3000);
    });
  }

  /**
   * 加载ES模块
   */
  private async loadModule(resource: PreloadResource): Promise<void> {
    try {
      await import(resource.url);
    } catch (error) {
      throw new Error(`模块加载失败: ${resource.url}`);
    }
  }

  /**
   * 注册模块
   */
  registerModule(name: string, info: ModuleInfo): void {
    this.modules.set(name, info);
    
    // 如果需要预加载，添加到预加载队列
    if (info.preload) {
      this.preload([{
        url: name,
        type: 'module',
        priority: info.priority
      }]);
    }
  }

  /**
   * 动态加载模块
   */
  async loadModuleDynamic(name: string): Promise<any> {
    // 检查是否已加载
    if (this.loadedModules.has(name)) {
      return this.loadedModules.get(name);
    }

    const moduleInfo = this.modules.get(name);
    if (!moduleInfo) {
      throw new Error(`未找到模块: ${name}`);
    }

    // 加载依赖
    if (moduleInfo.dependencies) {
      await Promise.all(
        moduleInfo.dependencies.map(dep => this.loadModuleDynamic(dep))
      );
    }

    // 加载模块
    try {
      const loadedModule = await moduleInfo.loader();
      this.loadedModules.set(name, loadedModule);
      return loadedModule;
    } catch (error) {
      throw new Error(`模块加载失败: ${name}`);
    }
  }

  /**
   * 预加载关键资源
   */
  async preloadCritical(): Promise<void> {
    const criticalResources: PreloadResource[] = [
      // SVG.js 核心库
      {
        url: '/node_modules/@svgdotjs/svg.js/dist/svg.min.js',
        type: 'script',
        priority: 'high'
      },
      // 常用图标字体
      {
        url: '/fonts/lucide-icons.woff2',
        type: 'font',
        priority: 'high'
      },
      // 核心样式
      {
        url: '/styles/editor.css',
        type: 'style',
        priority: 'high'
      }
    ];

    await this.preload(criticalResources);
  }

  /**
   * 预加载编辑器资源
   */
  async preloadEditorResources(): Promise<void> {
    const editorResources: PreloadResource[] = [
      // 编辑器插件
      {
        url: '/node_modules/@svgdotjs/svg.draggable.js/dist/svg.draggable.min.js',
        type: 'script',
        priority: 'medium'
      },
      {
        url: '/node_modules/@svgdotjs/svg.select.js/dist/svg.select.min.js',
        type: 'script',
        priority: 'medium'
      },
      // 工具图标
      {
        url: '/images/tools/select.svg',
        type: 'image',
        priority: 'medium'
      },
      {
        url: '/images/tools/rectangle.svg',
        type: 'image',
        priority: 'medium'
      },
      {
        url: '/images/tools/circle.svg',
        type: 'image',
        priority: 'medium'
      }
    ];

    await this.preload(editorResources);
  }

  /**
   * 检查资源是否已加载
   */
  isResourceLoaded(url: string): boolean {
    return this.loadedResources.has(url);
  }

  /**
   * 检查模块是否已加载
   */
  isModuleLoaded(name: string): boolean {
    return this.loadedModules.has(name);
  }

  /**
   * 获取加载统计
   */
  getStats() {
    return {
      loadedResources: this.loadedResources.size,
      loadingResources: this.loadingResources.size,
      queueSize: this.loadQueue.length,
      loadedModules: this.loadedModules.size,
      registeredModules: this.modules.size
    };
  }

  /**
   * 清理资源
   */
  dispose() {
    this.loadedResources.clear();
    this.loadingResources.clear();
    this.loadQueue.length = 0;
    this.loadedModules.clear();
    this.modules.clear();
  }
}

// 全局资源预加载器
export const globalResourcePreloader = new ResourcePreloader();

// 注册常用模块
globalResourcePreloader.registerModule('svg-editor', {
  name: 'svg-editor',
  loader: () => import('../svg-editor/enhanced-editor'),
  priority: 'high',
  preload: false
});

globalResourcePreloader.registerModule('performance-monitor', {
  name: 'performance-monitor',
  loader: () => import('./performance-monitor'),
  priority: 'medium',
  preload: false
});

globalResourcePreloader.registerModule('canvas-cache', {
  name: 'canvas-cache',
  loader: () => import('./canvas-cache'),
  priority: 'medium',
  preload: false
});