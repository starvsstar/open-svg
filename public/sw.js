/**
 * Service Worker for SVG Editor
 * 提供离线缓存支持和性能优化
 */

const CACHE_NAME = 'svg-editor-v1.0.0';
const STATIC_CACHE = 'svg-editor-static-v1.0.0';
const DYNAMIC_CACHE = 'svg-editor-dynamic-v1.0.0';
const API_CACHE = 'svg-editor-api-v1.0.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/svg-editor',
  '/studio',
  '/manifest.json',
  '/favicon.ico',
  // CSS 文件
  '/styles/globals.css',
  '/styles/editor.css',
  // JavaScript 文件
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/framework.js',
  // 字体文件
  '/fonts/inter.woff2',
  '/fonts/lucide-icons.woff2',
  // 图标文件
  '/images/logo.svg',
  '/images/tools/select.svg',
  '/images/tools/rectangle.svg',
  '/images/tools/circle.svg',
  '/images/tools/text.svg'
];

// 需要缓存的API路径
const API_ROUTES = [
  '/api/svgs',
  '/api/templates',
  '/api/user'
];

// 缓存策略配置
const CACHE_STRATEGIES = {
  // 静态资源：缓存优先
  static: 'cache-first',
  // API请求：网络优先，降级到缓存
  api: 'network-first',
  // 动态内容：网络优先
  dynamic: 'network-first',
  // 图片：缓存优先
  images: 'cache-first'
};

// 缓存过期时间（毫秒）
const CACHE_EXPIRY = {
  static: 7 * 24 * 60 * 60 * 1000, // 7天
  api: 1 * 60 * 60 * 1000, // 1小时
  dynamic: 24 * 60 * 60 * 1000, // 1天
  images: 30 * 24 * 60 * 60 * 1000 // 30天
};

/**
 * Service Worker 安装事件
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker 安装中...');
  
  event.waitUntil(
    Promise.all([
      // 缓存静态资源
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('缓存静态资源...');
        return cache.addAll(STATIC_ASSETS);
      }),
      // 跳过等待，立即激活
      self.skipWaiting()
    ])
  );
});

/**
 * Service Worker 激活事件
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker 激活中...');
  
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      cleanupOldCaches(),
      // 立即控制所有客户端
      self.clients.claim()
    ])
  );
});

/**
 * 网络请求拦截
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }
  
  // 根据请求类型选择缓存策略
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isApiRequest(url.pathname)) {
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(url.pathname)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

/**
 * 处理静态资源请求
 */
async function handleStaticAsset(request) {
  try {
    // 缓存优先策略
    const cachedResponse = await caches.match(request, {
      cacheName: STATIC_CACHE
    });
    
    if (cachedResponse && !isExpired(cachedResponse, CACHE_EXPIRY.static)) {
      return cachedResponse;
    }
    
    // 缓存未命中或已过期，从网络获取
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('静态资源请求失败:', error);
    
    // 网络失败，返回缓存（即使过期）
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 返回离线页面或默认响应
    return createOfflineResponse(request);
  }
}

/**
 * 处理API请求
 */
async function handleApiRequest(request) {
  try {
    // 网络优先策略
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 缓存成功的API响应
      const cache = await caches.open(API_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('API请求失败，尝试使用缓存:', error);
    
    // 网络失败，尝试从缓存获取
    const cachedResponse = await caches.match(request, {
      cacheName: API_CACHE
    });
    
    if (cachedResponse && !isExpired(cachedResponse, CACHE_EXPIRY.api)) {
      // 添加离线标识
      const response = cachedResponse.clone();
      response.headers.set('X-Served-From', 'cache');
      return response;
    }
    
    // 返回离线API响应
    return createOfflineApiResponse(request);
  }
}

/**
 * 处理图片请求
 */
async function handleImageRequest(request) {
  try {
    // 缓存优先策略
    const cachedResponse = await caches.match(request, {
      cacheName: DYNAMIC_CACHE
    });
    
    if (cachedResponse && !isExpired(cachedResponse, CACHE_EXPIRY.images)) {
      return cachedResponse;
    }
    
    // 从网络获取
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('图片请求失败:', error);
    
    // 返回缓存或占位图
    const cachedResponse = await caches.match(request);
    return cachedResponse || createPlaceholderImage();
  }
}

/**
 * 处理动态请求
 */
async function handleDynamicRequest(request) {
  try {
    // 网络优先策略
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('动态请求失败:', error);
    
    // 尝试从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 返回离线页面
    return createOfflineResponse(request);
  }
}

/**
 * 判断是否为静态资源
 */
function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/static/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico'
  );
}

/**
 * 判断是否为API请求
 */
function isApiRequest(pathname) {
  return pathname.startsWith('/api/');
}

/**
 * 判断是否为图片请求
 */
function isImageRequest(pathname) {
  return (
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp')
  );
}

/**
 * 检查响应是否过期
 */
function isExpired(response, maxAge) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseTime = new Date(dateHeader).getTime();
  const now = Date.now();
  
  return (now - responseTime) > maxAge;
}

/**
 * 清理旧缓存
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  
  const deletePromises = cacheNames
    .filter(cacheName => !currentCaches.includes(cacheName))
    .map(cacheName => {
      console.log('删除旧缓存:', cacheName);
      return caches.delete(cacheName);
    });
  
  await Promise.all(deletePromises);
}

/**
 * 创建离线响应
 */
function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  if (url.pathname === '/' || url.pathname.startsWith('/svg-editor')) {
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>SVG Editor - 离线模式</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .offline-message { color: #666; }
          .retry-button { 
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer; 
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>SVG Editor</h1>
        <div class="offline-message">
          <p>您当前处于离线模式</p>
          <p>请检查网络连接后重试</p>
          <button class="retry-button" onclick="location.reload()">重试</button>
        </div>
      </body>
      </html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Served-From': 'service-worker'
        }
      }
    );
  }
  
  return new Response('离线模式', {
    status: 503,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Served-From': 'service-worker'
    }
  });
}

/**
 * 创建离线API响应
 */
function createOfflineApiResponse(request) {
  const url = new URL(request.url);
  
  // 根据API路径返回不同的离线响应
  if (url.pathname.includes('/svgs')) {
    return new Response(
      JSON.stringify({
        error: '离线模式',
        message: '无法连接到服务器，请检查网络连接',
        offline: true
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Served-From': 'service-worker'
        }
      }
    );
  }
  
  return new Response(
    JSON.stringify({ error: '服务不可用', offline: true }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Served-From': 'service-worker'
      }
    }
  );
}

/**
 * 创建占位图片
 */
function createPlaceholderImage() {
  // 创建一个简单的SVG占位图
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
      <text x="100" y="100" text-anchor="middle" dy=".3em" fill="#999">图片加载失败</text>
    </svg>
  `;
  
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'X-Served-From': 'service-worker'
    }
  });
}

/**
 * 处理消息事件
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage({ type: 'CACHE_STATS', payload: stats });
      });
      break;
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
  }
});

/**
 * 获取缓存统计信息
 */
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = keys.length;
  }
  
  return stats;
}

/**
 * 清空所有缓存
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}

console.log('Service Worker 已加载');