/**
 * Service Worker 管理器
 * 用于注册和管理Service Worker
 */

export interface SWConfig {
  scope?: string;
  updateViaCache?: 'imports' | 'all' | 'none';
  autoUpdate?: boolean;
  updateInterval?: number;
}

export interface SWStats {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  isControlling: boolean;
  cacheStats?: Record<string, number>;
  lastUpdate?: Date;
}

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private config: SWConfig;
  private updateCheckInterval: number | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor(config: SWConfig = {}) {
    this.config = {
      scope: '/',
      updateViaCache: 'none',
      autoUpdate: true,
      updateInterval: 60000, // 1分钟
      ...config
    };
  }

  /**
   * 检查Service Worker支持
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * 注册Service Worker
   */
  async register(scriptURL = '/sw.js'): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.warn('当前浏览器不支持Service Worker');
      return null;
    }

    try {
      console.log('注册Service Worker...');
      
      this.registration = await navigator.serviceWorker.register(scriptURL, {
        scope: this.config.scope,
        updateViaCache: this.config.updateViaCache
      });

      console.log('Service Worker注册成功:', this.registration.scope);
      
      // 设置事件监听器
      this.setupEventListeners();
      
      // 启动自动更新检查
      if (this.config.autoUpdate) {
        this.startUpdateCheck();
      }
      
      this.emit('registered', this.registration);
      return this.registration;
    } catch (error) {
      console.error('Service Worker注册失败:', error);
      this.emit('error', error);
      return null;
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners() {
    if (!this.registration) return;

    // 监听安装事件
    if (this.registration.installing) {
      this.trackWorkerState(this.registration.installing, 'installing');
    }

    // 监听等待事件
    if (this.registration.waiting) {
      this.trackWorkerState(this.registration.waiting, 'waiting');
    }

    // 监听激活事件
    if (this.registration.active) {
      this.trackWorkerState(this.registration.active, 'active');
    }

    // 监听更新事件
    this.registration.addEventListener('updatefound', () => {
      console.log('发现Service Worker更新');
      const newWorker = this.registration!.installing;
      
      if (newWorker) {
        this.trackWorkerState(newWorker, 'installing');
        this.emit('updatefound', newWorker);
      }
    });

    // 监听控制器变化
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker控制器已更改');
      this.emit('controllerchange');
    });

    // 监听消息
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleMessage(event);
    });
  }

  /**
   * 跟踪Worker状态
   */
  private trackWorkerState(worker: ServiceWorker, initialState: string) {
    console.log(`Service Worker状态: ${initialState}`);
    
    worker.addEventListener('statechange', () => {
      console.log(`Service Worker状态变更: ${worker.state}`);
      this.emit('statechange', { worker, state: worker.state });
      
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        // 有新版本可用
        this.emit('updateavailable', worker);
      }
      
      if (worker.state === 'activated') {
        this.emit('activated', worker);
      }
    });
  }

  /**
   * 处理Service Worker消息
   */
  private handleMessage(event: MessageEvent) {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'CACHE_STATS':
        this.emit('cachestats', payload);
        break;
      case 'CACHE_CLEARED':
        this.emit('cachecleared');
        break;
      default:
        this.emit('message', event.data);
    }
  }

  /**
   * 启动更新检查
   */
  private startUpdateCheck() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    this.updateCheckInterval = window.setInterval(() => {
      this.checkForUpdates();
    }, this.config.updateInterval!);
  }

  /**
   * 停止更新检查
   */
  private stopUpdateCheck() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  /**
   * 检查更新
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      return true;
    } catch (error) {
      console.warn('检查Service Worker更新失败:', error);
      return false;
    }
  }

  /**
   * 跳过等待，立即激活新版本
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      throw new Error('没有等待中的Service Worker');
    }

    // 发送跳过等待消息
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * 获取缓存统计
   */
  async getCacheStats(): Promise<Record<string, number>> {
    return new Promise((resolve, reject) => {
      if (!navigator.serviceWorker.controller) {
        reject(new Error('没有活动的Service Worker'));
        return;
      }

      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'CACHE_STATS') {
          resolve(payload);
        } else {
          reject(new Error('获取缓存统计失败'));
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_STATS' },
        [channel.port2]
      );
    });
  }

  /**
   * 清空所有缓存
   */
  async clearAllCaches(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!navigator.serviceWorker.controller) {
        reject(new Error('没有活动的Service Worker'));
        return;
      }

      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        const { type } = event.data;
        if (type === 'CACHE_CLEARED') {
          resolve();
        } else {
          reject(new Error('清空缓存失败'));
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [channel.port2]
      );
    });
  }

  /**
   * 注销Service Worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      this.stopUpdateCheck();
      const result = await this.registration.unregister();
      
      if (result) {
        this.registration = null;
        this.emit('unregistered');
        console.log('Service Worker已注销');
      }
      
      return result;
    } catch (error) {
      console.error('注销Service Worker失败:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * 获取状态信息
   */
  async getStats(): Promise<SWStats> {
    const stats: SWStats = {
      isSupported: this.isSupported(),
      isRegistered: !!this.registration,
      isActive: !!this.registration?.active,
      isControlling: !!navigator.serviceWorker.controller
    };

    if (this.registration) {
      try {
        stats.cacheStats = await this.getCacheStats();
      } catch (error) {
        console.warn('获取缓存统计失败:', error);
      }
    }

    return stats;
  }

  /**
   * 添加事件监听器
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * 移除事件监听器
   */
  off(event: string, callback: (...args: any[]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件回调执行失败 (${event}):`, error);
        }
      });
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stopUpdateCheck();
    this.listeners.clear();
  }
}

// 全局Service Worker管理器
export const globalSWManager = new ServiceWorkerManager();

// 自动注册Service Worker
if (typeof window !== 'undefined') {
  // 等待页面加载完成后注册
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      globalSWManager.register();
    });
  } else {
    globalSWManager.register();
  }

  // 监听更新事件
  globalSWManager.on('updateavailable', (worker: ServiceWorker) => {
    console.log('检测到新版本，准备更新...');
    
    // 可以在这里显示更新提示给用户
    if (confirm('发现新版本，是否立即更新？')) {
      globalSWManager.skipWaiting();
    }
  });

  globalSWManager.on('controllerchange', () => {
    // 控制器变更，刷新页面
    window.location.reload();
  });
}