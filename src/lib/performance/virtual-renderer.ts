/**
 * 虚拟化渲染系统
 * 用于优化大型SVG文档的渲染性能
 */

export interface RenderItem {
  id: string;
  element: SVGElement;
  bounds: DOMRect;
  visible: boolean;
  dirty: boolean;
  zIndex: number;
}

export interface ViewportInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export class VirtualRenderer {
  private items: Map<string, RenderItem> = new Map();
  private viewport: ViewportInfo;
  private renderQueue: Set<string> = new Set();
  private animationFrameId: number | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: OffscreenCanvas | null = null;
  private worker: Worker | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.viewport = {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      scale: 1
    };

    this.initializeOffscreenRendering();
  }

  private initializeOffscreenRendering() {
    if (typeof OffscreenCanvas !== 'undefined') {
      this.offscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
      
      // 创建Web Worker用于后台渲染
      if (typeof Worker !== 'undefined') {
        this.worker = new Worker(new URL('./render-worker.ts', import.meta.url));
        this.worker.postMessage({
          type: 'init',
          canvas: this.offscreenCanvas
        }, [this.offscreenCanvas]);
      }
    }
  }

  /**
   * 添加渲染项
   */
  addItem(item: RenderItem) {
    this.items.set(item.id, item);
    this.markDirty(item.id);
  }

  /**
   * 移除渲染项
   */
  removeItem(id: string) {
    this.items.delete(id);
    this.renderQueue.delete(id);
  }

  /**
   * 更新渲染项
   */
  updateItem(id: string, updates: Partial<RenderItem>) {
    const item = this.items.get(id);
    if (item) {
      Object.assign(item, updates);
      this.markDirty(id);
    }
  }

  /**
   * 标记项为需要重新渲染
   */
  markDirty(id: string) {
    const item = this.items.get(id);
    if (item) {
      item.dirty = true;
      this.renderQueue.add(id);
      this.scheduleRender();
    }
  }

  /**
   * 更新视口信息
   */
  updateViewport(viewport: Partial<ViewportInfo>) {
    const oldViewport = { ...this.viewport };
    Object.assign(this.viewport, viewport);

    // 检查哪些元素需要重新计算可见性
    if (oldViewport.x !== this.viewport.x || 
        oldViewport.y !== this.viewport.y ||
        oldViewport.scale !== this.viewport.scale) {
      this.updateVisibility();
    }
  }

  /**
   * 更新元素可见性
   */
  private updateVisibility() {
    const viewportBounds = {
      left: this.viewport.x,
      top: this.viewport.y,
      right: this.viewport.x + this.viewport.width / this.viewport.scale,
      bottom: this.viewport.y + this.viewport.height / this.viewport.scale
    };

    for (const [id, item] of this.items) {
      const bounds = item.bounds;
      const wasVisible = item.visible;
      
      // 检查元素是否在视口内
      item.visible = !(bounds.right < viewportBounds.left ||
                      bounds.left > viewportBounds.right ||
                      bounds.bottom < viewportBounds.top ||
                      bounds.top > viewportBounds.bottom);

      // 如果可见性发生变化，标记为需要重新渲染
      if (wasVisible !== item.visible) {
        this.markDirty(id);
      }
    }
  }

  /**
   * 调度渲染
   */
  private scheduleRender() {
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(() => {
        this.render();
        this.animationFrameId = null;
      });
    }
  }

  /**
   * 执行渲染
   */
  private render() {
    if (this.renderQueue.size === 0) return;

    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 设置变换矩阵
    this.ctx.save();
    this.ctx.scale(this.viewport.scale, this.viewport.scale);
    this.ctx.translate(-this.viewport.x, -this.viewport.y);

    // 获取需要渲染的可见元素
    const visibleItems = Array.from(this.items.values())
      .filter(item => item.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    // 批量渲染
    this.renderBatch(visibleItems);

    this.ctx.restore();

    // 清空渲染队列
    this.renderQueue.clear();
    
    // 标记所有项为已渲染
    for (const item of visibleItems) {
      item.dirty = false;
    }
  }

  /**
   * 批量渲染元素
   */
  private renderBatch(items: RenderItem[]) {
    // 如果支持Web Worker，使用后台渲染
    if (this.worker && items.length > 50) {
      this.renderWithWorker(items);
    } else {
      this.renderDirect(items);
    }
  }

  /**
   * 直接渲染
   */
  private renderDirect(items: RenderItem[]) {
    for (const item of items) {
      if (item.dirty || !item.visible) continue;
      
      try {
        this.renderElement(item.element);
      } catch (error) {
        console.warn(`渲染元素失败: ${item.id}`, error);
      }
    }
  }

  /**
   * 使用Web Worker渲染
   */
  private renderWithWorker(items: RenderItem[]) {
    if (!this.worker) return;

    const renderData = items.map(item => ({
      id: item.id,
      element: item.element.outerHTML,
      bounds: item.bounds,
      zIndex: item.zIndex
    }));

    this.worker.postMessage({
      type: 'render',
      items: renderData,
      viewport: this.viewport
    });
  }

  /**
   * 渲染单个元素
   */
  private renderElement(element: SVGElement) {
    // 将SVG元素转换为Canvas绘制
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(element);
    
    const img = new Image();
    img.onload = () => {
      const bounds = element.getBoundingClientRect();
      this.ctx.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height);
    };
    
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    img.src = URL.createObjectURL(blob);
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    return {
      totalItems: this.items.size,
      visibleItems: Array.from(this.items.values()).filter(item => item.visible).length,
      dirtyItems: Array.from(this.items.values()).filter(item => item.dirty).length,
      renderQueueSize: this.renderQueue.size
    };
  }

  /**
   * 清理资源
   */
  dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    if (this.worker) {
      this.worker.terminate();
    }
    
    this.items.clear();
    this.renderQueue.clear();
  }
}