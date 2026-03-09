/**
 * 内存管理器
 * 用于监控和优化内存使用，包括垃圾回收优化和事件监听器管理
 */

import { globalPoolManager } from './object-pool';

export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

export interface EventListenerInfo {
  element: Element | Window | Document;
  type: string;
  listener: EventListener;
  options?: boolean | AddEventListenerOptions;
  addedAt: number;
}

export interface ResourceInfo {
  id: string;
  type: 'image' | 'blob' | 'url' | 'canvas' | 'other';
  size: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
}

export class MemoryManager {
  private eventListeners: Map<string, EventListenerInfo> = new Map();
  private resources: Map<string, ResourceInfo> = new Map();
  private memoryHistory: MemoryStats[] = [];
  private cleanupInterval: number;
  private monitoringInterval: number;
  private gcThreshold = 0.8; // 内存使用率阈值
  private maxHistorySize = 100;
  private isMonitoring = false;

  constructor() {
    this.startMonitoring();
    this.setupCleanupInterval();
  }

  /**
   * 开始内存监控
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = window.setInterval(() => {
      this.collectMemoryStats();
      this.checkMemoryPressure();
    }, 5000); // 每5秒监控一次
  }

  /**
   * 停止内存监控
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }

  /**
   * 收集内存统计信息
   */
  private collectMemoryStats() {
    if (!('memory' in performance)) return;

    const memory = (performance as any).memory;
    const stats: MemoryStats = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now()
    };

    this.memoryHistory.push(stats);
    
    // 限制历史记录大小
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }
  }

  /**
   * 检查内存压力
   */
  private checkMemoryPressure() {
    const latest = this.getLatestMemoryStats();
    if (!latest) return;

    const usageRatio = latest.usedJSHeapSize / latest.jsHeapSizeLimit;
    
    if (usageRatio > this.gcThreshold) {
      console.warn(`内存使用率过高: ${Math.round(usageRatio * 100)}%`);
      this.triggerCleanup();
    }
  }

  /**
   * 触发清理
   */
  private triggerCleanup() {
    // 清理过期资源
    this.cleanupExpiredResources();
    
    // 清理对象池
    globalPoolManager.returnAllObjects();
    
    // 建议垃圾回收（如果支持）
    this.suggestGarbageCollection();
  }

  /**
   * 建议垃圾回收
   */
  private suggestGarbageCollection() {
    // 在开发环境中，可以手动触发GC
    if (process.env.NODE_ENV === 'development' && 'gc' in window) {
      try {
        (window as any).gc();
        console.log('手动触发垃圾回收');
      } catch (error) {
        console.warn('无法手动触发垃圾回收:', error);
      }
    }
  }

  /**
   * 设置清理间隔
   */
  private setupCleanupInterval() {
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupExpiredResources();
      this.cleanupOldEventListeners();
    }, 60000); // 每分钟清理一次
  }

  /**
   * 注册事件监听器
   */
  addEventListener(
    element: Element | Window | Document,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): string {
    const id = this.generateListenerId(element, type, listener);
    
    // 添加事件监听器
    element.addEventListener(type, listener, options);
    
    // 记录监听器信息
    this.eventListeners.set(id, {
      element,
      type,
      listener,
      options,
      addedAt: Date.now()
    });

    return id;
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(id: string): boolean {
    const info = this.eventListeners.get(id);
    if (!info) return false;

    info.element.removeEventListener(info.type, info.listener, info.options);
    this.eventListeners.delete(id);
    return true;
  }

  /**
   * 生成监听器ID
   */
  private generateListenerId(
    element: Element | Window | Document,
    type: string,
    listener: EventListener
  ): string {
    const elementId = element === window ? 'window' : 
                     element === document ? 'document' : 
                     (element as Element).tagName || 'unknown';
    return `${elementId}-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清理旧的事件监听器
   */
  private cleanupOldEventListeners() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30分钟
    const toRemove: string[] = [];

    for (const [id, info] of this.eventListeners) {
      if (now - info.addedAt > maxAge) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.removeEventListener(id);
    }

    if (toRemove.length > 0) {
      console.log(`清理了 ${toRemove.length} 个过期的事件监听器`);
    }
  }

  /**
   * 注册资源
   */
  registerResource(
    id: string,
    type: ResourceInfo['type'],
    size: number = 0
  ): void {
    this.resources.set(id, {
      id,
      type,
      size,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1
    });
  }

  /**
   * 访问资源
   */
  accessResource(id: string): void {
    const resource = this.resources.get(id);
    if (resource) {
      resource.lastAccessed = Date.now();
      resource.accessCount++;
    }
  }

  /**
   * 移除资源
   */
  removeResource(id: string): boolean {
    return this.resources.delete(id);
  }

  /**
   * 清理过期资源
   */
  private cleanupExpiredResources() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10分钟
    const toRemove: string[] = [];

    for (const [id, resource] of this.resources) {
      if (now - resource.lastAccessed > maxAge) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.cleanupResource(id);
    }

    if (toRemove.length > 0) {
      console.log(`清理了 ${toRemove.length} 个过期资源`);
    }
  }

  /**
   * 清理单个资源
   */
  private cleanupResource(id: string) {
    const resource = this.resources.get(id);
    if (!resource) return;

    try {
      // 根据资源类型进行特定清理
      switch (resource.type) {
        case 'url':
          URL.revokeObjectURL(id);
          break;
        case 'blob':
          // Blob会自动被GC清理
          break;
        case 'canvas':
          // 清理Canvas上下文
          const canvas = document.getElementById(id) as HTMLCanvasElement;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }
          break;
      }
    } catch (error) {
      console.warn(`清理资源失败: ${id}`, error);
    } finally {
      this.resources.delete(id);
    }
  }

  /**
   * 获取最新内存统计
   */
  getLatestMemoryStats(): MemoryStats | null {
    return this.memoryHistory.length > 0 ? 
           this.memoryHistory[this.memoryHistory.length - 1] : 
           null;
  }

  /**
   * 获取内存历史
   */
  getMemoryHistory(): MemoryStats[] {
    return [...this.memoryHistory];
  }

  /**
   * 获取内存使用趋势
   */
  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.memoryHistory.length < 2) return 'stable';

    const recent = this.memoryHistory.slice(-5); // 最近5次记录
    const first = recent[0].usedJSHeapSize;
    const last = recent[recent.length - 1].usedJSHeapSize;
    const diff = last - first;
    const threshold = first * 0.1; // 10%的变化阈值

    if (diff > threshold) return 'increasing';
    if (diff < -threshold) return 'decreasing';
    return 'stable';
  }

  /**
   * 获取资源统计
   */
  getResourceStats() {
    const stats = {
      total: this.resources.size,
      byType: {} as Record<string, number>,
      totalSize: 0,
      oldestResource: null as ResourceInfo | null,
      mostAccessedResource: null as ResourceInfo | null
    };

    let oldestTime = Date.now();
    let maxAccess = 0;

    for (const resource of this.resources.values()) {
      // 按类型统计
      stats.byType[resource.type] = (stats.byType[resource.type] || 0) + 1;
      
      // 总大小
      stats.totalSize += resource.size;
      
      // 最旧资源
      if (resource.createdAt < oldestTime) {
        oldestTime = resource.createdAt;
        stats.oldestResource = resource;
      }
      
      // 最多访问资源
      if (resource.accessCount > maxAccess) {
        maxAccess = resource.accessCount;
        stats.mostAccessedResource = resource;
      }
    }

    return stats;
  }

  /**
   * 获取事件监听器统计
   */
  getEventListenerStats() {
    const stats = {
      total: this.eventListeners.size,
      byType: {} as Record<string, number>,
      byElement: {} as Record<string, number>
    };

    for (const info of this.eventListeners.values()) {
      // 按事件类型统计
      stats.byType[info.type] = (stats.byType[info.type] || 0) + 1;
      
      // 按元素类型统计
      const elementType = info.element === window ? 'window' : 
                         info.element === document ? 'document' : 
                         (info.element as Element).tagName || 'unknown';
      stats.byElement[elementType] = (stats.byElement[elementType] || 0) + 1;
    }

    return stats;
  }

  /**
   * 强制清理所有资源
   */
  forceCleanup() {
    // 清理所有事件监听器
    const listenerIds = Array.from(this.eventListeners.keys());
    for (const id of listenerIds) {
      this.removeEventListener(id);
    }

    // 清理所有资源
    const resourceIds = Array.from(this.resources.keys());
    for (const id of resourceIds) {
      this.cleanupResource(id);
    }

    // 清理对象池
    globalPoolManager.clearAll();

    // 清理内存历史
    this.memoryHistory.length = 0;

    console.log('强制清理完成');
  }

  /**
   * 获取完整统计信息
   */
  getFullStats() {
    return {
      memory: this.getLatestMemoryStats(),
      memoryTrend: this.getMemoryTrend(),
      resources: this.getResourceStats(),
      eventListeners: this.getEventListenerStats(),
      objectPools: globalPoolManager.getAllStats()
    };
  }

  /**
   * 清理资源
   */
  dispose() {
    this.stopMonitoring();
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.forceCleanup();
  }
}

// 全局内存管理器实例
export const globalMemoryManager = new MemoryManager();

// 在页面卸载时清理资源
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalMemoryManager.dispose();
  });
}