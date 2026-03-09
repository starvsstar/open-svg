/**
 * 增量更新系统
 * 只更新变化的部分，避免不必要的重新渲染
 */

import { Svg, Element as SVGElement } from '@svgdotjs/svg.js';

export interface ElementState {
  id: string;
  element: SVGElement;
  lastSnapshot: string;
  lastBounds: DOMRect;
  lastTransform: string;
  lastStyle: Record<string, any>;
  dirty: boolean;
  version: number;
}

export interface UpdateBatch {
  added: ElementState[];
  modified: ElementState[];
  removed: string[];
  timestamp: number;
}

export class IncrementalUpdater {
  private elements: Map<string, ElementState> = new Map();
  private updateQueue: Set<string> = new Set();
  private batchTimeout: number | null = null;
  private observers: Set<(batch: UpdateBatch) => void> = new Set();
  private version = 0;
  private isProcessing = false;

  constructor(private svgInstance: Svg) {
    this.setupMutationObserver();
  }

  /**
   * 设置DOM变化监听器
   */
  private setupMutationObserver() {
    if (typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        this.handleMutation(mutation);
      }
    });

    observer.observe(this.svgInstance.node, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true
    });
  }

  /**
   * 处理DOM变化
   */
  private handleMutation(mutation: MutationRecord) {
    switch (mutation.type) {
      case 'childList':
        this.handleChildListMutation(mutation);
        break;
      case 'attributes':
        this.handleAttributeMutation(mutation);
        break;
    }
  }

  /**
   * 处理子元素变化
   */
  private handleChildListMutation(mutation: MutationRecord) {
    // 处理新增的元素
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = this.wrapElement(node as SVGElement);
        if (element) {
          this.addElement(element);
        }
      }
    }

    // 处理移除的元素
    for (const node of mutation.removedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const id = (node as any).id || this.generateElementId(node as SVGElement);
        this.removeElement(id);
      }
    }
  }

  /**
   * 处理属性变化
   */
  private handleAttributeMutation(mutation: MutationRecord) {
    const target = mutation.target as SVGElement;
    const id = (target as any).id || this.generateElementId(target);
    
    if (this.elements.has(id)) {
      this.markElementDirty(id);
    }
  }

  /**
   * 包装SVG元素
   */
  private wrapElement(node: SVGElement): SVGElement | null {
    try {
      // 尝试从SVG.js获取包装的元素
      return this.svgInstance.findOne(`#${(node as any).id}`) || null;
    } catch {
      return null;
    }
  }

  /**
   * 生成元素ID
   */
  private generateElementId(element: SVGElement): string {
    return `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加元素
   */
  addElement(element: SVGElement) {
    const id = element.id() || this.generateElementId(element.node as SVGElement);
    
    if (!element.id()) {
      element.id(id);
    }

    const state: ElementState = {
      id,
      element,
      lastSnapshot: this.createElementSnapshot(element),
      lastBounds: this.getElementBounds(element),
      lastTransform: this.getElementTransform(element),
      lastStyle: this.getElementStyle(element),
      dirty: true,
      version: ++this.version
    };

    this.elements.set(id, state);
    this.scheduleUpdate(id);
  }

  /**
   * 移除元素
   */
  removeElement(id: string) {
    this.elements.delete(id);
    this.updateQueue.delete(id);
    this.scheduleUpdate(id); // 通知移除
  }

  /**
   * 标记元素为脏
   */
  markElementDirty(id: string) {
    const state = this.elements.get(id);
    if (state) {
      state.dirty = true;
      state.version = ++this.version;
      this.scheduleUpdate(id);
    }
  }

  /**
   * 调度更新
   */
  private scheduleUpdate(id: string) {
    this.updateQueue.add(id);
    
    if (this.batchTimeout === null) {
      this.batchTimeout = window.setTimeout(() => {
        this.processBatch();
        this.batchTimeout = null;
      }, 16); // 约60fps
    }
  }

  /**
   * 处理批量更新
   */
  private async processBatch() {
    if (this.isProcessing || this.updateQueue.size === 0) return;

    this.isProcessing = true;
    const batch: UpdateBatch = {
      added: [],
      modified: [],
      removed: [],
      timestamp: Date.now()
    };

    for (const id of this.updateQueue) {
      const state = this.elements.get(id);
      
      if (!state) {
        // 元素被移除
        batch.removed.push(id);
        continue;
      }

      if (state.dirty) {
        const hasChanged = await this.checkElementChanges(state);
        
        if (hasChanged) {
          if (state.lastSnapshot === '') {
            // 新元素
            batch.added.push(state);
          } else {
            // 修改的元素
            batch.modified.push(state);
          }
          
          // 更新快照
          this.updateElementSnapshot(state);
        }
        
        state.dirty = false;
      }
    }

    this.updateQueue.clear();
    this.isProcessing = false;

    // 通知观察者
    if (batch.added.length > 0 || batch.modified.length > 0 || batch.removed.length > 0) {
      this.notifyObservers(batch);
    }
  }

  /**
   * 检查元素变化
   */
  private async checkElementChanges(state: ElementState): Promise<boolean> {
    const currentSnapshot = this.createElementSnapshot(state.element);
    const currentBounds = this.getElementBounds(state.element);
    const currentTransform = this.getElementTransform(state.element);
    const currentStyle = this.getElementStyle(state.element);

    return (
      currentSnapshot !== state.lastSnapshot ||
      !this.boundsEqual(currentBounds, state.lastBounds) ||
      currentTransform !== state.lastTransform ||
      !this.styleEqual(currentStyle, state.lastStyle)
    );
  }

  /**
   * 更新元素快照
   */
  private updateElementSnapshot(state: ElementState) {
    state.lastSnapshot = this.createElementSnapshot(state.element);
    state.lastBounds = this.getElementBounds(state.element);
    state.lastTransform = this.getElementTransform(state.element);
    state.lastStyle = this.getElementStyle(state.element);
  }

  /**
   * 创建元素快照
   */
  private createElementSnapshot(element: SVGElement): string {
    try {
      return element.svg();
    } catch {
      return '';
    }
  }

  /**
   * 获取元素边界
   */
  private getElementBounds(element: SVGElement): DOMRect {
    try {
      return element.bbox();
    } catch {
      return new DOMRect(0, 0, 0, 0);
    }
  }

  /**
   * 获取元素变换
   */
  private getElementTransform(element: SVGElement): string {
    try {
      const transform = element.transform();
      return JSON.stringify(transform);
    } catch {
      return '';
    }
  }

  /**
   * 获取元素样式
   */
  private getElementStyle(element: SVGElement): Record<string, any> {
    try {
      return {
        fill: element.fill(),
        stroke: element.stroke(),
        opacity: element.opacity(),
        // 添加更多样式属性
      };
    } catch {
      return {};
    }
  }

  /**
   * 比较边界是否相等
   */
  private boundsEqual(a: DOMRect, b: DOMRect): boolean {
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
  }

  /**
   * 比较样式是否相等
   */
  private styleEqual(a: Record<string, any>, b: Record<string, any>): boolean {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (a[key] !== b[key]) return false;
    }
    
    return true;
  }

  /**
   * 添加观察者
   */
  addObserver(callback: (batch: UpdateBatch) => void) {
    this.observers.add(callback);
  }

  /**
   * 移除观察者
   */
  removeObserver(callback: (batch: UpdateBatch) => void) {
    this.observers.delete(callback);
  }

  /**
   * 通知观察者
   */
  private notifyObservers(batch: UpdateBatch) {
    for (const observer of this.observers) {
      try {
        observer(batch);
      } catch (error) {
        console.warn('观察者回调执行失败:', error);
      }
    }
  }

  /**
   * 强制更新所有元素
   */
  forceUpdateAll() {
    for (const [id, state] of this.elements) {
      state.dirty = true;
      this.scheduleUpdate(id);
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalElements: this.elements.size,
      dirtyElements: Array.from(this.elements.values()).filter(s => s.dirty).length,
      queueSize: this.updateQueue.size,
      version: this.version
    };
  }

  /**
   * 清理资源
   */
  dispose() {
    if (this.batchTimeout !== null) {
      clearTimeout(this.batchTimeout);
    }
    
    this.elements.clear();
    this.updateQueue.clear();
    this.observers.clear();
  }
}