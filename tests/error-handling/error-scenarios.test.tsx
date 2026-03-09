import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SVGEditor } from '../../src/components/svg-editor';
import { VirtualRenderer } from '../../src/lib/performance/virtual-renderer';
import { CanvasCache } from '../../src/lib/performance/canvas-cache';
import { MemoryManager } from '../../src/lib/performance/memory-manager';
import { PerformanceMonitor } from '../../src/lib/performance/performance-monitor';

// Mock console methods to capture error logs
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('Error Handling Tests', () => {
  beforeEach(() => {
    mockConsoleError.mockClear();
    mockConsoleWarn.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SVG Editor Error Handling', () => {
    test('should handle invalid SVG import gracefully', async () => {
      render(<SVGEditor />);
      
      const fileInput = screen.getByTestId('file-input');
      
      // Create invalid SVG file
      const invalidSvgContent = '<invalid>not valid svg</invalid>';
      const file = new File([invalidSvgContent], 'invalid.svg', { type: 'image/svg+xml' });
      
      const user = userEvent.setup();
      await user.upload(fileInput, file);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/invalid svg file/i)).toBeInTheDocument();
      });
      
      // Should not crash the application
      expect(screen.getByTestId('svg-canvas')).toBeInTheDocument();
    });

    test('should handle corrupted file upload', async () => {
      render(<SVGEditor />);
      
      const fileInput = screen.getByTestId('file-input');
      
      // Create corrupted file
      const corruptedContent = new Uint8Array([0xFF, 0xFE, 0xFD, 0xFC]);
      const file = new File([corruptedContent], 'corrupted.svg', { type: 'image/svg+xml' });
      
      const user = userEvent.setup();
      await user.upload(fileInput, file);
      
      // Should handle gracefully
      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalled();
      });
      
      // Application should remain functional
      expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    });

    test('should handle extremely large files', async () => {
      render(<SVGEditor />);
      
      const fileInput = screen.getByTestId('file-input');
      
      // Create very large SVG content
      let largeSvgContent = '<svg>';
      for (let i = 0; i < 10000; i++) {
        largeSvgContent += `<rect x="${i}" y="${i}" width="10" height="10"/>`;
      }
      largeSvgContent += '</svg>';
      
      const file = new File([largeSvgContent], 'large.svg', { type: 'image/svg+xml' });
      
      const user = userEvent.setup();
      await user.upload(fileInput, file);
      
      // Should either load successfully or show appropriate warning
      await waitFor(() => {
        const canvas = screen.getByTestId('svg-canvas');
        expect(canvas).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('should handle invalid tool operations', async () => {
      render(<SVGEditor />);
      
      const canvas = screen.getByTestId('svg-canvas');
      const rectangleTool = screen.getByTestId('tool-rectangle');
      
      const user = userEvent.setup();
      await user.click(rectangleTool);
      
      // Try to create rectangle with invalid coordinates
      fireEvent.mouseDown(canvas, { clientX: NaN, clientY: NaN });
      fireEvent.mouseMove(canvas, { clientX: Infinity, clientY: -Infinity });
      fireEvent.mouseUp(canvas, { clientX: undefined, clientY: null });
      
      // Should not crash and should not create invalid elements
      await waitFor(() => {
        const rects = canvas.querySelectorAll('rect');
        rects.forEach(rect => {
          const x = rect.getAttribute('x');
          const y = rect.getAttribute('y');
          expect(x).not.toBe('NaN');
          expect(y).not.toBe('Infinity');
          expect(x).not.toBe('undefined');
          expect(y).not.toBe('null');
        });
      });
    });

    test('should handle memory pressure gracefully', async () => {
      render(<SVGEditor />);
      
      const canvas = screen.getByTestId('svg-canvas');
      const rectangleTool = screen.getByTestId('tool-rectangle');
      
      const user = userEvent.setup();
      await user.click(rectangleTool);
      
      // Create many elements to simulate memory pressure
      for (let i = 0; i < 1000; i++) {
        fireEvent.mouseDown(canvas, { clientX: i % 100, clientY: Math.floor(i / 100) });
        fireEvent.mouseMove(canvas, { clientX: (i % 100) + 10, clientY: Math.floor(i / 100) + 10 });
        fireEvent.mouseUp(canvas, { clientX: (i % 100) + 10, clientY: Math.floor(i / 100) + 10 });
      }
      
      // Application should remain responsive
      await waitFor(() => {
        expect(screen.getByTestId('toolbar')).toBeInTheDocument();
        expect(screen.getByTestId('properties-panel')).toBeInTheDocument();
      });
    });
  });

  describe('Virtual Renderer Error Handling', () => {
    let renderer: VirtualRenderer;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
      mockCanvas = document.createElement('canvas');
      mockCanvas.width = 800;
      mockCanvas.height = 600;
      renderer = new VirtualRenderer(mockCanvas);
    });

    afterEach(() => {
      renderer.dispose();
    });

    test('should handle invalid canvas context', async () => {
      // Mock getContext to return null
      const originalGetContext = mockCanvas.getContext;
      mockCanvas.getContext = jest.fn().mockReturnValue(null);
      
      const invalidRenderer = new VirtualRenderer(mockCanvas);
      
      await expect(invalidRenderer.initialize()).rejects.toThrow();
      
      // Restore original method
      mockCanvas.getContext = originalGetContext;
      invalidRenderer.dispose();
    });

    test('should handle corrupted render items', async () => {
      await renderer.initialize();
      
      // Add invalid render item
      const invalidItem = {
        id: 'invalid',
        element: null as any,
        bounds: { x: NaN, y: Infinity, width: -1, height: undefined as any },
        zIndex: 'invalid' as any,
        visible: 'maybe' as any
      };
      
      expect(() => {
        renderer.addItem(invalidItem);
      }).not.toThrow();
      
      // Should handle gracefully during render
      await expect(renderer.render()).resolves.not.toThrow();
    });

    test('should handle worker initialization failure', async () => {
      // Mock Worker constructor to throw
      const originalWorker = global.Worker;
      global.Worker = jest.fn().mockImplementation(() => {
        throw new Error('Worker not supported');
      });
      
      const workerRenderer = new VirtualRenderer(mockCanvas);
      
      // Should fallback gracefully
      await expect(workerRenderer.initialize()).resolves.not.toThrow();
      
      // Restore Worker
      global.Worker = originalWorker;
      workerRenderer.dispose();
    });

    test('should handle viewport updates with invalid values', async () => {
      await renderer.initialize();
      
      // Test invalid viewport values
      const invalidViewports = [
        { x: NaN, y: 0, width: 100, height: 100, zoom: 1 },
        { x: 0, y: Infinity, width: 100, height: 100, zoom: 1 },
        { x: 0, y: 0, width: -100, height: 100, zoom: 1 },
        { x: 0, y: 0, width: 100, height: 0, zoom: 1 },
        { x: 0, y: 0, width: 100, height: 100, zoom: 0 },
        { x: 0, y: 0, width: 100, height: 100, zoom: -1 }
      ];
      
      invalidViewports.forEach(viewport => {
        expect(() => {
          renderer.updateViewport(viewport);
        }).not.toThrow();
      });
    });
  });

  describe('Canvas Cache Error Handling', () => {
    let cache: CanvasCache;

    beforeEach(() => {
      cache = new CanvasCache({ maxSize: 10, maxAge: 1000 });
    });

    test('should handle invalid cache keys', () => {
      const invalidKeys = [null, undefined, '', 0, false, {}, []];
      
      invalidKeys.forEach(key => {
        expect(() => {
          cache.set(key as any, document.createElement('canvas'), document.createElementNS('http://www.w3.org/2000/svg', 'rect'));
        }).not.toThrow();
        
        expect(() => {
          cache.get(key as any);
        }).not.toThrow();
      });
    });

    test('should handle null/undefined canvas values', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      
      expect(() => {
        cache.set('test1', null as any, element);
      }).not.toThrow();
      
      expect(() => {
        cache.set('test2', undefined as any, element);
      }).not.toThrow();
      
      expect(cache.get('test1')).toBeNull();
      expect(cache.get('test2')).toBeNull();
    });

    test('should handle corrupted cache entries', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const canvas = document.createElement('canvas');
      
      cache.set('valid', canvas, element);
      
      // Manually corrupt cache entry
      const cacheInternal = (cache as any).cache;
      if (cacheInternal && cacheInternal.has('valid')) {
        const entry = cacheInternal.get('valid');
        entry.canvas = null;
        entry.element = undefined;
        entry.timestamp = 'invalid';
      }
      
      // Should handle corrupted entry gracefully
      expect(() => {
        cache.get('valid');
      }).not.toThrow();
    });

    test('should handle memory allocation failures', () => {
      // Mock canvas creation to fail occasionally
      const originalCreateElement = document.createElement;
      let callCount = 0;
      
      document.createElement = jest.fn().mockImplementation((tagName) => {
        if (tagName === 'canvas' && ++callCount > 5) {
          throw new Error('Out of memory');
        }
        return originalCreateElement.call(document, tagName);
      });
      
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      
      // Should handle memory allocation failures
      for (let i = 0; i < 10; i++) {
        expect(() => {
          const canvas = document.createElement('canvas');
          cache.set(`test-${i}`, canvas, element);
        }).not.toThrow();
      }
      
      // Restore original method
      document.createElement = originalCreateElement;
    });
  });

  describe('Memory Manager Error Handling', () => {
    let memoryManager: MemoryManager;

    beforeEach(() => {
      memoryManager = new MemoryManager();
    });

    afterEach(() => {
      memoryManager.dispose();
    });

    test('should handle invalid event listener registrations', () => {
      const invalidTargets = [null, undefined, 'string', 123, {}, []];
      const validListener = () => {};
      
      invalidTargets.forEach(target => {
        expect(() => {
          memoryManager.addEventListener(target as any, 'click', validListener);
        }).not.toThrow();
      });
    });

    test('should handle invalid event types', () => {
      const element = document.createElement('div');
      const invalidEventTypes = [null, undefined, '', 123, {}, []];
      const validListener = () => {};
      
      invalidEventTypes.forEach(eventType => {
        expect(() => {
          memoryManager.addEventListener(element, eventType as any, validListener);
        }).not.toThrow();
      });
    });

    test('should handle null/undefined listeners', () => {
      const element = document.createElement('div');
      const invalidListeners = [null, undefined, 'string', 123, {}, []];
      
      invalidListeners.forEach(listener => {
        expect(() => {
          memoryManager.addEventListener(element, 'click', listener as any);
        }).not.toThrow();
      });
    });

    test('should handle memory monitoring failures', () => {
      // Mock performance.memory to be undefined
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;
      
      expect(() => {
        memoryManager.startMonitoring(100);
      }).not.toThrow();
      
      // Should still collect basic stats
      const stats = memoryManager.getStats();
      expect(stats).toBeDefined();
      expect(stats.memoryStats).toBeDefined();
      
      // Restore memory
      (performance as any).memory = originalMemory;
    });

    test('should handle resource registration failures', () => {
      const invalidResources = [
        { key: null, resource: {} },
        { key: undefined, resource: {} },
        { key: '', resource: null },
        { key: 'valid', resource: undefined },
        { key: 123, resource: 'string' }
      ];
      
      invalidResources.forEach(({ key, resource }) => {
        expect(() => {
          memoryManager.registerResource(key as any, resource as any);
        }).not.toThrow();
      });
    });
  });

  describe('Performance Monitor Error Handling', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    afterEach(() => {
      monitor.stop();
    });

    test('should handle missing Performance API', () => {
      // Mock performance API to be unavailable
      const originalPerformance = global.performance;
      delete (global as any).performance;
      
      const fallbackMonitor = new PerformanceMonitor();
      
      expect(() => {
        fallbackMonitor.start();
      }).not.toThrow();
      
      expect(() => {
        fallbackMonitor.collectMetrics();
      }).not.toThrow();
      
      // Restore performance
      global.performance = originalPerformance;
      fallbackMonitor.stop();
    });

    test('should handle invalid error reporting', () => {
      monitor.start();
      
      const invalidErrors = [
        null,
        undefined,
        'string error',
        123,
        {},
        [],
        new Error(''),
        { message: null, stack: undefined }
      ];
      
      invalidErrors.forEach(error => {
        expect(() => {
          monitor.reportError(error as any);
        }).not.toThrow();
      });
    });

    test('should handle observer registration failures', () => {
      // Mock PerformanceObserver to throw
      const originalPerformanceObserver = global.PerformanceObserver;
      global.PerformanceObserver = jest.fn().mockImplementation(() => {
        throw new Error('PerformanceObserver not supported');
      });
      
      const fallbackMonitor = new PerformanceMonitor();
      
      expect(() => {
        fallbackMonitor.start();
      }).not.toThrow();
      
      // Restore PerformanceObserver
      global.PerformanceObserver = originalPerformanceObserver;
      fallbackMonitor.stop();
    });

    test('should handle metric collection failures', () => {
      monitor.start();
      
      // Mock performance methods to throw
      const originalNow = performance.now;
      const originalGetEntriesByType = performance.getEntriesByType;
      
      performance.now = jest.fn().mockImplementation(() => {
        throw new Error('performance.now failed');
      });
      
      performance.getEntriesByType = jest.fn().mockImplementation(() => {
        throw new Error('getEntriesByType failed');
      });
      
      expect(() => {
        monitor.collectMetrics();
      }).not.toThrow();
      
      // Restore methods
      performance.now = originalNow;
      performance.getEntriesByType = originalGetEntriesByType;
    });
  });

  describe('Network and Connectivity Errors', () => {
    test('should handle offline scenarios', async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      
      render(<SVGEditor />);
      
      // Should show offline indicator or handle gracefully
      await waitFor(() => {
        expect(screen.getByTestId('svg-canvas')).toBeInTheDocument();
      });
      
      // Restore online status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
    });

    test('should handle service worker registration failures', async () => {
      // Mock service worker to fail
      const originalServiceWorker = navigator.serviceWorker;
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: jest.fn().mockRejectedValue(new Error('Service worker registration failed'))
        },
        configurable: true
      });
      
      render(<SVGEditor />);
      
      // Should handle gracefully
      await waitFor(() => {
        expect(screen.getByTestId('svg-canvas')).toBeInTheDocument();
      });
      
      // Restore service worker
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        configurable: true
      });
    });
  });

  describe('Browser Compatibility Errors', () => {
    test('should handle missing modern APIs', () => {
      // Mock missing APIs
      const originalResizeObserver = global.ResizeObserver;
      const originalIntersectionObserver = global.IntersectionObserver;
      const originalMutationObserver = global.MutationObserver;
      
      delete (global as any).ResizeObserver;
      delete (global as any).IntersectionObserver;
      delete (global as any).MutationObserver;
      
      expect(() => {
        render(<SVGEditor />);
      }).not.toThrow();
      
      // Restore APIs
      global.ResizeObserver = originalResizeObserver;
      global.IntersectionObserver = originalIntersectionObserver;
      global.MutationObserver = originalMutationObserver;
    });

    test('should handle missing Canvas API features', () => {
      // Mock missing OffscreenCanvas
      const originalOffscreenCanvas = global.OffscreenCanvas;
      delete (global as any).OffscreenCanvas;
      
      const canvas = document.createElement('canvas');
      const renderer = new VirtualRenderer(canvas);
      
      expect(async () => {
        await renderer.initialize();
      }).not.toThrow();
      
      renderer.dispose();
      
      // Restore OffscreenCanvas
      global.OffscreenCanvas = originalOffscreenCanvas;
    });

    test('should handle missing Web Workers', () => {
      // Mock missing Worker
      const originalWorker = global.Worker;
      delete (global as any).Worker;
      
      const canvas = document.createElement('canvas');
      const renderer = new VirtualRenderer(canvas);
      
      expect(async () => {
        await renderer.initialize();
      }).not.toThrow();
      
      renderer.dispose();
      
      // Restore Worker
      global.Worker = originalWorker;
    });
  });
});