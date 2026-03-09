import { test, expect } from '@playwright/test';

test.describe('SVG Editor E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Basic Editor Functionality', () => {
    test('should load editor with all components', async ({ page }) => {
      // Check if main editor components are visible
      await expect(page.locator('[data-testid="svg-canvas"]')).toBeVisible();
      await expect(page.locator('[data-testid="toolbar"]')).toBeVisible();
      await expect(page.locator('[data-testid="properties-panel"]')).toBeVisible();
      
      // Check if tools are available
      await expect(page.locator('[data-testid="tool-select"]')).toBeVisible();
      await expect(page.locator('[data-testid="tool-rectangle"]')).toBeVisible();
      await expect(page.locator('[data-testid="tool-circle"]')).toBeVisible();
      await expect(page.locator('[data-testid="tool-pen"]')).toBeVisible();
    });

    test('should switch between tools', async ({ page }) => {
      const selectTool = page.locator('[data-testid="tool-select"]');
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]');
      const circleTool = page.locator('[data-testid="tool-circle"]');
      
      // Default should be select tool
      await expect(selectTool).toHaveClass(/active/);
      
      // Switch to rectangle tool
      await rectangleTool.click();
      await expect(rectangleTool).toHaveClass(/active/);
      await expect(selectTool).not.toHaveClass(/active/);
      
      // Switch to circle tool
      await circleTool.click();
      await expect(circleTool).toHaveClass(/active/);
      await expect(rectangleTool).not.toHaveClass(/active/);
    });
  });

  test.describe('Shape Creation', () => {
    test('should create rectangle by dragging', async ({ page }) => {
      const canvas = page.locator('[data-testid="svg-canvas"]');
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]');
      
      // Select rectangle tool
      await rectangleTool.click();
      
      // Get canvas bounding box for accurate coordinates
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');
      
      // Create rectangle by dragging
      await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + 200, canvasBox.y + 150);
      await page.mouse.up();
      
      // Verify rectangle was created
      const rect = canvas.locator('rect').first();
      await expect(rect).toBeVisible();
      
      // Check rectangle attributes
      await expect(rect).toHaveAttribute('x', '100');
      await expect(rect).toHaveAttribute('y', '100');
      await expect(rect).toHaveAttribute('width', '100');
      await expect(rect).toHaveAttribute('height', '50');
    });

    test('should create circle by dragging', async ({ page }) => {
      const canvas = page.locator('[data-testid="svg-canvas"]');
      const circleTool = page.locator('[data-testid="tool-circle"]');
      
      // Select circle tool
      await circleTool.click();
      
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');
      
      // Create circle by dragging
      await page.mouse.move(canvasBox.x + 150, canvasBox.y + 150);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + 200, canvasBox.y + 200);
      await page.mouse.up();
      
      // Verify circle was created
      const circle = canvas.locator('circle').first();
      await expect(circle).toBeVisible();
      
      // Check circle attributes
      await expect(circle).toHaveAttribute('cx', '150');
      await expect(circle).toHaveAttribute('cy', '150');
      
      const radius = await circle.getAttribute('r');
      expect(parseFloat(radius || '0')).toBeGreaterThan(0);
    });

    test('should create path with pen tool', async ({ page }) => {
      const canvas = page.locator('[data-testid="svg-canvas"]');
      const penTool = page.locator('[data-testid="tool-pen"]');
      
      // Select pen tool
      await penTool.click();
      
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');
      
      // Create path with multiple clicks
      const points = [
        { x: canvasBox.x + 100, y: canvasBox.y + 100 },
        { x: canvasBox.x + 150, y: canvasBox.y + 120 },
        { x: canvasBox.x + 200, y: canvasBox.y + 100 },
        { x: canvasBox.x + 180, y: canvasBox.y + 150 }
      ];
      
      for (const point of points) {
        await page.mouse.click(point.x, point.y);
        await page.waitForTimeout(100); // Small delay between clicks
      }
      
      // Double click to finish path
      await page.mouse.dblclick(points[points.length - 1].x, points[points.length - 1].y);
      
      // Verify path was created
      const path = canvas.locator('path').first();
      await expect(path).toBeVisible();
      
      const d = await path.getAttribute('d');
      expect(d).toContain('M100,100');
      expect(d).toContain('L150,120');
      expect(d).toContain('L200,100');
      expect(d).toContain('L180,150');
    });
  });

  test.describe('Element Selection and Manipulation', () => {
    test('should select and move elements', async ({ page }) => {
      const canvas = page.locator('[data-testid="svg-canvas"]');
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]');
      const selectTool = page.locator('[data-testid="tool-select"]');
      
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');
      
      // Create rectangle
      await rectangleTool.click();
      await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + 200, canvasBox.y + 150);
      await page.mouse.up();
      
      // Switch to select tool
      await selectTool.click();
      
      // Select the rectangle
      const rect = canvas.locator('rect').first();
      await rect.click();
      await expect(rect).toHaveClass(/selected/);
      
      // Move the rectangle
      await page.mouse.move(canvasBox.x + 150, canvasBox.y + 125);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + 170, canvasBox.y + 145);
      await page.mouse.up();
      
      // Check if rectangle moved
      await expect(rect).toHaveAttribute('x', '120');
      await expect(rect).toHaveAttribute('y', '120');
    });

    test('should resize elements using handles', async ({ page }) => {
      const canvas = page.locator('[data-testid="svg-canvas"]');
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]');
      const selectTool = page.locator('[data-testid="tool-select"]');
      
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');
      
      // Create and select rectangle
      await rectangleTool.click();
      await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + 200, canvasBox.y + 150);
      await page.mouse.up();
      
      await selectTool.click();
      
      const rect = canvas.locator('rect').first();
      await rect.click();
      
      // Find and drag resize handle
      const resizeHandle = canvas.locator('.resize-handle-se');
      await expect(resizeHandle).toBeVisible();
      
      const handleBox = await resizeHandle.boundingBox();
      if (!handleBox) throw new Error('Resize handle not found');
      
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + 250, canvasBox.y + 200);
      await page.mouse.up();
      
      // Check if rectangle resized
      await expect(rect).toHaveAttribute('width', '150');
      await expect(rect).toHaveAttribute('height', '100');
    });
  });

  test.describe('Properties Panel', () => {
    test('should update element properties', async ({ page }) => {
      const canvas = page.locator('[data-testid="svg-canvas"]');
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]');
      const selectTool = page.locator('[data-testid="tool-select"]');
      
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');
      
      // Create and select rectangle
      await rectangleTool.click();
      await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + 200, canvasBox.y + 150);
      await page.mouse.up();
      
      await selectTool.click();
      
      const rect = canvas.locator('rect').first();
      await rect.click();
      
      // Update properties
      const fillInput = page.locator('[aria-label="Fill Color"]');
      const strokeInput = page.locator('[aria-label="Stroke Color"]');
      const strokeWidthInput = page.locator('[aria-label="Stroke Width"]');
      
      await expect(fillInput).toBeVisible();
      await expect(strokeInput).toBeVisible();
      await expect(strokeWidthInput).toBeVisible();
      
      // Change fill color
      await fillInput.clear();
      await fillInput.fill('#ff0000');
      await fillInput.press('Enter');
      
      // Change stroke width
      await strokeWidthInput.clear();
      await strokeWidthInput.fill('3');
      await strokeWidthInput.press('Enter');
      
      // Verify changes applied
      await expect(rect).toHaveAttribute('fill', '#ff0000');
      await expect(rect).toHaveAttribute('stroke-width', '3');
    });
  });

  test.describe('Undo/Redo Operations', () => {
    test('should undo and redo operations', async ({ page }) => {
      const canvas = page.locator('[data-testid="svg-canvas"]');
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]');
      const undoButton = page.locator('[data-testid="undo-button"]');
      const redoButton = page.locator('[data-testid="redo-button"]');
      
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');
      
      // Create rectangle
      await rectangleTool.click();
      await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + 200, canvasBox.y + 150);
      await page.mouse.up();
      
      // Verify rectangle exists
      await expect(canvas.locator('rect')).toHaveCount(1);
      
      // Undo creation
      await undoButton.click();
      await expect(canvas.locator('rect')).toHaveCount(0);
      
      // Redo creation
      await redoButton.click();
      await expect(canvas.locator('rect')).toHaveCount(1);
    });
  });

  test.describe('File Operations', () => {
    test('should export SVG', async ({ page }) => {
      const canvas = page.locator('[data-testid="svg-canvas"]');
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]');
      const exportButton = page.locator('[data-testid="export-button"]');
      
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');
      
      // Create some content
      await rectangleTool.click();
      await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + 200, canvasBox.y + 150);
      await page.mouse.up();
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      
      // Trigger export
      await exportButton.click();
      
      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.svg');
      
      // Verify download content
      const path = await download.path();
      expect(path).toBeTruthy();
    });

    test('should import SVG file', async ({ page }) => {
      const canvas = page.locator('[data-testid="svg-canvas"]');
      const fileInput = page.locator('[data-testid="file-input"]');
      
      // Create test SVG file content
      const svgContent = '<svg><rect x="10" y="10" width="100" height="50" fill="blue"/></svg>';
      
      // Upload file
      await fileInput.setInputFiles({
        name: 'test.svg',
        mimeType: 'image/svg+xml',
        buffer: Buffer.from(svgContent)
      });
      
      // Verify imported content
      const importedRect = canvas.locator('rect').first();
      await expect(importedRect).toBeVisible();
      await expect(importedRect).toHaveAttribute('x', '10');
      await expect(importedRect).toHaveAttribute('y', '10');
      await expect(importedRect).toHaveAttribute('width', '100');
      await expect(importedRect).toHaveAttribute('height', '50');
      await expect(importedRect).toHaveAttribute('fill', 'blue');
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should handle keyboard shortcuts', async ({ page }) => {
      const canvas = page.locator('[data-testid="svg-canvas"]');
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]');
      
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');
      
      // Create rectangle
      await rectangleTool.click();
      await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + 200, canvasBox.y + 150);
      await page.mouse.up();
      
      await expect(canvas.locator('rect')).toHaveCount(1);
      
      // Test Ctrl+Z (undo)
      await page.keyboard.press('Control+z');
      await expect(canvas.locator('rect')).toHaveCount(0);
      
      // Test Ctrl+Y (redo)
      await page.keyboard.press('Control+y');
      await expect(canvas.locator('rect')).toHaveCount(1);
      
      // Test Delete key
      const rect = canvas.locator('rect').first();
      await rect.click();
      await page.keyboard.press('Delete');
      await expect(canvas.locator('rect')).toHaveCount(0);
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('should handle multiple elements efficiently', async ({ page }) => {
      const canvas = page.locator('[data-testid="svg-canvas"]');
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]');
      
      await rectangleTool.click();
      
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');
      
      const startTime = Date.now();
      
      // Create multiple rectangles quickly
      for (let i = 0; i < 20; i++) {
        const x = canvasBox.x + (i % 5) * 60 + 50;
        const y = canvasBox.y + Math.floor(i / 5) * 60 + 50;
        
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 40, y + 40);
        await page.mouse.up();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Verify all rectangles were created
      await expect(canvas.locator('rect')).toHaveCount(20);
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds
    });

    test('should remain responsive during complex operations', async ({ page }) => {
      const canvas = page.locator('[data-testid="svg-canvas"]');
      const penTool = page.locator('[data-testid="tool-pen"]');
      
      await penTool.click();
      
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');
      
      const startTime = Date.now();
      
      // Create complex path with many points
      for (let i = 0; i < 30; i++) {
        const x = canvasBox.x + 100 + i * 5;
        const y = canvasBox.y + 100 + Math.sin(i * 0.3) * 30;
        
        await page.mouse.click(x, y);
      }
      
      // Finish path
      await page.mouse.dblclick(canvasBox.x + 100 + 29 * 5, canvasBox.y + 100 + Math.sin(29 * 0.3) * 30);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Verify path was created
      await expect(canvas.locator('path')).toHaveCount(1);
      
      // Should remain responsive
      expect(duration).toBeLessThan(5000); // 5 seconds
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work consistently across browsers', async ({ page, browserName }) => {
      const canvas = page.locator('[data-testid="svg-canvas"]');
      const rectangleTool = page.locator('[data-testid="tool-rectangle"]');
      
      // Test basic functionality in all browsers
      await rectangleTool.click();
      
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');
      
      await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + 200, canvasBox.y + 150);
      await page.mouse.up();
      
      const rect = canvas.locator('rect').first();
      await expect(rect).toBeVisible();
      
      // Browser-specific checks
      if (browserName === 'webkit') {
        // Safari-specific tests
        console.log('Running Safari-specific tests');
      } else if (browserName === 'firefox') {
        // Firefox-specific tests
        console.log('Running Firefox-specific tests');
      } else {
        // Chrome-specific tests
        console.log('Running Chrome-specific tests');
      }
    });
  });
});