import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SVGEditor } from '../../src/components/svg-editor';
import { ToolType } from '../../src/types/editor';

// Mock the performance modules
jest.mock('../../src/lib/performance/virtual-renderer', () => ({
  VirtualRenderer: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    updateViewport: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    getVisibleItems: jest.fn(() => []),
    addItem: jest.fn(),
    removeItem: jest.fn(),
    updateItem: jest.fn()
  }))
}));

jest.mock('../../src/lib/performance/incremental-updater', () => ({
  IncrementalUpdater: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    dispose: jest.fn(),
    addObserver: jest.fn(),
    removeObserver: jest.fn(),
    forceUpdate: jest.fn()
  }))
}));

jest.mock('../../src/lib/performance/canvas-cache', () => ({
  CanvasCache: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    getStats: jest.fn(() => ({ hits: 0, misses: 0, memoryUsage: 0 }))
  }))
}));

describe('SVG Editor Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    // Clear any existing SVG content
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Editor Functionality', () => {
    test('should render editor with default tools', async () => {
      render(<SVGEditor />);
      
      // Check if main editor components are present
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('svg-canvas')).toBeInTheDocument();
      expect(screen.getByTestId('toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('properties-panel')).toBeInTheDocument();
    });

    test('should switch between tools', async () => {
      render(<SVGEditor />);
      
      const selectTool = screen.getByTestId('tool-select');
      const rectangleTool = screen.getByTestId('tool-rectangle');
      const circleTool = screen.getByTestId('tool-circle');
      
      // Default should be select tool
      expect(selectTool).toHaveClass('active');
      
      // Switch to rectangle tool
      await user.click(rectangleTool);
      expect(rectangleTool).toHaveClass('active');
      expect(selectTool).not.toHaveClass('active');
      
      // Switch to circle tool
      await user.click(circleTool);
      expect(circleTool).toHaveClass('active');
      expect(rectangleTool).not.toHaveClass('active');
    });
  });

  describe('Shape Creation Workflow', () => {
    test('should create rectangle with mouse interactions', async () => {
      render(<SVGEditor />);
      
      const canvas = screen.getByTestId('svg-canvas');
      const rectangleTool = screen.getByTestId('tool-rectangle');
      
      // Select rectangle tool
      await user.click(rectangleTool);
      
      // Simulate mouse down, move, and up to create rectangle
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 150 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 150 });
      
      await waitFor(() => {
        const rectangles = canvas.querySelectorAll('rect');
        expect(rectangles).toHaveLength(1);
        
        const rect = rectangles[0];
        expect(rect).toHaveAttribute('x', '100');
        expect(rect).toHaveAttribute('y', '100');
        expect(rect).toHaveAttribute('width', '100');
        expect(rect).toHaveAttribute('height', '50');
      });
    });

    test('should create circle with mouse interactions', async () => {
      render(<SVGEditor />);
      
      const canvas = screen.getByTestId('svg-canvas');
      const circleTool = screen.getByTestId('tool-circle');
      
      // Select circle tool
      await user.click(circleTool);
      
      // Simulate mouse interactions to create circle
      fireEvent.mouseDown(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 });
      
      await waitFor(() => {
        const circles = canvas.querySelectorAll('circle');
        expect(circles).toHaveLength(1);
        
        const circle = circles[0];
        expect(circle).toHaveAttribute('cx', '150');
        expect(circle).toHaveAttribute('cy', '150');
        // Radius should be calculated from distance
        expect(parseFloat(circle.getAttribute('r') || '0')).toBeGreaterThan(0);
      });
    });

    test('should create path with pen tool', async () => {
      render(<SVGEditor />);
      
      const canvas = screen.getByTestId('svg-canvas');
      const penTool = screen.getByTestId('tool-pen');
      
      // Select pen tool
      await user.click(penTool);
      
      // Create path with multiple points
      const points = [
        { x: 100, y: 100 },
        { x: 150, y: 120 },
        { x: 200, y: 100 },
        { x: 180, y: 150 }
      ];
      
      for (const point of points) {
        fireEvent.click(canvas, { clientX: point.x, clientY: point.y });
      }
      
      // Double click to finish path
      fireEvent.doubleClick(canvas, { clientX: 180, clientY: 150 });
      
      await waitFor(() => {
        const paths = canvas.querySelectorAll('path');
        expect(paths).toHaveLength(1);
        
        const path = paths[0];
        const d = path.getAttribute('d');
        expect(d).toContain('M100,100');
        expect(d).toContain('L150,120');
        expect(d).toContain('L200,100');
        expect(d).toContain('L180,150');
      });
    });
  });

  describe('Element Selection and Manipulation', () => {
    test('should select and move elements', async () => {
      render(<SVGEditor />);
      
      const canvas = screen.getByTestId('svg-canvas');
      const rectangleTool = screen.getByTestId('tool-rectangle');
      const selectTool = screen.getByTestId('tool-select');
      
      // Create a rectangle first
      await user.click(rectangleTool);
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 150 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 150 });
      
      // Switch to select tool
      await user.click(selectTool);
      
      await waitFor(() => {
        const rect = canvas.querySelector('rect');
        expect(rect).toBeInTheDocument();
        
        // Select the rectangle
        fireEvent.click(rect!);
        expect(rect).toHaveClass('selected');
        
        // Move the rectangle
        fireEvent.mouseDown(rect!, { clientX: 150, clientY: 125 });
        fireEvent.mouseMove(canvas, { clientX: 170, clientY: 145 });
        fireEvent.mouseUp(canvas, { clientX: 170, clientY: 145 });
        
        // Check if rectangle moved
        expect(rect).toHaveAttribute('x', '120');
        expect(rect).toHaveAttribute('y', '120');
      });
    });

    test('should resize elements using handles', async () => {
      render(<SVGEditor />);
      
      const canvas = screen.getByTestId('svg-canvas');
      const rectangleTool = screen.getByTestId('tool-rectangle');
      const selectTool = screen.getByTestId('tool-select');
      
      // Create and select rectangle
      await user.click(rectangleTool);
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 150 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 150 });
      
      await user.click(selectTool);
      
      await waitFor(() => {
        const rect = canvas.querySelector('rect');
        fireEvent.click(rect!);
        
        // Find resize handle
        const resizeHandle = canvas.querySelector('.resize-handle-se');
        expect(resizeHandle).toBeInTheDocument();
        
        // Drag resize handle
        fireEvent.mouseDown(resizeHandle!, { clientX: 200, clientY: 150 });
        fireEvent.mouseMove(canvas, { clientX: 250, clientY: 200 });
        fireEvent.mouseUp(canvas, { clientX: 250, clientY: 200 });
        
        // Check if rectangle resized
        expect(rect).toHaveAttribute('width', '150');
        expect(rect).toHaveAttribute('height', '100');
      });
    });
  });

  describe('Properties Panel Integration', () => {
    test('should update element properties', async () => {
      render(<SVGEditor />);
      
      const canvas = screen.getByTestId('svg-canvas');
      const rectangleTool = screen.getByTestId('tool-rectangle');
      const selectTool = screen.getByTestId('tool-select');
      
      // Create and select rectangle
      await user.click(rectangleTool);
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 150 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 150 });
      
      await user.click(selectTool);
      
      await waitFor(async () => {
        const rect = canvas.querySelector('rect');
        fireEvent.click(rect!);
        
        // Check properties panel shows rectangle properties
        const fillInput = screen.getByLabelText('Fill Color');
        const strokeInput = screen.getByLabelText('Stroke Color');
        const strokeWidthInput = screen.getByLabelText('Stroke Width');
        
        expect(fillInput).toBeInTheDocument();
        expect(strokeInput).toBeInTheDocument();
        expect(strokeWidthInput).toBeInTheDocument();
        
        // Change fill color
        await user.clear(fillInput);
        await user.type(fillInput, '#ff0000');
        
        // Change stroke width
        await user.clear(strokeWidthInput);
        await user.type(strokeWidthInput, '3');
        
        // Verify changes applied to element
        expect(rect).toHaveAttribute('fill', '#ff0000');
        expect(rect).toHaveAttribute('stroke-width', '3');
      });
    });
  });

  describe('Undo/Redo Functionality', () => {
    test('should undo and redo operations', async () => {
      render(<SVGEditor />);
      
      const canvas = screen.getByTestId('svg-canvas');
      const rectangleTool = screen.getByTestId('tool-rectangle');
      const undoButton = screen.getByTestId('undo-button');
      const redoButton = screen.getByTestId('redo-button');
      
      // Create rectangle
      await user.click(rectangleTool);
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 150 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 150 });
      
      await waitFor(() => {
        expect(canvas.querySelectorAll('rect')).toHaveLength(1);
      });
      
      // Undo creation
      await user.click(undoButton);
      
      await waitFor(() => {
        expect(canvas.querySelectorAll('rect')).toHaveLength(0);
      });
      
      // Redo creation
      await user.click(redoButton);
      
      await waitFor(() => {
        expect(canvas.querySelectorAll('rect')).toHaveLength(1);
      });
    });
  });

  describe('File Operations', () => {
    test('should export SVG', async () => {
      render(<SVGEditor />);
      
      const canvas = screen.getByTestId('svg-canvas');
      const rectangleTool = screen.getByTestId('tool-rectangle');
      const exportButton = screen.getByTestId('export-button');
      
      // Create some content
      await user.click(rectangleTool);
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 150 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 150 });
      
      // Mock URL.createObjectURL
      const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.createObjectURL = mockCreateObjectURL;
      
      // Mock link click
      const mockClick = jest.fn();
      const mockLink = {
        href: '',
        download: '',
        click: mockClick
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      
      // Trigger export
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
        expect(mockLink.download).toContain('.svg');
      });
    });

    test('should import SVG file', async () => {
      render(<SVGEditor />);
      
      const importButton = screen.getByTestId('import-button');
      const fileInput = screen.getByTestId('file-input');
      
      // Create mock SVG file
      const svgContent = '<svg><rect x="10" y="10" width="100" height="50" fill="blue"/></svg>';
      const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });
      
      // Trigger file import
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        const canvas = screen.getByTestId('svg-canvas');
        const importedRect = canvas.querySelector('rect');
        expect(importedRect).toBeInTheDocument();
        expect(importedRect).toHaveAttribute('x', '10');
        expect(importedRect).toHaveAttribute('y', '10');
        expect(importedRect).toHaveAttribute('width', '100');
        expect(importedRect).toHaveAttribute('height', '50');
        expect(importedRect).toHaveAttribute('fill', 'blue');
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('should handle keyboard shortcuts', async () => {
      render(<SVGEditor />);
      
      const canvas = screen.getByTestId('svg-canvas');
      const rectangleTool = screen.getByTestId('tool-rectangle');
      
      // Create rectangle
      await user.click(rectangleTool);
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 150 });
      fireEvent.mouseUp(canvas, { clientX: 200, clientY: 150 });
      
      await waitFor(() => {
        expect(canvas.querySelectorAll('rect')).toHaveLength(1);
      });
      
      // Test Ctrl+Z (undo)
      fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
      
      await waitFor(() => {
        expect(canvas.querySelectorAll('rect')).toHaveLength(0);
      });
      
      // Test Ctrl+Y (redo)
      fireEvent.keyDown(document, { key: 'y', ctrlKey: true });
      
      await waitFor(() => {
        expect(canvas.querySelectorAll('rect')).toHaveLength(1);
      });
      
      // Test Delete key
      const rect = canvas.querySelector('rect');
      fireEvent.click(rect!);
      fireEvent.keyDown(document, { key: 'Delete' });
      
      await waitFor(() => {
        expect(canvas.querySelectorAll('rect')).toHaveLength(0);
      });
    });
  });

  describe('Performance Integration', () => {
    test('should handle large number of elements efficiently', async () => {
      render(<SVGEditor />);
      
      const canvas = screen.getByTestId('svg-canvas');
      const rectangleTool = screen.getByTestId('tool-rectangle');
      
      await user.click(rectangleTool);
      
      const startTime = performance.now();
      
      // Create many rectangles
      for (let i = 0; i < 100; i++) {
        const x = (i % 10) * 50;
        const y = Math.floor(i / 10) * 30;
        
        fireEvent.mouseDown(canvas, { clientX: x, clientY: y });
        fireEvent.mouseMove(canvas, { clientX: x + 40, clientY: y + 25 });
        fireEvent.mouseUp(canvas, { clientX: x + 40, clientY: y + 25 });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      await waitFor(() => {
        expect(canvas.querySelectorAll('rect')).toHaveLength(100);
        // Should complete within reasonable time (adjust threshold as needed)
        expect(duration).toBeLessThan(5000); // 5 seconds
      });
    });

    test('should maintain responsiveness during complex operations', async () => {
      render(<SVGEditor />);
      
      const canvas = screen.getByTestId('svg-canvas');
      const penTool = screen.getByTestId('tool-pen');
      
      await user.click(penTool);
      
      // Create complex path with many points
      const points = Array.from({ length: 50 }, (_, i) => ({
        x: 100 + i * 5,
        y: 100 + Math.sin(i * 0.2) * 50
      }));
      
      const startTime = performance.now();
      
      for (const point of points) {
        fireEvent.click(canvas, { clientX: point.x, clientY: point.y });
      }
      
      fireEvent.doubleClick(canvas, { 
        clientX: points[points.length - 1].x, 
        clientY: points[points.length - 1].y 
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      await waitFor(() => {
        const paths = canvas.querySelectorAll('path');
        expect(paths).toHaveLength(1);
        
        const path = paths[0];
        const d = path.getAttribute('d');
        expect(d).toContain('M100,100');
        
        // Should maintain responsiveness
        expect(duration).toBeLessThan(2000); // 2 seconds
      });
    });
  });
});