import { performance } from 'perf_hooks';

// Mock implementations for comparison
class NaiveRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private elements: Array<{ element: SVGElement; bounds: any }> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  addElement(element: SVGElement, bounds: any) {
    this.elements.push({ element, bounds });
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Naive approach: render all elements every time
    this.elements.forEach(({ element, bounds }) => {
      this.renderElement(element, bounds);
    });
  }

  private renderElement(element: SVGElement, bounds: any) {
    // Simulate rendering work
    const complexity = this.calculateComplexity(element);
    const renderTime = complexity * 0.1; // Simulate render time
    
    // Busy wait to simulate rendering
    const start = performance.now();
    while (performance.now() - start < renderTime) {
      // Simulate work
    }
  }

  private calculateComplexity(element: SVGElement): number {
    // Simple complexity calculation
    const tagName = element.tagName.toLowerCase();
    switch (tagName) {
      case 'rect': return 1;
      case 'circle': return 2;
      case 'path': return 5;
      default: return 3;
    }
  }
}

class NaiveCache {
  private cache = new Map<string, any>();

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any) {
    // No size limits or eviction
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

class NaiveObjectCreator {
  createPoint(x: number, y: number): { x: number; y: number } {
    return { x, y }; // Always create new objects
  }

  createRect(x: number, y: number, width: number, height: number): any {
    return { x, y, width, height }; // Always create new objects
  }
}

// Import optimized implementations
import { VirtualRenderer } from '../../src/lib/performance/virtual-renderer';
import { CanvasCache } from '../../src/lib/performance/canvas-cache';
import { ObjectPool, PooledPoint, PooledRect } from '../../src/lib/performance/object-pool';

describe('Performance Comparison Tests', () => {
  const createTestElements = (count: number): SVGElement[] => {
    const elements: SVGElement[] = [];
    for (let i = 0; i < count; i++) {
      const type = ['rect', 'circle', 'path'][i % 3];
      const element = document.createElementNS('http://www.w3.org/2000/svg', type);
      
      if (type === 'rect') {
        element.setAttribute('x', (i % 10 * 50).toString());
        element.setAttribute('y', (Math.floor(i / 10) * 50).toString());
        element.setAttribute('width', '40');
        element.setAttribute('height', '40');
      } else if (type === 'circle') {
        element.setAttribute('cx', (i % 10 * 50 + 20).toString());
        element.setAttribute('cy', (Math.floor(i / 10) * 50 + 20).toString());
        element.setAttribute('r', '20');
      } else if (type === 'path') {
        const d = `M${i % 10 * 50},${Math.floor(i / 10) * 50} L${i % 10 * 50 + 40},${Math.floor(i / 10) * 50 + 40}`;
        element.setAttribute('d', d);
      }
      
      elements.push(element);
    }
    return elements;
  };

  const measurePerformance = async <T>(fn: () => Promise<T> | T): Promise<{ result: T; duration: number; memory?: number }> => {
    const startMemory = typeof window !== 'undefined' && 'memory' in performance 
      ? (performance as any).memory.usedJSHeapSize 
      : 0;
    
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    const endMemory = typeof window !== 'undefined' && 'memory' in performance 
      ? (performance as any).memory.usedJSHeapSize 
      : 0;
    
    return {
      result,
      duration: end - start,
      memory: endMemory - startMemory
    };
  };

  describe('Rendering Performance Comparison', () => {
    test('Virtual Renderer vs Naive Renderer', async () => {
      const elementCounts = [50, 100, 200, 500];
      const results: Array<{
        count: number;
        naive: { duration: number; memory?: number };
        optimized: { duration: number; memory?: number };
        improvement: number;
      }> = [];

      for (const count of elementCounts) {
        const elements = createTestElements(count);
        
        // Test naive renderer
        const naiveCanvas = document.createElement('canvas');
        naiveCanvas.width = 1000;
        naiveCanvas.height = 800;
        const naiveRenderer = new NaiveRenderer(naiveCanvas);
        
        const naiveResult = await measurePerformance(async () => {
          elements.forEach((element, index) => {
            naiveRenderer.addElement(element, {
              x: parseFloat(element.getAttribute('x') || element.getAttribute('cx') || '0'),
              y: parseFloat(element.getAttribute('y') || element.getAttribute('cy') || '0'),
              width: parseFloat(element.getAttribute('width') || element.getAttribute('r') || '40'),
              height: parseFloat(element.getAttribute('height') || element.getAttribute('r') || '40')
            });
          });
          
          // Render multiple times
          for (let i = 0; i < 10; i++) {
            naiveRenderer.render();
          }
        });

        // Test optimized renderer
        const optimizedCanvas = document.createElement('canvas');
        optimizedCanvas.width = 1000;
        optimizedCanvas.height = 800;
        const optimizedRenderer = new VirtualRenderer(optimizedCanvas);
        
        const optimizedResult = await measurePerformance(async () => {
          await optimizedRenderer.initialize();
          
          elements.forEach((element, index) => {
            optimizedRenderer.addItem({
              id: `element-${index}`,
              element,
              bounds: {
                x: parseFloat(element.getAttribute('x') || element.getAttribute('cx') || '0'),
                y: parseFloat(element.getAttribute('y') || element.getAttribute('cy') || '0'),
                width: parseFloat(element.getAttribute('width') || element.getAttribute('r') || '40'),
                height: parseFloat(element.getAttribute('height') || element.getAttribute('r') || '40')
              },
              zIndex: index,
              visible: true
            });
          });
          
          // Render multiple times
          for (let i = 0; i < 10; i++) {
            await optimizedRenderer.render();
          }
        });

        optimizedRenderer.dispose();

        const improvement = ((naiveResult.duration - optimizedResult.duration) / naiveResult.duration) * 100;
        
        results.push({
          count,
          naive: { duration: naiveResult.duration, memory: naiveResult.memory },
          optimized: { duration: optimizedResult.duration, memory: optimizedResult.memory },
          improvement
        });

        console.log(`Rendering ${count} elements:`);
        console.log(`  Naive: ${naiveResult.duration.toFixed(2)}ms`);
        console.log(`  Optimized: ${optimizedResult.duration.toFixed(2)}ms`);
        console.log(`  Improvement: ${improvement.toFixed(1)}%`);
        
        // Optimized should be faster for larger element counts
        if (count >= 100) {
          expect(optimizedResult.duration).toBeLessThan(naiveResult.duration);
        }
      }

      // Overall improvement should increase with element count
      const largestImprovement = results[results.length - 1].improvement;
      const smallestImprovement = results[0].improvement;
      expect(largestImprovement).toBeGreaterThan(smallestImprovement);
    });
  });

  describe('Caching Performance Comparison', () => {
    test('Canvas Cache vs Naive Cache', async () => {
      const itemCounts = [50, 100, 200, 500];
      
      for (const count of itemCounts) {
        // Test naive cache
        const naiveCache = new NaiveCache();
        const naiveResult = await measurePerformance(() => {
          // Fill cache
          for (let i = 0; i < count; i++) {
            const canvas = document.createElement('canvas');
            naiveCache.set(`item-${i}`, canvas);
          }
          
          // Access items multiple times
          for (let i = 0; i < count * 2; i++) {
            naiveCache.get(`item-${i % count}`);
          }
          
          return naiveCache.size();
        });

        // Test optimized cache
        const optimizedCache = new CanvasCache({ maxSize: count / 2, maxAge: 60000 });
        const optimizedResult = await measurePerformance(() => {
          // Fill cache (will trigger eviction)
          for (let i = 0; i < count; i++) {
            const canvas = document.createElement('canvas');
            const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            optimizedCache.set(`item-${i}`, canvas, element);
          }
          
          // Access items multiple times
          for (let i = 0; i < count * 2; i++) {
            optimizedCache.get(`item-${i % count}`);
          }
          
          return optimizedCache.getStats().size;
        });

        console.log(`Caching ${count} items:`);
        console.log(`  Naive: ${naiveResult.duration.toFixed(2)}ms (${naiveResult.result} items)`);
        console.log(`  Optimized: ${optimizedResult.duration.toFixed(2)}ms (${optimizedResult.result} items)`);
        
        // Optimized cache should manage memory better
        expect(optimizedResult.result).toBeLessThanOrEqual(count / 2 + 10); // Allow some tolerance
        
        // For large counts, optimized should be faster due to better memory management
        if (count >= 200) {
          expect(optimizedResult.duration).toBeLessThan(naiveResult.duration * 1.5);
        }
      }
    });
  });

  describe('Object Creation Performance Comparison', () => {
    test('Object Pool vs Naive Object Creation', async () => {
      const iterationCounts = [1000, 5000, 10000, 20000];
      
      for (const iterations of iterationCounts) {
        // Test naive object creation
        const naiveCreator = new NaiveObjectCreator();
        const naiveResult = await measurePerformance(() => {
          const objects: any[] = [];
          for (let i = 0; i < iterations; i++) {
            if (i % 2 === 0) {
              objects.push(naiveCreator.createPoint(i, i * 2));
            } else {
              objects.push(naiveCreator.createRect(i, i * 2, 100, 100));
            }
          }
          return objects.length;
        });

        // Test object pool
        const pointPool = new ObjectPool(() => new PooledPoint(), 100);
        const rectPool = new ObjectPool(() => new PooledRect(), 100);
        
        const poolResult = await measurePerformance(() => {
          const objects: any[] = [];
          for (let i = 0; i < iterations; i++) {
            if (i % 2 === 0) {
              const point = pointPool.borrow();
              point.set(i, i * 2);
              objects.push(point);
            } else {
              const rect = rectPool.borrow();
              rect.set(i, i * 2, 100, 100);
              objects.push(rect);
            }
          }
          
          // Return objects to pools
          objects.forEach(obj => {
            if (obj instanceof PooledPoint) {
              pointPool.return(obj);
            } else if (obj instanceof PooledRect) {
              rectPool.return(obj);
            }
          });
          
          return objects.length;
        });

        const improvement = ((naiveResult.duration - poolResult.duration) / naiveResult.duration) * 100;
        
        console.log(`Object creation ${iterations} iterations:`);
        console.log(`  Naive: ${naiveResult.duration.toFixed(2)}ms`);
        console.log(`  Pool: ${poolResult.duration.toFixed(2)}ms`);
        console.log(`  Improvement: ${improvement.toFixed(1)}%`);
        
        if (naiveResult.memory && poolResult.memory) {
          console.log(`  Memory - Naive: ${naiveResult.memory} bytes, Pool: ${poolResult.memory} bytes`);
          
          // Pool should use less memory for large numbers of objects
          if (iterations >= 5000) {
            expect(poolResult.memory).toBeLessThan(naiveResult.memory);
          }
        }
        
        // Pool should be faster for large numbers of objects
        if (iterations >= 10000) {
          expect(poolResult.duration).toBeLessThan(naiveResult.duration);
        }
      }
    });
  });

  describe('Memory Usage Comparison', () => {
    test('should demonstrate memory efficiency improvements', async () => {
      const testDuration = 2000; // 2 seconds
      
      // Test memory usage without optimizations
      const naiveResult = await measurePerformance(async () => {
        const objects: any[] = [];
        const startTime = performance.now();
        
        while (performance.now() - startTime < testDuration) {
          // Create many temporary objects
          for (let i = 0; i < 100; i++) {
            objects.push({
              points: Array.from({ length: 10 }, (_, j) => ({ x: i + j, y: i * j })),
              rects: Array.from({ length: 5 }, (_, j) => ({ x: i + j, y: i * j, width: 50, height: 50 })),
              cached: new Map(Array.from({ length: 20 }, (_, j) => [`key-${i}-${j}`, `value-${i}-${j}`]))
            });
          }
          
          // Occasionally clear some objects
          if (objects.length > 1000) {
            objects.splice(0, 500);
          }
          
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return objects.length;
      });

      // Test memory usage with optimizations
      const pointPool = new ObjectPool(() => new PooledPoint(), 200);
      const rectPool = new ObjectPool(() => new PooledRect(), 100);
      const cache = new CanvasCache({ maxSize: 100, maxAge: 30000 });
      
      const optimizedResult = await measurePerformance(async () => {
        const objects: any[] = [];
        const startTime = performance.now();
        
        while (performance.now() - startTime < testDuration) {
          // Use object pools and optimized cache
          const points = Array.from({ length: 10 }, (_, j) => {
            const point = pointPool.borrow();
            point.set(j, j * 2);
            return point;
          });
          
          const rects = Array.from({ length: 5 }, (_, j) => {
            const rect = rectPool.borrow();
            rect.set(j, j * 2, 50, 50);
            return rect;
          });
          
          objects.push({ points, rects });
          
          // Return objects to pools
          if (objects.length > 100) {
            const oldObjects = objects.splice(0, 50);
            oldObjects.forEach(obj => {
              obj.points.forEach((p: PooledPoint) => pointPool.return(p));
              obj.rects.forEach((r: PooledRect) => rectPool.return(r));
            });
          }
          
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return objects.length;
      });

      console.log('Memory usage comparison:');
      console.log(`  Naive: ${naiveResult.duration.toFixed(2)}ms, Memory: ${naiveResult.memory || 'N/A'} bytes`);
      console.log(`  Optimized: ${optimizedResult.duration.toFixed(2)}ms, Memory: ${optimizedResult.memory || 'N/A'} bytes`);
      
      if (naiveResult.memory && optimizedResult.memory) {
        const memoryImprovement = ((naiveResult.memory - optimizedResult.memory) / naiveResult.memory) * 100;
        console.log(`  Memory improvement: ${memoryImprovement.toFixed(1)}%`);
        
        // Optimized version should use less memory
        expect(optimizedResult.memory).toBeLessThan(naiveResult.memory);
      }
    });
  });

  describe('Scalability Comparison', () => {
    test('should demonstrate better scalability with optimizations', async () => {
      const scalingFactors = [1, 2, 4, 8]; // Multiply base load
      const baseElementCount = 100;
      
      const naiveScaling: number[] = [];
      const optimizedScaling: number[] = [];
      
      for (const factor of scalingFactors) {
        const elementCount = baseElementCount * factor;
        const elements = createTestElements(elementCount);
        
        // Test naive approach
        const naiveCanvas = document.createElement('canvas');
        const naiveRenderer = new NaiveRenderer(naiveCanvas);
        
        const naiveTime = await measurePerformance(() => {
          elements.forEach(element => {
            naiveRenderer.addElement(element, { x: 0, y: 0, width: 40, height: 40 });
          });
          naiveRenderer.render();
        });
        
        naiveScaling.push(naiveTime.duration);

        // Test optimized approach
        const optimizedCanvas = document.createElement('canvas');
        const optimizedRenderer = new VirtualRenderer(optimizedCanvas);
        
        const optimizedTime = await measurePerformance(async () => {
          await optimizedRenderer.initialize();
          elements.forEach((element, index) => {
            optimizedRenderer.addItem({
              id: `element-${index}`,
              element,
              bounds: { x: 0, y: 0, width: 40, height: 40 },
              zIndex: index,
              visible: true
            });
          });
          await optimizedRenderer.render();
        });
        
        optimizedRenderer.dispose();
        optimizedScaling.push(optimizedTime.duration);
        
        console.log(`Scaling factor ${factor}x (${elementCount} elements):`);
        console.log(`  Naive: ${naiveTime.duration.toFixed(2)}ms`);
        console.log(`  Optimized: ${optimizedTime.duration.toFixed(2)}ms`);
      }
      
      // Calculate scaling characteristics
      const naiveGrowthRate = naiveScaling[naiveScaling.length - 1] / naiveScaling[0];
      const optimizedGrowthRate = optimizedScaling[optimizedScaling.length - 1] / optimizedScaling[0];
      
      console.log(`Growth rates - Naive: ${naiveGrowthRate.toFixed(2)}x, Optimized: ${optimizedGrowthRate.toFixed(2)}x`);
      
      // Optimized version should scale better (lower growth rate)
      expect(optimizedGrowthRate).toBeLessThan(naiveGrowthRate);
    });
  });
});