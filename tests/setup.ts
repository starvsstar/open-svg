/**
 * Jest测试环境设置
 * 配置全局测试环境和模拟
 */

import '@testing-library/jest-dom';
import 'jest-canvas-mock';

// 模拟ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// 模拟IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// 模拟MutationObserver
global.MutationObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}));

// 模拟PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}));

// 模拟requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

// 模拟performance API
Object.defineProperty(global.performance, 'now', {
  writable: true,
  value: jest.fn(() => Date.now())
});

Object.defineProperty(global.performance, 'memory', {
  writable: true,
  value: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000
  }
});

// 模拟URL.createObjectURL和URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// 模拟Blob
global.Blob = jest.fn().mockImplementation((content, options) => ({
  content,
  options,
  size: content ? content.join('').length : 0,
  type: options?.type || ''
}));

// 模拟File
global.File = jest.fn().mockImplementation((content, name, options) => ({
  content,
  name,
  options,
  size: content ? content.join('').length : 0,
  type: options?.type || '',
  lastModified: Date.now()
}));

// 模拟FileReader
global.FileReader = jest.fn().mockImplementation(() => ({
  readAsText: jest.fn(function(this: any, file: any) {
    this.result = file.content ? file.content.join('') : '';
    setTimeout(() => this.onload?.({ target: this }), 0);
  }),
  readAsDataURL: jest.fn(function(this: any, file: any) {
    this.result = `data:${file.type};base64,mock-base64-data`;
    setTimeout(() => this.onload?.({ target: this }), 0);
  }),
  onload: null,
  onerror: null,
  result: null
}));

// 模拟Image
global.Image = jest.fn().mockImplementation(() => {
  const img = {
    onload: null as any,
    onerror: null as any,
    src: '',
    width: 100,
    height: 100,
    crossOrigin: null
  };
  
  Object.defineProperty(img, 'src', {
    set(value: string) {
      setTimeout(() => {
        if (img.onload) {
          img.onload();
        }
      }, 0);
    },
    get() {
      return '';
    }
  });
  
  return img;
});

// 模拟Canvas相关API
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === '2d') {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1
      })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1
      })),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      scale: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      arc: jest.fn(),
      rect: jest.fn(),
      measureText: jest.fn(() => ({ width: 10 })),
      canvas: {
        width: 800,
        height: 600
      }
    };
  }
  return null;
});

// 模拟SVG相关API
Object.defineProperty(SVGElement.prototype, 'getBBox', {
  writable: true,
  value: jest.fn(() => ({
    x: 0,
    y: 0,
    width: 100,
    height: 100
  }))
});

Object.defineProperty(SVGElement.prototype, 'getBoundingClientRect', {
  writable: true,
  value: jest.fn(() => ({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    bottom: 100,
    right: 100
  }))
});

// 模拟XMLSerializer
global.XMLSerializer = jest.fn().mockImplementation(() => ({
  serializeToString: jest.fn((element) => '<svg></svg>')
}));

// 模拟DOMParser
global.DOMParser = jest.fn().mockImplementation(() => ({
  parseFromString: jest.fn((str, type) => {
    const doc = {
      querySelector: jest.fn(() => ({
        children: [],
        tagName: 'svg',
        attributes: [],
        getAttribute: jest.fn(() => ''),
        textContent: ''
      }))
    };
    return doc;
  })
}));

// 模拟localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// 模拟sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// 模拟navigator
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: jest.fn(() => Promise.resolve({
      scope: '/',
      installing: null,
      waiting: null,
      active: null,
      addEventListener: jest.fn(),
      update: jest.fn(() => Promise.resolve())
    })),
    controller: null,
    addEventListener: jest.fn()
  }
});

// 模拟Worker
global.Worker = jest.fn().mockImplementation(() => ({
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

// 模拟OffscreenCanvas
global.OffscreenCanvas = jest.fn().mockImplementation((width, height) => ({
  width,
  height,
  getContext: jest.fn(() => ({
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1
    }))
  }))
}));

// 模拟createImageBitmap
global.createImageBitmap = jest.fn(() => 
  Promise.resolve({
    width: 100,
    height: 100,
    close: jest.fn()
  })
);

// 模拟fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob())
  })
) as jest.Mock;

// 模拟console方法以避免测试输出污染
const originalConsole = { ...console };
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// 清理定时器
afterEach(() => {
  jest.clearAllTimers();
});

// 设置测试超时
jest.setTimeout(10000);

// 全局测试工具函数
global.createMockSVGElement = () => ({
  id: jest.fn(() => 'mock-id'),
  svg: jest.fn(() => '<svg></svg>'),
  bbox: jest.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
  fill: jest.fn(),
  stroke: jest.fn(),
  opacity: jest.fn(),
  transform: jest.fn(() => ({ rotate: 0 })),
  attr: jest.fn(),
  addClass: jest.fn(),
  removeClass: jest.fn(),
  selectize: jest.fn(),
  draggable: jest.fn(),
  type: 'rect',
  node: document.createElement('rect')
});

global.createMockSVGInstance = () => ({
  size: jest.fn(),
  rect: jest.fn(() => global.createMockSVGElement()),
  circle: jest.fn(() => global.createMockSVGElement()),
  text: jest.fn(() => global.createMockSVGElement()),
  polygon: jest.fn(() => global.createMockSVGElement()),
  path: jest.fn(() => global.createMockSVGElement()),
  group: jest.fn(() => global.createMockSVGElement()),
  add: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
  svg: jest.fn(() => '<svg></svg>'),
  node: document.createElement('svg'),
  on: jest.fn(),
  off: jest.fn(),
  find: jest.fn(() => []),
  findOne: jest.fn(() => null),
  first: jest.fn(() => global.createMockSVGElement()),
  width: jest.fn(() => 800),
  height: jest.fn(() => 600)
});

console.log('测试环境设置完成');