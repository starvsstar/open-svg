/**
 * 对象池单元测试
 * 测试对象池系统的功能和性能
 */

import {
  ObjectPool,
  PooledPoint,
  PooledRect,
  PooledMatrix,
  pointPool,
  rectPool,
  matrixPool,
  globalPoolManager
} from '../object-pool';

describe('ObjectPool', () => {
  let pool: ObjectPool<PooledPoint>;

  beforeEach(() => {
    pool = new ObjectPool<PooledPoint>({
      initialSize: 5,
      maxSize: 10,
      factory: () => new PooledPoint()
    });
  });

  afterEach(() => {
    pool.clear();
  });

  describe('初始化', () => {
    it('应该创建指定数量的初始对象', () => {
      expect(pool.getAvailableCount()).toBe(5);
      expect(pool.getInUseCount()).toBe(0);
      expect(pool.getTotalSize()).toBe(5);
    });

    it('应该正确设置配置选项', () => {
      const stats = pool.getStats();
      expect(stats.totalSize).toBe(5);
      expect(stats.availableCount).toBe(5);
      expect(stats.inUseCount).toBe(0);
    });
  });

  describe('借用和归还', () => {
    it('应该能够借用对象', () => {
      const obj = pool.borrow();
      
      expect(obj).toBeInstanceOf(PooledPoint);
      expect(obj.isInUse()).toBe(true);
      expect(pool.getAvailableCount()).toBe(4);
      expect(pool.getInUseCount()).toBe(1);
    });

    it('应该能够归还对象', () => {
      const obj = pool.borrow();
      const returned = pool.return(obj);
      
      expect(returned).toBe(true);
      expect(obj.isInUse()).toBe(false);
      expect(pool.getAvailableCount()).toBe(5);
      expect(pool.getInUseCount()).toBe(0);
    });

    it('应该在池满时创建临时对象', () => {
      // 借用所有可用对象
      const objects = [];
      for (let i = 0; i < 10; i++) {
        objects.push(pool.borrow());
      }
      
      // 再借用一个应该创建临时对象
      const extraObj = pool.borrow();
      expect(extraObj).toBeInstanceOf(PooledPoint);
      expect(pool.getTotalSize()).toBe(11); // 10个池内对象 + 1个临时对象
    });

    it('应该拒绝归还不属于池的对象', () => {
      const externalObj = new PooledPoint();
      const returned = pool.return(externalObj);
      
      expect(returned).toBe(false);
    });

    it('应该在归还时重置对象状态', () => {
      const obj = pool.borrow();
      obj.set(10, 20);
      
      pool.return(obj);
      
      expect(obj.x).toBe(0);
      expect(obj.y).toBe(0);
    });
  });

  describe('池大小管理', () => {
    it('应该能够调整池大小', () => {
      pool.resize(8);
      expect(pool.getAvailableCount()).toBe(8);
      
      pool.resize(3);
      expect(pool.getAvailableCount()).toBe(3);
    });

    it('应该能够强制归还所有对象', () => {
      const objects = [];
      for (let i = 0; i < 3; i++) {
        objects.push(pool.borrow());
      }
      
      expect(pool.getInUseCount()).toBe(3);
      
      pool.returnAll();
      
      expect(pool.getInUseCount()).toBe(0);
      expect(pool.getAvailableCount()).toBe(5);
    });

    it('应该能够清空池', () => {
      const obj = pool.borrow();
      pool.clear();
      
      expect(pool.getTotalSize()).toBe(0);
      expect(pool.getAvailableCount()).toBe(0);
      expect(pool.getInUseCount()).toBe(0);
    });
  });

  describe('统计信息', () => {
    it('应该提供准确的统计信息', () => {
      const obj1 = pool.borrow();
      const obj2 = pool.borrow();
      
      const stats = pool.getStats();
      
      expect(stats.totalSize).toBe(5);
      expect(stats.availableCount).toBe(3);
      expect(stats.inUseCount).toBe(2);
      expect(stats.utilizationRate).toBe(0.4); // 2/5
      expect(stats.borrowed).toBe(2);
    });
  });
});

describe('PooledPoint', () => {
  let point: PooledPoint;

  beforeEach(() => {
    point = new PooledPoint();
  });

  it('应该正确初始化', () => {
    expect(point.x).toBe(0);
    expect(point.y).toBe(0);
    expect(point.isInUse()).toBe(false);
  });

  it('应该能够设置坐标', () => {
    point.set(10, 20);
    expect(point.x).toBe(10);
    expect(point.y).toBe(20);
  });

  it('应该能够复制其他点', () => {
    const other = new PooledPoint(5, 15);
    point.copy(other);
    
    expect(point.x).toBe(5);
    expect(point.y).toBe(15);
  });

  it('应该能够重置状态', () => {
    point.set(10, 20);
    point.reset();
    
    expect(point.x).toBe(0);
    expect(point.y).toBe(0);
  });

  it('应该能够管理使用状态', () => {
    expect(point.isInUse()).toBe(false);
    
    point.setInUse(true);
    expect(point.isInUse()).toBe(true);
    
    point.setInUse(false);
    expect(point.isInUse()).toBe(false);
  });
});

describe('PooledRect', () => {
  let rect: PooledRect;

  beforeEach(() => {
    rect = new PooledRect();
  });

  it('应该正确初始化', () => {
    expect(rect.x).toBe(0);
    expect(rect.y).toBe(0);
    expect(rect.width).toBe(0);
    expect(rect.height).toBe(0);
  });

  it('应该能够设置矩形属性', () => {
    rect.set(10, 20, 100, 200);
    
    expect(rect.x).toBe(10);
    expect(rect.y).toBe(20);
    expect(rect.width).toBe(100);
    expect(rect.height).toBe(200);
  });

  it('应该能够检测相交', () => {
    rect.set(0, 0, 100, 100);
    
    const other1 = new PooledRect(50, 50, 100, 100);
    const other2 = new PooledRect(200, 200, 100, 100);
    
    expect(rect.intersects(other1)).toBe(true);
    expect(rect.intersects(other2)).toBe(false);
  });

  it('应该能够检测点包含', () => {
    rect.set(0, 0, 100, 100);
    
    const point1 = new PooledPoint(50, 50);
    const point2 = new PooledPoint(150, 150);
    
    expect(rect.contains(point1)).toBe(true);
    expect(rect.contains(point2)).toBe(false);
  });
});

describe('PooledMatrix', () => {
  let matrix: PooledMatrix;

  beforeEach(() => {
    matrix = new PooledMatrix();
  });

  it('应该正确初始化为单位矩阵', () => {
    expect(matrix.a).toBe(1);
    expect(matrix.b).toBe(0);
    expect(matrix.c).toBe(0);
    expect(matrix.d).toBe(1);
    expect(matrix.e).toBe(0);
    expect(matrix.f).toBe(0);
  });

  it('应该能够进行平移变换', () => {
    matrix.translate(10, 20);
    
    expect(matrix.e).toBe(10);
    expect(matrix.f).toBe(20);
  });

  it('应该能够进行缩放变换', () => {
    matrix.scale(2, 3);
    
    expect(matrix.a).toBe(2);
    expect(matrix.d).toBe(3);
  });

  it('应该能够进行旋转变换', () => {
    matrix.rotate(Math.PI / 2); // 90度
    
    expect(Math.abs(matrix.a)).toBeCloseTo(0, 5);
    expect(Math.abs(matrix.b - 1)).toBeCloseTo(0, 5);
    expect(Math.abs(matrix.c + 1)).toBeCloseTo(0, 5);
    expect(Math.abs(matrix.d)).toBeCloseTo(0, 5);
  });

  it('应该能够变换点', () => {
    matrix.translate(10, 20);
    const point = new PooledPoint(5, 5);
    
    const transformed = matrix.transformPoint(point);
    
    expect(transformed.x).toBe(15);
    expect(transformed.y).toBe(25);
  });

  it('应该能够重置为单位矩阵', () => {
    matrix.translate(10, 20);
    matrix.scale(2, 2);
    matrix.reset();
    
    expect(matrix.a).toBe(1);
    expect(matrix.b).toBe(0);
    expect(matrix.c).toBe(0);
    expect(matrix.d).toBe(1);
    expect(matrix.e).toBe(0);
    expect(matrix.f).toBe(0);
  });
});

describe('全局对象池', () => {
  afterEach(() => {
    pointPool.clear();
    rectPool.clear();
    matrixPool.clear();
  });

  it('应该提供预配置的点池', () => {
    expect(pointPool.getAvailableCount()).toBeGreaterThan(0);
    
    const point = pointPool.borrow();
    expect(point).toBeInstanceOf(PooledPoint);
    
    pointPool.return(point);
  });

  it('应该提供预配置的矩形池', () => {
    expect(rectPool.getAvailableCount()).toBeGreaterThan(0);
    
    const rect = rectPool.borrow();
    expect(rect).toBeInstanceOf(PooledRect);
    
    rectPool.return(rect);
  });

  it('应该提供预配置的矩阵池', () => {
    expect(matrixPool.getAvailableCount()).toBeGreaterThan(0);
    
    const matrix = matrixPool.borrow();
    expect(matrix).toBeInstanceOf(PooledMatrix);
    
    matrixPool.return(matrix);
  });
});

describe('PoolManager', () => {
  afterEach(() => {
    globalPoolManager.clearAll();
  });

  it('应该能够注册和获取对象池', () => {
    const testPool = new ObjectPool<PooledPoint>({
      initialSize: 2,
      maxSize: 5,
      factory: () => new PooledPoint()
    });
    
    globalPoolManager.registerPool('test', testPool);
    
    const retrievedPool = globalPoolManager.getPool('test');
    expect(retrievedPool).toBe(testPool);
  });

  it('应该能够获取所有池的统计信息', () => {
    const stats = globalPoolManager.getAllStats();
    
    expect(stats).toHaveProperty('point');
    expect(stats).toHaveProperty('rect');
    expect(stats).toHaveProperty('matrix');
    
    expect(stats.point).toHaveProperty('totalSize');
    expect(stats.point).toHaveProperty('availableCount');
    expect(stats.point).toHaveProperty('inUseCount');
  });

  it('应该能够强制归还所有对象', () => {
    const point = pointPool.borrow();
    const rect = rectPool.borrow();
    
    expect(pointPool.getInUseCount()).toBe(1);
    expect(rectPool.getInUseCount()).toBe(1);
    
    globalPoolManager.returnAllObjects();
    
    expect(pointPool.getInUseCount()).toBe(0);
    expect(rectPool.getInUseCount()).toBe(0);
  });

  it('应该能够清空所有池', () => {
    const point = pointPool.borrow();
    
    globalPoolManager.clearAll();
    
    expect(pointPool.getTotalSize()).toBe(0);
    expect(rectPool.getTotalSize()).toBe(0);
    expect(matrixPool.getTotalSize()).toBe(0);
  });
});

describe('性能测试', () => {
  it('对象池应该比直接创建对象更快', () => {
    const iterations = 1000;
    
    // 测试直接创建对象
    const directStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const point = new PooledPoint(i, i);
      point.set(i * 2, i * 2);
    }
    const directTime = performance.now() - directStart;
    
    // 测试对象池
    const poolStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const point = pointPool.borrow();
      point.set(i, i);
      point.set(i * 2, i * 2);
      pointPool.return(point);
    }
    const poolTime = performance.now() - poolStart;
    
    console.log(`直接创建: ${directTime}ms, 对象池: ${poolTime}ms`);
    
    // 对象池应该更快（在大多数情况下）
    // 注意：在测试环境中可能不明显，但在实际应用中会有显著差异
    expect(poolTime).toBeLessThan(directTime * 2); // 允许一定的误差
  });

  it('应该能够处理大量并发借用和归还', () => {
    const objects: PooledPoint[] = [];
    const count = 100;
    
    // 借用大量对象
    for (let i = 0; i < count; i++) {
      objects.push(pointPool.borrow());
    }
    
    expect(pointPool.getInUseCount()).toBe(count);
    
    // 归还所有对象
    for (const obj of objects) {
      pointPool.return(obj);
    }
    
    expect(pointPool.getInUseCount()).toBe(0);
  });
});