import { performance } from 'perf_hooks';
import { VirtualRenderer } from '../../src/lib/performance/virtual-renderer';
import { CanvasCache } from '../../src/lib/performance/canvas-cache';
import { ObjectPool, PooledPoint, PooledRect } from '../../src/lib/performance/object-pool';
import { MemoryManager } from '../../src/lib/performance/memory-manager';
import { IncrementalUpdater } from '../../src/lib/performance/incremental-updater';

// Performance test utilities
class PerformanceTestUtils {
  static async measureTime<T>(fn: () => Promise<T> | T): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, duration: end - start };
  }

  static async measureMemory<T>(fn: () => Promise<T> | T): Promise<{ result: T; memoryUsed: number }> {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const startMemory = (performance as any).memory.usedJSHeapSize;
      const result = await fn();
      const endMemory = (performance as any).memory.usedJSHeapSize;
      return { result, memoryUsed: endMemory - startMemory };
    }
    
    // Fallback for environments without memory API
    const result = await fn();
    return { result, memoryUsed: 0 };
  }

  static createMockSVGElements(count: number): SVGElement[] {
    const elements: SVGElement[] = [];
    for (let i = 0; i < count; i++) {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      element.setAttribute('x', (i % 10 * 50).toString());
      element.setAttribute('y', (Math.floor(i / 10) * 50).toString());
      element.setAttribute('width', '40');
      element.setAttribute('height', '40');
      element.setAttribute('fill', `hsl(${i * 10 % 360}, 70%, 50%)`);
      elements.push(element);
    }
    return elements;
  }

  static createComplexSVGPath(): SVGPathElement {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let d = 'M0,0';
    for (let i = 0; i < 1000; i++) {
      const x = i * 2;
      const y = Math.sin(i * 0.1) * 50 + 100;
      d += ` L${x},${y}`;
    }
    path.setAttribute('d', d);
    path.setAttribute('stroke', 'blue');
    path.setAttribute('fill', 'none');
    return path;
  }
}

describe('Performance Benchmarks', () => {
  describe('Virtual Renderer Performance', () => {
    let renderer: VirtualRenderer;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
      mockCanvas = document.createElement('canvas');
      mockCanvas.width = 1000;
      mockCanvas.height = 800;
      renderer = new VirtualRenderer(mockCanvas);
    });

    afterEach(() => {
      renderer.dispose();
    });

    test('should handle large number of elements efficiently', async () => {
      const elementCounts = [100, 500, 1000, 2000];
      const results: Array<{ count: number; duration: number; memoryUsed: number }> = [];

      for (const count of elementCounts) {
        const elements = PerformanceTestUtils.createMockSVGElements(count);
        
        const { duration, memoryUsed } = await PerformanceTestUtils.measureMemory(async () => {
          const { duration } = await PerformanceTestUtils.measureTime(async () => {
            await renderer.initialize();
            
            elements.forEach((element, index) => {
              renderer.addItem({
                id: `element-${index}`,
                element,
                bounds: {
                  x: parseFloat(element.getAttribute('x') || '0'),
                  y: parseFloat(element.getAttribute('y') || '0'),
                  width: parseFloat(element.getAttribute('width') || '0'),
                  height: parseFloat(element.getAttribute('height') || '0')
                },
                zIndex: index,
                visible: true
              });
            });
            
            await renderer.render();
          });
          return duration;
        });

        results.push({ count, duration, memoryUsed });
        
        // Performance expectations
        expect(duration).toBeLessThan(count * 0.1); // Should be sub-linear
        console.log(`Virtual Renderer - ${count} elements: ${duration.toFixed(2)}ms, Memory: ${memoryUsed} bytes`);
      }

      // Verify performance scales reasonably
      const scalingFactor = results[results.length - 1].duration / results[0].duration;
      expect(scalingFactor).toBeLessThan(elementCounts[elementCounts.length - 1] / elementCounts[0]);
    });

    test('should optimize viewport culling', async () => {
      const totalElements = 10000;
      const elements = PerformanceTestUtils.createMockSVGElements(totalElements);
      
      await renderer.initialize();
      
      elements.forEach((element, index) => {
        renderer.addItem({
          id: `element-${index}`,
          element,
          bounds: {
            x: parseFloat(element.getAttribute('x') || '0'),
            y: parseFloat(element.getAttribute('y') || '0'),
            width: parseFloat(element.getAttribute('width') || '0'),
            height: parseFloat(element.getAttribute('height') || '0')
          },
          zIndex: index,
          visible: true
        });
      });

      // Test small viewport (should render fewer elements)
      const { duration: smallViewportDuration } = await PerformanceTestUtils.measureTime(async () => {
        renderer.updateViewport({ x: 0, y: 0, width: 200, height: 200, zoom: 1 });
        await renderer.render();
      });

      // Test large viewport (should render more elements)
      const { duration: largeViewportDuration } = await PerformanceTestUtils.measureTime(async () => {
        renderer.updateViewport({ x: 0, y: 0, width: 2000, height: 2000, zoom: 1 });
        await renderer.render();
      });

      // Small viewport should be significantly faster
      expect(smallViewportDuration).toBeLessThan(largeViewportDuration * 0.5);
      console.log(`Viewport culling - Small: ${smallViewportDuration.toFixed(2)}ms, Large: ${largeViewportDuration.toFixed(2)}ms`);
    });
  });

  describe('Canvas Cache Performance', () => {
    let cache: CanvasCache;

    beforeEach(() => {
      cache = new CanvasCache({ maxSize: 100, maxAge: 60000 });
    });

    test('should improve rendering performance for cached elements', async () => {
      const complexPath = PerformanceTestUtils.createComplexSVGPath();
      const cacheKey = 'complex-path';

      // First render (cache miss)
      const { duration: missTime } = await PerformanceTestUtils.measureTime(async () => {
        const cached = cache.get(cacheKey);
        if (!cached) {
          // Simulate complex rendering
          await new Promise(resolve => setTimeout(resolve, 10));
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          cache.set(cacheKey, canvas, complexPath);
        }
      });

      // Second render (cache hit)
      const { duration: hitTime } = await PerformanceTestUtils.measureTime(async () => {
        const cached = cache.get(cacheKey);
        expect(cached).toBeTruthy();
      });

      // Cache hit should be significantly faster
      expect(hitTime).toBeLessThan(missTime * 0.1);
      console.log(`Cache performance - Miss: ${missTime.toFixed(2)}ms, Hit: ${hitTime.toFixed(2)}ms`);

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    test('should handle cache eviction efficiently', async () => {
      const cacheSize = 50;
      const cache = new CanvasCache({ maxSize: cacheSize, maxAge: 60000 });

      const { duration } = await PerformanceTestUtils.measureTime(async () => {
        // Fill cache beyond capacity
        for (let i = 0; i < cacheSize * 2; i++) {
          const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          const canvas = document.createElement('canvas');
          cache.set(`element-${i}`, canvas, element);
        }
      });

      const stats = cache.getStats();
      expect(stats.size).toBeLessThanOrEqual(cacheSize);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      console.log(`Cache eviction - ${cacheSize * 2} items in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Object Pool Performance', () => {
    test('should reduce garbage collection pressure', async () => {
      const iterations = 10000;
      
      // Test without object pool
      const { duration: withoutPoolDuration, memoryUsed: withoutPoolMemory } = 
        await PerformanceTestUtils.measureMemory(async () => {
          const { duration } = await PerformanceTestUtils.measureTime(() => {
            const points: Array<{ x: number; y: number }> = [];
            for (let i = 0; i < iterations; i++) {
              points.push({ x: i, y: i * 2 });
            }
            return points;
          });
          return duration;
        });

      // Test with object pool
      const pointPool = new ObjectPool(() => new PooledPoint(), 100);
      const { duration: withPoolDuration, memoryUsed: withPoolMemory } = 
        await PerformanceTestUtils.measureMemory(async () => {
          const { duration } = await PerformanceTestUtils.measureTime(() => {
            const points: PooledPoint[] = [];
            for (let i = 0; i < iterations; i++) {
              const point = pointPool.borrow();
              point.set(i, i * 2);
              points.push(point);
            }
            // Return all points to pool
            points.forEach(point => pointPool.return(point));
            return points;
          });
          return duration;
        });

      console.log(`Object Pool - Without: ${withoutPoolDuration.toFixed(2)}ms (${withoutPoolMemory} bytes)`);
      console.log(`Object Pool - With: ${withPoolDuration.toFixed(2)}ms (${withPoolMemory} bytes)`);

      // Pool should use less memory for large numbers of objects
      if (withoutPoolMemory > 0 && withPoolMemory > 0) {
        expect(withPoolMemory).toBeLessThan(withoutPoolMemory);
      }
    });

    test('should maintain performance under high allocation rates', async () => {
      const rectPool = new ObjectPool(() => new PooledRect(), 50);
      const allocationsPerSecond = 1000;
      const testDuration = 1000; // 1 second
      
      const { duration } = await PerformanceTestUtils.measureTime(async () => {
        const startTime = performance.now();
        let allocations = 0;
        
        while (performance.now() - startTime < testDuration) {
          const rect = rectPool.borrow();
          rect.set(allocations, allocations, 100, 100);
          rectPool.return(rect);
          allocations++;
          
          // Small delay to control allocation rate
          if (allocations % 100 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
        
        return allocations;
      });

      const actualRate = duration > 0 ? (allocationsPerSecond * testDuration) / duration : 0;
      console.log(`Pool allocation rate: ${actualRate.toFixed(0)} allocations/second`);
      
      // Should maintain reasonable performance
      expect(duration).toBeLessThan(testDuration * 2);
    });
  });

  describe('Memory Manager Performance', () => {
    let memoryManager: MemoryManager;

    beforeEach(() => {
      memoryManager = new MemoryManager();
    });

    afterEach(() => {
      memoryManager.dispose();
    });

    test('should efficiently manage large numbers of event listeners', async () => {
      const listenerCount = 1000;
      
      const { duration } = await PerformanceTestUtils.measureTime(() => {
        // Add many event listeners
        for (let i = 0; i < listenerCount; i++) {
          const element = document.createElement('div');
          const listener = () => console.log(`Event ${i}`);
          memoryManager.addEventListener(element, 'click', listener);
        }
      });

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      
      const stats = memoryManager.getEventListenerStats();
      expect(stats.total).toBe(listenerCount);
      
      // Test cleanup performance
      const { duration: cleanupDuration } = await PerformanceTestUtils.measureTime(() => {
        memoryManager.cleanupEventListeners();
      });
      
      expect(cleanupDuration).toBeLessThan(500); // Cleanup should be fast
      console.log(`Event listeners - Add: ${duration.toFixed(2)}ms, Cleanup: ${cleanupDuration.toFixed(2)}ms`);
    });

    test('should monitor memory usage efficiently', async () => {
      const monitoringDuration = 1000; // 1 second
      
      memoryManager.startMonitoring(100); // Monitor every 100ms
      
      // Simulate memory-intensive operations
      const { duration } = await PerformanceTestUtils.measureTime(async () => {
        const arrays: number[][] = [];
        const startTime = performance.now();
        
        while (performance.now() - startTime < monitoringDuration) {
          arrays.push(new Array(1000).fill(Math.random()));
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        return arrays;
      });

      memoryManager.stopMonitoring();
      
      const stats = memoryManager.getStats();
      expect(stats.memoryStats.samples).toBeGreaterThan(5); // Should have collected samples
      
      console.log(`Memory monitoring - Duration: ${duration.toFixed(2)}ms, Samples: ${stats.memoryStats.samples}`);
    });
  });

  describe('Incremental Updater Performance', () => {
    let updater: IncrementalUpdater;
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
      updater = new IncrementalUpdater(container);
    });

    afterEach(() => {
      updater.dispose();
      document.body.removeChild(container);
    });

    test('should efficiently track changes in large DOM trees', async () => {
      const elementCount = 1000;
      
      // Create large DOM tree
      const { duration: creationDuration } = await PerformanceTestUtils.measureTime(() => {
        for (let i = 0; i < elementCount; i++) {
          const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          element.setAttribute('id', `rect-${i}`);
          container.appendChild(element);
        }
      });

      // Initialize updater
      await updater.initialize();
      
      let updateCount = 0;
      updater.addObserver((batch) => {
        updateCount += batch.added.length + batch.modified.length + batch.removed.length;
      });

      // Make changes to DOM
      const { duration: updateDuration } = await PerformanceTestUtils.measureTime(async () => {
        // Modify some elements
        for (let i = 0; i < 100; i++) {
          const element = container.querySelector(`#rect-${i}`);
          if (element) {
            element.setAttribute('fill', 'red');
          }
        }
        
        // Wait for updates to be processed
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(updateCount).toBeGreaterThan(0);
      expect(creationDuration).toBeLessThan(2000);
      expect(updateDuration).toBeLessThan(1000);
      
      console.log(`Incremental updates - Creation: ${creationDuration.toFixed(2)}ms, Updates: ${updateDuration.toFixed(2)}ms`);
    });
  });

  describe('Overall System Performance', () => {
    test('should maintain performance under combined load', async () => {
      const virtualRenderer = new VirtualRenderer(document.createElement('canvas'));
      const canvasCache = new CanvasCache({ maxSize: 50, maxAge: 30000 });
      const memoryManager = new MemoryManager();
      
      try {
        const { duration, memoryUsed } = await PerformanceTestUtils.measureMemory(async () => {
          const { duration } = await PerformanceTestUtils.measureTime(async () => {
            // Initialize all systems
            await virtualRenderer.initialize();
            memoryManager.startMonitoring(200);
            
            // Create and render many elements
            const elements = PerformanceTestUtils.createMockSVGElements(500);
            
            elements.forEach((element, index) => {
              virtualRenderer.addItem({
                id: `element-${index}`,
                element,
                bounds: {
                  x: parseFloat(element.getAttribute('x') || '0'),
                  y: parseFloat(element.getAttribute('y') || '0'),
                  width: parseFloat(element.getAttribute('width') || '0'),
                  height: parseFloat(element.getAttribute('height') || '0')
                },
                zIndex: index,
                visible: true
              });
              
              // Cache some elements
              if (index % 10 === 0) {
                const canvas = document.createElement('canvas');
                canvasCache.set(`cached-${index}`, canvas, element);
              }
            });
            
            // Render multiple times
            for (let i = 0; i < 10; i++) {
              await virtualRenderer.render();
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          });
          return duration;
        });

        // System should handle combined load efficiently
        expect(duration).toBeLessThan(5000); // 5 seconds
        console.log(`Combined system load - Duration: ${duration.toFixed(2)}ms, Memory: ${memoryUsed} bytes`);
        
        const cacheStats = canvasCache.getStats();
        const memoryStats = memoryManager.getStats();
        
        console.log(`Cache stats - Hits: ${cacheStats.hits}, Misses: ${cacheStats.misses}`);
        console.log(`Memory stats - Samples: ${memoryStats.memoryStats.samples}`);
        
      } finally {
        virtualRenderer.dispose();
        memoryManager.dispose();
      }
    });
  });
});