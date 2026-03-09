/**
 * Web Worker用于后台渲染处理
 * 避免主线程阻塞，提升渲染性能
 */

interface RenderMessage {
  type: 'init' | 'render' | 'clear';
  canvas?: OffscreenCanvas;
  items?: Array<{
    id: string;
    element: string;
    bounds: DOMRect;
    zIndex: number;
  }>;
  viewport?: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
  };
}

let ctx: OffscreenCanvasRenderingContext2D | null = null;
let canvas: OffscreenCanvas | null = null;

// 元素缓存
const elementCache = new Map<string, ImageBitmap>();

// 监听主线程消息
self.addEventListener('message', async (event: MessageEvent<RenderMessage>) => {
  const { type, ...data } = event.data;

  switch (type) {
    case 'init':
      await initializeCanvas(data.canvas!);
      break;
    case 'render':
      await renderItems(data.items!, data.viewport!);
      break;
    case 'clear':
      clearCanvas();
      break;
  }
});

/**
 * 初始化Canvas
 */
async function initializeCanvas(offscreenCanvas: OffscreenCanvas) {
  canvas = offscreenCanvas;
  ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法获取OffscreenCanvas 2D上下文');
  }

  // 发送初始化完成消息
  self.postMessage({ type: 'initialized' });
}

/**
 * 渲染元素列表
 */
async function renderItems(
  items: Array<{
    id: string;
    element: string;
    bounds: DOMRect;
    zIndex: number;
  }>,
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
  }
) {
  if (!ctx || !canvas) return;

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 设置变换矩阵
  ctx.save();
  ctx.scale(viewport.scale, viewport.scale);
  ctx.translate(-viewport.x, -viewport.y);

  // 按z-index排序
  const sortedItems = items.sort((a, b) => a.zIndex - b.zIndex);

  // 批量处理元素
  const renderPromises = sortedItems.map(item => renderElement(item));
  await Promise.all(renderPromises);

  ctx.restore();

  // 将渲染结果传回主线程
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  self.postMessage({
    type: 'renderComplete',
    imageData
  });
}

/**
 * 渲染单个元素
 */
async function renderElement(item: {
  id: string;
  element: string;
  bounds: DOMRect;
  zIndex: number;
}) {
  if (!ctx) return;

  try {
    // 检查缓存
    let imageBitmap = elementCache.get(item.id);
    
    if (!imageBitmap) {
      // 创建新的ImageBitmap
      imageBitmap = await createImageBitmapFromSVG(item.element);
      
      // 缓存结果（限制缓存大小）
      if (elementCache.size < 1000) {
        elementCache.set(item.id, imageBitmap);
      }
    }

    // 绘制到画布
    if (imageBitmap) {
      ctx.drawImage(
        imageBitmap,
        item.bounds.x,
        item.bounds.y,
        item.bounds.width,
        item.bounds.height
      );
    }
  } catch (error) {
    console.warn(`渲染元素失败: ${item.id}`, error);
  }
}

/**
 * 从SVG字符串创建ImageBitmap
 */
async function createImageBitmapFromSVG(svgString: string): Promise<ImageBitmap> {
  // 创建Blob
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  
  // 创建ImageBitmap
  return await createImageBitmap(blob);
}

/**
 * 清空画布
 */
function clearCanvas() {
  if (!ctx || !canvas) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 清空缓存
  elementCache.clear();
}

/**
 * 清理缓存中的过期元素
 */
function cleanupCache() {
  // 如果缓存过大，清理一半
  if (elementCache.size > 1000) {
    const entries = Array.from(elementCache.entries());
    const toDelete = entries.slice(0, Math.floor(entries.length / 2));
    
    for (const [key] of toDelete) {
      const bitmap = elementCache.get(key);
      if (bitmap) {
        bitmap.close(); // 释放ImageBitmap资源
      }
      elementCache.delete(key);
    }
  }
}

// 定期清理缓存
setInterval(cleanupCache, 30000); // 每30秒清理一次

// 错误处理
self.addEventListener('error', (error) => {
  console.error('Render Worker错误:', error);
  self.postMessage({
    type: 'error',
    error: error.message
  });
});

// 未捕获的Promise错误
self.addEventListener('unhandledrejection', (event) => {
  console.error('Render Worker未处理的Promise错误:', event.reason);
  self.postMessage({
    type: 'error',
    error: event.reason
  });
});