/**
 * Canvas缓存系统
 * 用于缓存复杂元素的渲染结果，提升重复渲染性能
 */

export interface CacheEntry {
  id: string;
  canvas: HTMLCanvasElement;
  imageData: ImageData;
  bounds: DOMRect;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
  complexity: number;
}

export interface CacheOptions {
  maxSize: number;
  maxAge: number;
  complexityThreshold: number;
  enableLRU: boolean;
}

export class CanvasCache {
  private cache: Map<string, CacheEntry> = new Map();
  private options: CacheOptions;
  private cleanupInterval: number;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0
  };

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      maxSize: 100, // 最大缓存条目数
      maxAge: 5 * 60 * 1000, // 5分钟
      complexityThreshold: 10, // 复杂度阈值
      enableLRU: true,
      ...options
    };

    // 定期清理过期缓存
    this.cleanupInterval = window.setInterval(() => {
      this.cleanup();
    }, 60000); // 每分钟清理一次
  }

  /**
   * 获取缓存项
   */
  get(id: string): CacheEntry | null {
    const entry = this.cache.get(id);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.options.maxAge) {
      this.cache.delete(id);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    // 更新访问信息
    entry.accessCount++;
    entry.lastAccess = Date.now();
    this.stats.hits++;

    return entry;
  }

  /**
   * 设置缓存项
   */
  set(id: string, element: SVGElement, canvas: HTMLCanvasElement): boolean {
    // 检查元素复杂度
    const complexity = this.calculateComplexity(element);
    if (complexity < this.options.complexityThreshold) {
      return false; // 简单元素不需要缓存
    }

    // 检查缓存大小限制
    if (this.cache.size >= this.options.maxSize) {
      this.evictLeastUsed();
    }

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      const bounds = element.getBBox();
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const entry: CacheEntry = {
        id,
        canvas: this.cloneCanvas(canvas),
        imageData,
        bounds,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccess: Date.now(),
        complexity
      };

      this.cache.set(id, entry);
      this.updateStats();
      return true;
    } catch (error) {
      console.warn(`缓存元素失败: ${id}`, error);
      return false;
    }
  }

  /**
   * 渲染缓存的元素
   */
  render(id: string, targetCtx: CanvasRenderingContext2D, x: number, y: number, scale = 1): boolean {
    const entry = this.get(id);
    if (!entry) return false;

    try {
      targetCtx.save();
      targetCtx.scale(scale, scale);
      targetCtx.drawImage(entry.canvas, x, y);
      targetCtx.restore();
      return true;
    } catch (error) {
      console.warn(`渲染缓存失败: ${id}`, error);
      return false;
    }
  }

  /**
   * 计算元素复杂度
   */
  private calculateComplexity(element: SVGElement): number {
    let complexity = 0;

    // 基础复杂度
    complexity += 1;

    // 子元素数量
    const children = element.children();
    complexity += children.length * 2;

    // 路径复杂度
    if (element.type === 'path') {
      const pathData = element.attr('d') || '';
      complexity += Math.floor(pathData.length / 10);
    }

    // 变换复杂度
    const transform = element.transform();
    if (transform.rotation !== 0 || transform.skewX !== 0 || transform.skewY !== 0) {
      complexity += 3;
    }

    // 滤镜复杂度
    const filter = element.attr('filter');
    if (filter) {
      complexity += 5;
    }

    // 渐变复杂度
    const fill = element.fill();
    if (typeof fill === 'object' && fill.type) {
      complexity += 3;
    }

    return complexity;
  }

  /**
   * 克隆Canvas
   */
  private cloneCanvas(original: HTMLCanvasElement): HTMLCanvasElement {
    const clone = document.createElement('canvas');
    clone.width = original.width;
    clone.height = original.height;
    
    const cloneCtx = clone.getContext('2d');
    if (cloneCtx) {
      cloneCtx.drawImage(original, 0, 0);
    }
    
    return clone;
  }

  /**
   * 驱逐最少使用的缓存项
   */
  private evictLeastUsed() {
    if (this.cache.size === 0) return;

    let leastUsedEntry: CacheEntry | null = null;
    let leastUsedId = '';

    for (const [id, entry] of this.cache) {
      if (!leastUsedEntry || 
          entry.accessCount < leastUsedEntry.accessCount ||
          (entry.accessCount === leastUsedEntry.accessCount && entry.lastAccess < leastUsedEntry.lastAccess)) {
        leastUsedEntry = entry;
        leastUsedId = id;
      }
    }

    if (leastUsedId) {
      this.cache.delete(leastUsedId);
      this.stats.evictions++;
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanup() {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [id, entry] of this.cache) {
      if (now - entry.timestamp > this.options.maxAge) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      this.cache.delete(id);
      this.stats.evictions++;
    }

    this.updateStats();
  }

  /**
   * 更新统计信息
   */
  private updateStats() {
    this.stats.totalSize = this.cache.size;
  }

  /**
   * 预热缓存
   */
  async preload(elements: Array<{ id: string; element: SVGElement }>) {
    const promises = elements.map(async ({ id, element }) => {
      try {
        // 创建临时canvas进行渲染
        const canvas = document.createElement('canvas');
        const bounds = element.getBBox();
        canvas.width = Math.ceil(bounds.width) || 100;
        canvas.height = Math.ceil(bounds.height) || 100;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 渲染元素到canvas
        await this.renderElementToCanvas(element, ctx);
        
        // 添加到缓存
        this.set(id, element, canvas);
      } catch (error) {
        console.warn(`预加载缓存失败: ${id}`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * 将SVG元素渲染到Canvas
   */
  private async renderElementToCanvas(element: SVGElement, ctx: CanvasRenderingContext2D): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const svgString = element.svg();
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('图片加载失败'));
        };
        img.src = url;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 删除缓存项
   */
  delete(id: string): boolean {
    return this.cache.delete(id);
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0
    };
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? this.stats.hits / (this.stats.hits + this.stats.misses) 
      : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * 估算内存使用量
   */
  private estimateMemoryUsage(): number {
    let totalBytes = 0;
    
    for (const entry of this.cache.values()) {
      // 估算ImageData大小 (width * height * 4 bytes per pixel)
      totalBytes += entry.imageData.width * entry.imageData.height * 4;
      
      // 估算Canvas大小
      totalBytes += entry.canvas.width * entry.canvas.height * 4;
    }
    
    return totalBytes;
  }

  /**
   * 获取缓存键列表
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 检查是否存在缓存
   */
  has(id: string): boolean {
    return this.cache.has(id);
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 清理资源
   */
  dispose() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.clear();
  }
}

// 全局缓存实例
export const globalCanvasCache = new CanvasCache({
  maxSize: 200,
  maxAge: 10 * 60 * 1000, // 10分钟
  complexityThreshold: 15,
  enableLRU: true
});