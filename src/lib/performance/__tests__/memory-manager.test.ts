/**
 * 内存管理器单元测试
 * 测试内存监控、事件监听器管理和资源管理功能
 */

import { MemoryManager, globalMemoryManager } from '../memory-manager';

// 模拟performance.memory
const mockMemory = {
  usedJSHeapSize: 1000000,
  totalJSHeapSize: 2000000,
  jsHeapSizeLimit: 4000000
};

Object.defineProperty(performance, 'memory', {
  value: mockMemory,
  writable: true
});

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;
  let mockElement: HTMLElement;

  beforeEach(() => {
    memoryManager = new MemoryManager();
    mockElement = document.createElement('div');
    
    // 重置模拟的内存值
    mockMemory.usedJSHeapSize = 1000000;
    mockMemory.totalJSHeapSize = 2000000;
    mockMemory.jsHeapSizeLimit = 4000000;
    
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    memoryManager.dispose();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('内存监控', () => {
    it('应该能够开始和停止监控', () => {
      expect(memoryManager['isMonitoring']).toBe(false);
      
      memoryManager.startMonitoring();
      expect(memoryManager['isMonitoring']).toBe(true);
      
      memoryManager.stopMonitoring();
      expect(memoryManager['isMonitoring']).toBe(false);
    });

    it('应该定期收集内存统计信息', () => {
      memoryManager.startMonitoring();
      
      // 快进时间以触发内存收集
      jest.advanceTimersByTime(5000);
      
      const stats = memoryManager.getLatestMemoryStats();
      expect(stats).not.toBeNull();
      expect(stats!.usedJSHeapSize).toBe(1000000);
      expect(stats!.totalJSHeapSize).toBe(2000000);
      expect(stats!.jsHeapSizeLimit).toBe(4000000);
    });

    it('应该检测内存压力并触发清理', () => {
      const cleanupSpy = jest.spyOn(memoryManager as any, 'triggerCleanup');
      
      // 设置高内存使用率
      mockMemory.usedJSHeapSize = 3500000; // 87.5%
      
      memoryManager.startMonitoring();
      jest.advanceTimersByTime(5000);
      
      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('应该正确计算内存使用趋势', () => {
      memoryManager.startMonitoring();
      
      // 模拟内存增长
      mockMemory.usedJSHeapSize = 1000000;
      jest.advanceTimersByTime(5000);
      
      mockMemory.usedJSHeapSize = 1200000;
      jest.advanceTimersByTime(5000);
      
      mockMemory.usedJSHeapSize = 1400000;
      jest.advanceTimersByTime(5000);
      
      const trend = memoryManager.getMemoryTrend();
      expect(trend).toBe('increasing');
    });
  });

  describe('事件监听器管理', () => {
    it('应该能够注册事件监听器', () => {
      const listener = jest.fn();
      
      const id = memoryManager.addEventListener(mockElement, 'click', listener);
      
      expect(id).toBeDefined();
      expect(memoryManager['eventListeners'].has(id)).toBe(true);
      
      // 触发事件验证监听器已注册
      mockElement.click();
      expect(listener).toHaveBeenCalled();
    });

    it('应该能够移除事件监听器', () => {
      const listener = jest.fn();
      
      const id = memoryManager.addEventListener(mockElement, 'click', listener);
      const removed = memoryManager.removeEventListener(id);
      
      expect(removed).toBe(true);
      expect(memoryManager['eventListeners'].has(id)).toBe(false);
      
      // 触发事件验证监听器已移除
      mockElement.click();
      expect(listener).not.toHaveBeenCalled();
    });

    it('应该清理过期的事件监听器', () => {
      const listener = jest.fn();
      
      const id = memoryManager.addEventListener(mockElement, 'click', listener);
      
      // 模拟时间过去
      jest.advanceTimersByTime(31 * 60 * 1000); // 31分钟
      
      expect(memoryManager['eventListeners'].has(id)).toBe(false);
    });

    it('应该提供事件监听器统计信息', () => {
      memoryManager.addEventListener(mockElement, 'click', jest.fn());
      memoryManager.addEventListener(mockElement, 'mouseover', jest.fn());
      memoryManager.addEventListener(window, 'resize', jest.fn());
      
      const stats = memoryManager.getEventListenerStats();
      
      expect(stats.total).toBe(3);
      expect(stats.byType.click).toBe(1);
      expect(stats.byType.mouseover).toBe(1);
      expect(stats.byType.resize).toBe(1);
      expect(stats.byElement.DIV).toBe(2);
      expect(stats.byElement.window).toBe(1);
    });
  });

  describe('资源管理', () => {
    it('应该能够注册资源', () => {
      memoryManager.registerResource('test-resource', 'image', 1024);
      
      const stats = memoryManager.getResourceStats();
      expect(stats.total).toBe(1);
      expect(stats.byType.image).toBe(1);
      expect(stats.totalSize).toBe(1024);
    });

    it('应该能够访问资源并更新统计', () => {
      memoryManager.registerResource('test-resource', 'image', 1024);
      
      const resource = memoryManager['resources'].get('test-resource');
      const initialAccessCount = resource!.accessCount;
      
      memoryManager.accessResource('test-resource');
      
      const updatedResource = memoryManager['resources'].get('test-resource');
      expect(updatedResource!.accessCount).toBe(initialAccessCount + 1);
      expect(updatedResource!.lastAccessed).toBeGreaterThan(resource!.lastAccessed);
    });

    it('应该能够移除资源', () => {
      memoryManager.registerResource('test-resource', 'image', 1024);
      
      const removed = memoryManager.removeResource('test-resource');
      
      expect(removed).toBe(true);
      expect(memoryManager['resources'].has('test-resource')).toBe(false);
    });

    it('应该清理过期资源', () => {
      memoryManager.registerResource('test-resource', 'image', 1024);
      
      // 模拟时间过去
      jest.advanceTimersByTime(11 * 60 * 1000); // 11分钟
      
      expect(memoryManager['resources'].has('test-resource')).toBe(false);
    });

    it('应该提供资源统计信息', () => {
      memoryManager.registerResource('image-1', 'image', 1024);
      memoryManager.registerResource('blob-1', 'blob', 2048);
      memoryManager.registerResource('canvas-1', 'canvas', 4096);
      
      // 访问一些资源
      memoryManager.accessResource('image-1');
      memoryManager.accessResource('image-1');
      memoryManager.accessResource('blob-1');
      
      const stats = memoryManager.getResourceStats();
      
      expect(stats.total).toBe(3);
      expect(stats.byType.image).toBe(1);
      expect(stats.byType.blob).toBe(1);
      expect(stats.byType.canvas).toBe(1);
      expect(stats.totalSize).toBe(7168);
      expect(stats.mostAccessedResource?.id).toBe('image-1');
    });
  });

  describe('清理功能', () => {
    it('应该能够强制清理所有资源', () => {
      // 添加一些资源
      memoryManager.addEventListener(mockElement, 'click', jest.fn());
      memoryManager.registerResource('test-resource', 'image', 1024);
      
      memoryManager.forceCleanup();
      
      expect(memoryManager['eventListeners'].size).toBe(0);
      expect(memoryManager['resources'].size).toBe(0);
      expect(memoryManager['memoryHistory'].length).toBe(0);
    });

    it('应该正确清理不同类型的资源', () => {
      const urlSpy = jest.spyOn(URL, 'revokeObjectURL');
      
      memoryManager.registerResource('blob://test-url', 'url', 0);
      memoryManager.registerResource('test-blob', 'blob', 1024);
      
      // 触发清理
      memoryManager['cleanupResource']('blob://test-url');
      
      expect(urlSpy).toHaveBeenCalledWith('blob://test-url');
    });
  });

  describe('统计和报告', () => {
    it('应该提供完整的统计信息', () => {
      memoryManager.startMonitoring();
      memoryManager.addEventListener(mockElement, 'click', jest.fn());
      memoryManager.registerResource('test-resource', 'image', 1024);
      
      jest.advanceTimersByTime(5000);
      
      const stats = memoryManager.getFullStats();
      
      expect(stats.memory).not.toBeNull();
      expect(stats.memoryTrend).toBeDefined();
      expect(stats.resources).toBeDefined();
      expect(stats.eventListeners).toBeDefined();
      expect(stats.objectPools).toBeDefined();
    });

    it('应该正确获取内存历史', () => {
      memoryManager.startMonitoring();
      
      jest.advanceTimersByTime(5000);
      jest.advanceTimersByTime(5000);
      jest.advanceTimersByTime(5000);
      
      const history = memoryManager.getMemoryHistory();
      expect(history.length).toBe(3);
      
      // 验证历史记录的时间戳是递增的
      for (let i = 1; i < history.length; i++) {
        expect(history[i].timestamp).toBeGreaterThan(history[i - 1].timestamp);
      }
    });
  });

  describe('错误处理', () => {
    it('应该处理不存在的事件监听器移除', () => {
      const removed = memoryManager.removeEventListener('non-existent');
      expect(removed).toBe(false);
    });

    it('应该处理不存在的资源访问', () => {
      // 不应该抛出错误
      expect(() => {
        memoryManager.accessResource('non-existent');
      }).not.toThrow();
    });

    it('应该处理资源清理错误', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // 模拟清理错误
      jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {
        throw new Error('清理失败');
      });
      
      memoryManager.registerResource('bad-url', 'url', 0);
      memoryManager['cleanupResource']('bad-url');
      
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});

describe('全局内存管理器', () => {
  it('应该提供全局实例', () => {
    expect(globalMemoryManager).toBeInstanceOf(MemoryManager);
  });

  it('应该在页面卸载时清理资源', () => {
    const disposeSpy = jest.spyOn(globalMemoryManager, 'dispose');
    
    // 模拟页面卸载事件
    const event = new Event('beforeunload');
    window.dispatchEvent(event);
    
    expect(disposeSpy).toHaveBeenCalled();
  });
});

describe('性能测试', () => {
  let memoryManager: MemoryManager;
  
  beforeEach(() => {
    memoryManager = new MemoryManager();
    jest.useRealTimers(); // 使用真实定时器进行性能测试
  });
  
  afterEach(() => {
    memoryManager.dispose();
  });

  it('应该能够高效处理大量事件监听器', () => {
    const count = 1000;
    const elements: HTMLElement[] = [];
    const listeners: string[] = [];
    
    // 创建大量元素和监听器
    const start = performance.now();
    for (let i = 0; i < count; i++) {
      const element = document.createElement('div');
      elements.push(element);
      
      const id = memoryManager.addEventListener(element, 'click', jest.fn());
      listeners.push(id);
    }
    const createTime = performance.now() - start;
    
    expect(createTime).toBeGreaterThan(0);
    
    // 移除所有监听器
    const removeStart = performance.now();
    for (const id of listeners) {
      memoryManager.removeEventListener(id);
    }
    const removeTime = performance.now() - removeStart;
    
    expect(removeTime).toBeGreaterThan(0);
    
    expect(createTime).toBeLessThan(100);
    expect(removeTime).toBeLessThan(50);
    expect(memoryManager['eventListeners'].size).toBe(0);
  });

  it('应该能够高效处理大量资源', () => {
    const count = 1000;
    
    // 注册大量资源
    const start = performance.now();
    for (let i = 0; i < count; i++) {
      memoryManager.registerResource(`resource-${i}`, 'image', 1024);
    }
    const registerTime = performance.now() - start;
    
    expect(registerTime).toBeGreaterThan(0);
    
    // 访问所有资源
    const accessStart = performance.now();
    for (let i = 0; i < count; i++) {
      memoryManager.accessResource(`resource-${i}`);
    }
    const accessTime = performance.now() - accessStart;
    
    expect(accessTime).toBeGreaterThan(0);
    
    // 获取统计信息
    const statsStart = performance.now();
    const stats = memoryManager.getResourceStats();
    const statsTime = performance.now() - statsStart;
    
    expect(statsTime).toBeGreaterThan(0);
    
    expect(registerTime).toBeLessThan(100);
    expect(accessTime).toBeLessThan(50);
    expect(statsTime).toBeLessThan(10);
    expect(stats.total).toBe(count);
  });

  it('内存监控应该有最小的性能开销', async () => {
    const iterations = 100;
    
    // 测试不监控时的性能
    const noMonitorStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      // 模拟一些工作
      const work = Math.random() * 1000;
      expect(work).toBeGreaterThanOrEqual(0);
    }
    const noMonitorTime = performance.now() - noMonitorStart;
    
    // 测试监控时的性能
    memoryManager.startMonitoring();
    const monitorStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      // 模拟一些工作
      const work = Math.random() * 1000;
      expect(work).toBeGreaterThanOrEqual(0);
    }
    const monitorTime = performance.now() - monitorStart;
    
    console.log(`无监控: ${noMonitorTime}ms, 有监控: ${monitorTime}ms`);
    
    // 监控的开销应该很小
    expect(monitorTime).toBeLessThan(noMonitorTime * 1.5);
  });
});