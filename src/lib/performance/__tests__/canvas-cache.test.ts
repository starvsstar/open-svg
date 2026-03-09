/**
 * Canvas缓存系统单元测试
 * 测试Canvas缓存的功能和性能
 */

import { CanvasCache, globalCanvasCache } from '../canvas-cache';

// 模拟SVG元素
const createMockSVGElement = (complexity = 10) => ({
  getBBox: jest.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
  children: jest.fn(() => Array(complexity).fill({})),
  type: 'rect',
  attr: jest.fn((name) => {
    if (name === 'd') return 'M0,0 L100,100';
    if (name === 'filter') return complexity > 15 ? 'blur(5px)' : null;
    return '';
  }),
  transform: jest.fn(() => ({ rotation: 0, skewX: 0, skewY: 0 })),
  fill: jest.fn(() => complexity > 20 ? { type: 'gradient' } : '#000000'),
  svg: jest.fn(() => '<rect width="100" height="100"/>')
});

// 模拟Canvas
const createMockCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  return canvas;
};

describe('CanvasCache', () => {
  let cache: CanvasCache;
  let mockElement: any;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    cache = new CanvasCache({
      maxSize: 5,
      maxAge: 1000,
      complexityThreshold: 5,
      enableLRU: true
    });
    
    mockElement = createMockSVGElement(10);
    mockCanvas = createMockCanvas();
    
    // 模拟Canvas上下文
    const mockCtx = {
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4),
        width: 100,
        height: 100
      })),
      drawImage: jest.fn()
    };
    
    jest.spyOn(mockCanvas, 'getContext').mockReturnValue(mockCtx as any);
  });

  afterEach(() => {
    cache.dispose();
    jest.clearAllMocks();
  });

  describe('基本功能', () => {
    it('应该能够设置缓存项', () => {
      const result = cache.set('test-id', mockElement, mockCanvas);
      
      expect(result).toBe(true);
      expect(cache.has('test-id')).toBe(true);
      expect(cache.size()).toBe(1);
    });

    it('应该能够获取缓存项', () => {
      cache.set('test-id', mockElement, mockCanvas);
      
      const entry = cache.get('test-id');
      
      expect(entry).not.toBeNull();
      expect(entry!.id).toBe('test-id');
      expect(entry!.accessCount).toBe(1);
    });

    it('应该在获取时更新访问信息', () => {
      cache.set('test-id', mockElement, mockCanvas);
      
      const entry1 = cache.get('test-id');
      const entry2 = cache.get('test-id');
      
      expect(entry2!.accessCount).toBe(2);
      expect(entry2!.lastAccess).toBeGreaterThan(entry1!.lastAccess);
    });

    it('应该能够删除缓存项', () => {
      cache.set('test-id', mockElement, mockCanvas);
      
      const deleted = cache.delete('test-id');
      
      expect(deleted).toBe(true);
      expect(cache.has('test-id')).toBe(false);
      expect(cache.size()).toBe(0);
    });

    it('应该能够清空所有缓存', () => {
      cache.set('test-1', mockElement, mockCanvas);
      cache.set('test-2', mockElement, mockCanvas);
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.has('test-1')).toBe(false);
      expect(cache.has('test-2')).toBe(false);
    });
  });

  describe('复杂度计算', () => {
    it('应该正确计算简单元素的复杂度', () => {
      const simpleElement = createMockSVGElement(2);
      
      const result = cache.set('simple', simpleElement, mockCanvas);
      
      // 复杂度太低，不应该被缓存
      expect(result).toBe(false);
    });

    it('应该正确计算复杂元素的复杂度', () => {
      const complexElement = createMockSVGElement(20);
      
      const result = cache.set('complex', complexElement, mockCanvas);
      
      // 复杂度足够，应该被缓存
      expect(result).toBe(true);
    });

    it('应该为路径元素增加复杂度', () => {
      const pathElement = createMockSVGElement(3);
      pathElement.type = 'path';
      pathElement.attr = jest.fn((name) => {
        if (name === 'd') return 'M0,0 L100,100 Q50,50 100,0 Z'.repeat(10);
        return '';
      });
      
      const result = cache.set('path', pathElement, mockCanvas);
      
      expect(result).toBe(true);
    });

    it('应该为有滤镜的元素增加复杂度', () => {
      const filterElement = createMockSVGElement(3);
      filterElement.attr = jest.fn((name) => {
        if (name === 'filter') return 'blur(5px)';
        return '';
      });
      
      const result = cache.set('filter', filterElement, mockCanvas);
      
      expect(result).toBe(true);
    });
  });

  describe('缓存大小限制', () => {
    it('应该在达到最大大小时驱逐最少使用的项', () => {
      // 填满缓存
      for (let i = 0; i < 5; i++) {
        const element = createMockSVGElement(10);
        cache.set(`item-${i}`, element, mockCanvas);
      }
      
      expect(cache.size()).toBe(5);
      
      // 访问某些项以改变LRU顺序
      cache.get('item-1');
      cache.get('item-3');
      
      // 添加新项，应该驱逐最少使用的项
      const newElement = createMockSVGElement(10);
      cache.set('new-item', newElement, mockCanvas);
      
      expect(cache.size()).toBe(5);
      expect(cache.has('new-item')).toBe(true);
      
      // item-0应该被驱逐（最少使用）
      expect(cache.has('item-0')).toBe(false);
    });
  });

  describe('过期处理', () => {
    it('应该返回null对于过期的缓存项', async () => {
      const shortCache = new CanvasCache({
        maxSize: 5,
        maxAge: 50, // 50ms
        complexityThreshold: 5
      });
      
      const element = createMockSVGElement(10);
      shortCache.set('test', element, mockCanvas);
      
      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const entry = shortCache.get('test');
      expect(entry).toBeNull();
      
      shortCache.dispose();
    });
  });

  describe('渲染功能', () => {
    it('应该能够渲染缓存的元素', () => {
      cache.set('test', mockElement, mockCanvas);
      
      const targetCanvas = createMockCanvas();
      const targetCtx = targetCanvas.getContext('2d')!;
      
      const result = cache.render('test', targetCtx, 10, 20, 2);
      
      expect(result).toBe(true);
      expect(targetCtx.save).toHaveBeenCalled();
      expect(targetCtx.scale).toHaveBeenCalledWith(2, 2);
      expect(targetCtx.drawImage).toHaveBeenCalled();
      expect(targetCtx.restore).toHaveBeenCalled();
    });

    it('应该在缓存未命中时返回false', () => {
      const targetCanvas = createMockCanvas();
      const targetCtx = targetCanvas.getContext('2d')!;
      
      const result = cache.render('non-existent', targetCtx, 0, 0);
      
      expect(result).toBe(false);
    });
  });

  describe('预加载功能', () => {
    it('应该能够预加载元素列表', async () => {
      const elements = [
        { id: 'elem-1', element: createMockSVGElement(10) },
        { id: 'elem-2', element: createMockSVGElement(15) },
        { id: 'elem-3', element: createMockSVGElement(20) }
      ];
      
      await cache.preload(elements);
      
      expect(cache.has('elem-1')).toBe(true);
      expect(cache.has('elem-2')).toBe(true);
      expect(cache.has('elem-3')).toBe(true);
      expect(cache.size()).toBe(3);
    });
  });

  describe('统计信息', () => {
    it('应该提供准确的统计信息', () => {
      // 添加一些缓存项
      cache.set('item-1', mockElement, mockCanvas);
      cache.set('item-2', mockElement, mockCanvas);
      
      // 访问一些项
      cache.get('item-1');
      cache.get('item-1');
      cache.get('item-2');
      
      // 尝试获取不存在的项
      cache.get('non-existent');
      
      const stats = cache.getStats();
      
      expect(stats.totalSize).toBe(2);
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.75, 2);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('应该正确估算内存使用量', () => {
      cache.set('item-1', mockElement, mockCanvas);
      
      const stats = cache.getStats();
      
      // 应该包含ImageData和Canvas的内存使用
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('错误处理', () => {
    it('应该处理Canvas上下文获取失败', () => {
      const badCanvas = createMockCanvas();
      jest.spyOn(badCanvas, 'getContext').mockReturnValue(null);
      
      const result = cache.set('bad', mockElement, badCanvas);
      
      expect(result).toBe(false);
    });

    it('应该处理渲染错误', () => {
      cache.set('test', mockElement, mockCanvas);
      
      const targetCanvas = createMockCanvas();
      const targetCtx = targetCanvas.getContext('2d')!;
      
      // 模拟drawImage抛出错误
      jest.spyOn(targetCtx, 'drawImage').mockImplementation(() => {
        throw new Error('渲染失败');
      });
      
      const result = cache.render('test', targetCtx, 0, 0);
      
      expect(result).toBe(false);
    });
  });
});

describe('全局Canvas缓存', () => {
  afterEach(() => {
    globalCanvasCache.clear();
  });

  it('应该提供全局缓存实例', () => {
    expect(globalCanvasCache).toBeInstanceOf(CanvasCache);
  });

  it('应该能够在全局缓存中存储和检索项', () => {
    const element = createMockSVGElement(15);
    const canvas = createMockCanvas();
    
    const result = globalCanvasCache.set('global-test', element, canvas);
    
    expect(result).toBe(true);
    expect(globalCanvasCache.has('global-test')).toBe(true);
    
    const entry = globalCanvasCache.get('global-test');
    expect(entry).not.toBeNull();
  });
});

describe('性能测试', () => {
  let cache: CanvasCache;
  
  beforeEach(() => {
    cache = new CanvasCache({
      maxSize: 100,
      maxAge: 10000,
      complexityThreshold: 5
    });
  });
  
  afterEach(() => {
    cache.dispose();
  });

  it('缓存命中应该比重新渲染更快', () => {
    const element = createMockSVGElement(20);
    const canvas = createMockCanvas();
    const targetCanvas = createMockCanvas();
    const targetCtx = targetCanvas.getContext('2d')!;
    
    // 首次渲染（缓存未命中）
    cache.set('perf-test', element, canvas);
    
    const iterations = 100;
    
    // 测试缓存命中性能
    const cacheStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      cache.render('perf-test', targetCtx, 0, 0);
    }
    const cacheTime = performance.now() - cacheStart;
    
    console.log(`缓存渲染 ${iterations} 次: ${cacheTime}ms`);
    
    // 缓存渲染应该很快
    expect(cacheTime).toBeLessThan(100); // 应该在100ms内完成
  });

  it('应该能够处理大量缓存项', () => {
    const count = 50;
    const elements: any[] = [];
    
    // 创建大量缓存项
    const start = performance.now();
    for (let i = 0; i < count; i++) {
      const element = createMockSVGElement(10 + i % 10);
      const canvas = createMockCanvas();
      elements.push({ id: `item-${i}`, element, canvas });
      
      cache.set(`item-${i}`, element, canvas);
    }
    const createTime = performance.now() - start;
    
    console.log(`创建 ${count} 个缓存项: ${createTime}ms`);
    
    // 测试随机访问性能
    const accessStart = performance.now();
    for (let i = 0; i < count * 2; i++) {
      const randomId = `item-${Math.floor(Math.random() * count)}`;
      cache.get(randomId);
    }
    const accessTime = performance.now() - accessStart;
    
    console.log(`随机访问 ${count * 2} 次: ${accessTime}ms`);
    
    expect(cache.size()).toBeLessThanOrEqual(cache['options'].maxSize);
    expect(accessTime).toBeLessThan(50); // 访问应该很快
  });
});