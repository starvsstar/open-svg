/**
 * 性能监控系统
 * 用于监控性能指标、错误上报和用户体验追踪
 */

import { globalMemoryManager } from './memory-manager';
import { globalCanvasCache } from './canvas-cache';
import { globalPoolManager } from './object-pool';

export interface PerformanceMetrics {
  // 页面性能指标
  navigationTiming: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
  };
  
  // 资源性能指标
  resourceTiming: {
    totalResources: number;
    slowResources: Array<{
      name: string;
      duration: number;
      size: number;
    }>;
  };
  
  // 内存使用指标
  memoryUsage: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  
  // 渲染性能指标
  renderingMetrics: {
    frameRate: number;
    renderTime: number;
    cacheHitRate: number;
    objectPoolUtilization: number;
  };
  
  // 用户交互指标
  userInteraction: {
    totalInteractions: number;
    averageResponseTime: number;
    slowInteractions: number;
  };
}

export interface ErrorInfo {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  additionalData?: Record<string, any>;
}

export interface UserExperienceMetrics {
  sessionDuration: number;
  pageViews: number;
  interactions: number;
  errors: number;
  performanceScore: number;
  satisfactionLevel: 'good' | 'needs-improvement' | 'poor';
}

export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private errors: ErrorInfo[] = [];
  private interactions: Array<{ type: string; timestamp: number; duration: number }> = [];
  private sessionId: string;
  private startTime: number;
  private observers: Map<string, PerformanceObserver> = new Map();
  private isMonitoring = false;
  private reportingEndpoint?: string;
  private maxErrorsStored = 50;
  private maxInteractionsStored = 100;

  constructor(config: { reportingEndpoint?: string } = {}) {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.reportingEndpoint = config.reportingEndpoint;
    
    this.setupErrorHandling();
    this.setupUnloadHandler();
  }

  /**
   * 开始性能监控
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('开始性能监控...');
    
    this.collectNavigationTiming();
    this.setupPerformanceObservers();
    this.startInteractionTracking();
    this.startMemoryMonitoring();
    this.startRenderingMetrics();
  }

  /**
   * 停止性能监控
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    console.log('停止性能监控');
    
    // 断开所有观察者
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }

  /**
   * 收集导航时间指标
   */
  private collectNavigationTiming(): void {
    if (!('performance' in window)) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    this.metrics.navigationTiming = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      loadComplete: navigation.loadEventEnd - navigation.navigationStart,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0
    };
  }

  /**
   * 设置性能观察者
   */
  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) return;

    // 观察Paint指标
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-paint') {
            this.metrics.navigationTiming!.firstPaint = entry.startTime;
          } else if (entry.name === 'first-contentful-paint') {
            this.metrics.navigationTiming!.firstContentfulPaint = entry.startTime;
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.set('paint', paintObserver);
    } catch (error) {
      console.warn('Paint观察者设置失败:', error);
    }

    // 观察LCP指标
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.navigationTiming!.largestContentfulPaint = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);
    } catch (error) {
      console.warn('LCP观察者设置失败:', error);
    }

    // 观察FID指标
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.navigationTiming!.firstInputDelay = (entry as any).processingStart - entry.startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);
    } catch (error) {
      console.warn('FID观察者设置失败:', error);
    }

    // 观察CLS指标
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            this.metrics.navigationTiming!.cumulativeLayoutShift = clsValue;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);
    } catch (error) {
      console.warn('CLS观察者设置失败:', error);
    }

    // 观察资源加载
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        this.collectResourceTiming(list.getEntries() as PerformanceResourceTiming[]);
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (error) {
      console.warn('资源观察者设置失败:', error);
    }
  }

  /**
   * 收集资源时间指标
   */
  private collectResourceTiming(entries: PerformanceResourceTiming[]): void {
    const slowResources = entries
      .filter(entry => entry.duration > 1000) // 超过1秒的资源
      .map(entry => ({
        name: entry.name,
        duration: entry.duration,
        size: entry.transferSize || 0
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10); // 只保留最慢的10个

    this.metrics.resourceTiming = {
      totalResources: entries.length,
      slowResources
    };
  }

  /**
   * 开始交互追踪
   */
  private startInteractionTracking(): void {
    const interactionTypes = ['click', 'keydown', 'scroll', 'touchstart'];
    
    interactionTypes.forEach(type => {
      document.addEventListener(type, (event) => {
        this.trackInteraction(type, event);
      }, { passive: true });
    });
  }

  /**
   * 追踪用户交互
   */
  private trackInteraction(type: string, event: Event): void {
    const startTime = performance.now();
    
    // 使用requestAnimationFrame来测量响应时间
    requestAnimationFrame(() => {
      const duration = performance.now() - startTime;
      
      this.interactions.push({
        type,
        timestamp: Date.now(),
        duration
      });
      
      // 限制存储的交互数量
      if (this.interactions.length > this.maxInteractionsStored) {
        this.interactions.shift();
      }
    });
  }

  /**
   * 开始内存监控
   */
  private startMemoryMonitoring(): void {
    setInterval(() => {
      this.collectMemoryMetrics();
    }, 5000); // 每5秒收集一次
  }

  /**
   * 收集内存指标
   */
  private collectMemoryMetrics(): void {
    const memoryStats = globalMemoryManager.getLatestMemoryStats();
    if (memoryStats) {
      this.metrics.memoryUsage = {
        usedJSHeapSize: memoryStats.usedJSHeapSize,
        totalJSHeapSize: memoryStats.totalJSHeapSize,
        jsHeapSizeLimit: memoryStats.jsHeapSizeLimit,
        trend: globalMemoryManager.getMemoryTrend()
      };
    }
  }

  /**
   * 开始渲染指标收集
   */
  private startRenderingMetrics(): void {
    setInterval(() => {
      this.collectRenderingMetrics();
    }, 1000); // 每秒收集一次
  }

  /**
   * 收集渲染指标
   */
  private collectRenderingMetrics(): void {
    // 计算帧率
    const frameRate = this.calculateFrameRate();
    
    // 获取缓存命中率
    const cacheStats = globalCanvasCache.getStats();
    const cacheHitRate = cacheStats.hitRate;
    
    // 获取对象池利用率
    const poolStats = globalPoolManager.getAllStats();
    const totalUtilization = Object.values(poolStats)
      .reduce((sum: number, stat: any) => sum + stat.utilizationRate, 0) / Object.keys(poolStats).length;

    this.metrics.renderingMetrics = {
      frameRate,
      renderTime: 0, // 需要在实际渲染时测量
      cacheHitRate,
      objectPoolUtilization: totalUtilization || 0
    };
  }

  /**
   * 计算帧率
   */
  private calculateFrameRate(): number {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const countFrame = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        return fps;
      }
      
      requestAnimationFrame(countFrame);
      return 0;
    };
    
    requestAnimationFrame(countFrame);
    return 60; // 默认返回60fps
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    // 捕获JavaScript错误
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.sessionId
      });
    });

    // 捕获Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.sessionId
      });
    });
  }

  /**
   * 报告错误
   */
  reportError(error: ErrorInfo): void {
    this.errors.push(error);
    
    // 限制存储的错误数量
    if (this.errors.length > this.maxErrorsStored) {
      this.errors.shift();
    }
    
    console.error('性能监控捕获错误:', error);
    
    // 发送到报告端点
    if (this.reportingEndpoint) {
      this.sendErrorReport(error);
    }
  }

  /**
   * 发送错误报告
   */
  private async sendErrorReport(error: ErrorInfo): Promise<void> {
    try {
      await fetch(this.reportingEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'error',
          data: error
        })
      });
    } catch (err) {
      console.warn('发送错误报告失败:', err);
    }
  }

  /**
   * 设置页面卸载处理
   */
  private setupUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      this.sendFinalReport();
    });
    
    // 使用Page Visibility API
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendFinalReport();
      }
    });
  }

  /**
   * 发送最终报告
   */
  private sendFinalReport(): void {
    const report = this.generateReport();
    
    if (this.reportingEndpoint && 'sendBeacon' in navigator) {
      navigator.sendBeacon(
        this.reportingEndpoint,
        JSON.stringify({
          type: 'session-end',
          data: report
        })
      );
    }
  }

  /**
   * 生成性能报告
   */
  generateReport(): {
    metrics: Partial<PerformanceMetrics>;
    userExperience: UserExperienceMetrics;
    errors: ErrorInfo[];
    sessionInfo: {
      sessionId: string;
      duration: number;
      userAgent: string;
      url: string;
    };
  } {
    const sessionDuration = Date.now() - this.startTime;
    
    // 计算用户交互指标
    const totalInteractions = this.interactions.length;
    const averageResponseTime = totalInteractions > 0 
      ? this.interactions.reduce((sum, i) => sum + i.duration, 0) / totalInteractions 
      : 0;
    const slowInteractions = this.interactions.filter(i => i.duration > 100).length;
    
    // 计算性能分数
    const performanceScore = this.calculatePerformanceScore();
    
    // 确定满意度等级
    const satisfactionLevel = this.determineSatisfactionLevel(performanceScore);

    return {
      metrics: this.metrics,
      userExperience: {
        sessionDuration,
        pageViews: 1, // 简化实现
        interactions: totalInteractions,
        errors: this.errors.length,
        performanceScore,
        satisfactionLevel
      },
      errors: this.errors,
      sessionInfo: {
        sessionId: this.sessionId,
        duration: sessionDuration,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };
  }

  /**
   * 计算性能分数
   */
  private calculatePerformanceScore(): number {
    let score = 100;
    
    // 基于LCP评分
    const lcp = this.metrics.navigationTiming?.largestContentfulPaint || 0;
    if (lcp > 4000) score -= 30;
    else if (lcp > 2500) score -= 15;
    
    // 基于FID评分
    const fid = this.metrics.navigationTiming?.firstInputDelay || 0;
    if (fid > 300) score -= 25;
    else if (fid > 100) score -= 10;
    
    // 基于CLS评分
    const cls = this.metrics.navigationTiming?.cumulativeLayoutShift || 0;
    if (cls > 0.25) score -= 25;
    else if (cls > 0.1) score -= 10;
    
    // 基于错误数量评分
    if (this.errors.length > 5) score -= 20;
    else if (this.errors.length > 0) score -= 5;
    
    return Math.max(0, score);
  }

  /**
   * 确定满意度等级
   */
  private determineSatisfactionLevel(score: number): 'good' | 'needs-improvement' | 'poor' {
    if (score >= 80) return 'good';
    if (score >= 60) return 'needs-improvement';
    return 'poor';
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取当前指标
   */
  getCurrentMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * 获取错误列表
   */
  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stopMonitoring();
    this.errors.length = 0;
    this.interactions.length = 0;
  }
}

// 全局性能监控器
export const globalPerformanceMonitor = new PerformanceMonitor({
  reportingEndpoint: process.env.NODE_ENV === 'production' ? '/api/performance' : undefined
});

// 自动启动监控
if (typeof window !== 'undefined') {
  // 等待页面加载完成后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      globalPerformanceMonitor.startMonitoring();
    });
  } else {
    globalPerformanceMonitor.startMonitoring();
  }
}