/**
 * 对象池系统
 * 用于复用频繁创建的对象，减少垃圾回收压力
 */

export interface Poolable {
  reset(): void;
  isInUse(): boolean;
  setInUse(inUse: boolean): void;
}

export interface PoolOptions<T> {
  initialSize: number;
  maxSize: number;
  factory: () => T;
  reset?: (obj: T) => void;
  validate?: (obj: T) => boolean;
}

export class ObjectPool<T extends Poolable> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private options: PoolOptions<T>;
  private stats = {
    created: 0,
    borrowed: 0,
    returned: 0,
    destroyed: 0
  };

  constructor(options: PoolOptions<T>) {
    this.options = options;
    this.initialize();
  }

  /**
   * 初始化对象池
   */
  private initialize() {
    for (let i = 0; i < this.options.initialSize; i++) {
      const obj = this.createObject();
      this.available.push(obj);
    }
  }

  /**
   * 创建新对象
   */
  private createObject(): T {
    const obj = this.options.factory();
    obj.setInUse(false);
    this.stats.created++;
    return obj;
  }

  /**
   * 借用对象
   */
  borrow(): T {
    let obj: T;

    if (this.available.length > 0) {
      obj = this.available.pop()!;
    } else if (this.getTotalSize() < this.options.maxSize) {
      obj = this.createObject();
    } else {
      // 池已满，创建临时对象
      obj = this.createObject();
      console.warn('对象池已满，创建临时对象');
    }

    // 验证对象
    if (this.options.validate && !this.options.validate(obj)) {
      obj = this.createObject();
    }

    obj.setInUse(true);
    this.inUse.add(obj);
    this.stats.borrowed++;

    return obj;
  }

  /**
   * 归还对象
   */
  return(obj: T): boolean {
    if (!this.inUse.has(obj)) {
      console.warn('尝试归还不属于此池的对象');
      return false;
    }

    this.inUse.delete(obj);
    obj.setInUse(false);

    // 重置对象状态
    try {
      obj.reset();
      if (this.options.reset) {
        this.options.reset(obj);
      }
    } catch (error) {
      console.warn('重置对象失败:', error);
      this.stats.destroyed++;
      return false;
    }

    // 如果池未满，归还到池中
    if (this.available.length < this.options.maxSize) {
      this.available.push(obj);
      this.stats.returned++;
      return true;
    } else {
      // 池已满，销毁对象
      this.stats.destroyed++;
      return false;
    }
  }

  /**
   * 强制归还所有使用中的对象
   */
  returnAll() {
    const inUseArray = Array.from(this.inUse);
    for (const obj of inUseArray) {
      this.return(obj);
    }
  }

  /**
   * 清理池中的对象
   */
  clear() {
    this.returnAll();
    this.available.length = 0;
    this.inUse.clear();
  }

  /**
   * 调整池大小
   */
  resize(newSize: number) {
    if (newSize < 0) return;

    if (newSize > this.available.length) {
      // 增加对象
      const toAdd = newSize - this.available.length;
      for (let i = 0; i < toAdd; i++) {
        this.available.push(this.createObject());
      }
    } else if (newSize < this.available.length) {
      // 减少对象
      const toRemove = this.available.length - newSize;
      this.available.splice(newSize, toRemove);
      this.stats.destroyed += toRemove;
    }
  }

  /**
   * 获取池的总大小
   */
  getTotalSize(): number {
    return this.available.length + this.inUse.size;
  }

  /**
   * 获取可用对象数量
   */
  getAvailableCount(): number {
    return this.available.length;
  }

  /**
   * 获取使用中对象数量
   */
  getInUseCount(): number {
    return this.inUse.size;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      totalSize: this.getTotalSize(),
      availableCount: this.getAvailableCount(),
      inUseCount: this.getInUseCount(),
      utilizationRate: this.getTotalSize() > 0 ? this.getInUseCount() / this.getTotalSize() : 0
    };
  }
}

/**
 * 点对象（用于坐标计算）
 */
export class PooledPoint implements Poolable {
  public x: number = 0;
  public y: number = 0;
  private _inUse: boolean = false;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(other: PooledPoint): this {
    this.x = other.x;
    this.y = other.y;
    return this;
  }

  reset(): void {
    this.x = 0;
    this.y = 0;
  }

  isInUse(): boolean {
    return this._inUse;
  }

  setInUse(inUse: boolean): void {
    this._inUse = inUse;
  }
}

/**
 * 矩形对象（用于边界计算）
 */
export class PooledRect implements Poolable {
  public x: number = 0;
  public y: number = 0;
  public width: number = 0;
  public height: number = 0;
  private _inUse: boolean = false;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  set(x: number, y: number, width: number, height: number): this {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    return this;
  }

  copy(other: PooledRect): this {
    this.x = other.x;
    this.y = other.y;
    this.width = other.width;
    this.height = other.height;
    return this;
  }

  intersects(other: PooledRect): boolean {
    return !(this.x + this.width < other.x ||
             other.x + other.width < this.x ||
             this.y + this.height < other.y ||
             other.y + other.height < this.y);
  }

  contains(point: PooledPoint): boolean {
    return point.x >= this.x &&
           point.x <= this.x + this.width &&
           point.y >= this.y &&
           point.y <= this.y + this.height;
  }

  reset(): void {
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
  }

  isInUse(): boolean {
    return this._inUse;
  }

  setInUse(inUse: boolean): void {
    this._inUse = inUse;
  }
}

/**
 * 变换矩阵对象
 */
export class PooledMatrix implements Poolable {
  public a: number = 1;
  public b: number = 0;
  public c: number = 0;
  public d: number = 1;
  public e: number = 0;
  public f: number = 0;
  private _inUse: boolean = false;

  constructor() {
    this.identity();
  }

  identity(): this {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
    return this;
  }

  translate(x: number, y: number): this {
    this.e += this.a * x + this.c * y;
    this.f += this.b * x + this.d * y;
    return this;
  }

  scale(sx: number, sy: number = sx): this {
    this.a *= sx;
    this.b *= sx;
    this.c *= sy;
    this.d *= sy;
    return this;
  }

  rotate(angle: number): this {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const a = this.a;
    const b = this.b;
    const c = this.c;
    const d = this.d;

    this.a = a * cos - b * sin;
    this.b = a * sin + b * cos;
    this.c = c * cos - d * sin;
    this.d = c * sin + d * cos;
    return this;
  }

  multiply(other: PooledMatrix): this {
    const a = this.a * other.a + this.b * other.c;
    const b = this.a * other.b + this.b * other.d;
    const c = this.c * other.a + this.d * other.c;
    const d = this.c * other.b + this.d * other.d;
    const e = this.e * other.a + this.f * other.c + other.e;
    const f = this.e * other.b + this.f * other.d + other.f;

    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
    return this;
  }

  transformPoint(point: PooledPoint): PooledPoint {
    const x = this.a * point.x + this.c * point.y + this.e;
    const y = this.b * point.x + this.d * point.y + this.f;
    return point.set(x, y);
  }

  reset(): void {
    this.identity();
  }

  isInUse(): boolean {
    return this._inUse;
  }

  setInUse(inUse: boolean): void {
    this._inUse = inUse;
  }
}

// 全局对象池实例
export const pointPool = new ObjectPool<PooledPoint>({
  initialSize: 50,
  maxSize: 200,
  factory: () => new PooledPoint()
});

export const rectPool = new ObjectPool<PooledRect>({
  initialSize: 30,
  maxSize: 100,
  factory: () => new PooledRect()
});

export const matrixPool = new ObjectPool<PooledMatrix>({
  initialSize: 20,
  maxSize: 80,
  factory: () => new PooledMatrix()
});

/**
 * 对象池管理器
 */
export class PoolManager {
  private pools: Map<string, ObjectPool<any>> = new Map();

  constructor() {
    // 注册默认池
    this.registerPool('point', pointPool);
    this.registerPool('rect', rectPool);
    this.registerPool('matrix', matrixPool);
  }

  /**
   * 注册对象池
   */
  registerPool<T extends Poolable>(name: string, pool: ObjectPool<T>) {
    this.pools.set(name, pool);
  }

  /**
   * 获取对象池
   */
  getPool<T extends Poolable>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name);
  }

  /**
   * 清理所有池
   */
  clearAll() {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
  }

  /**
   * 获取所有池的统计信息
   */
  getAllStats() {
    const stats: Record<string, any> = {};
    for (const [name, pool] of this.pools) {
      stats[name] = pool.getStats();
    }
    return stats;
  }

  /**
   * 强制归还所有对象
   */
  returnAllObjects() {
    for (const pool of this.pools.values()) {
      pool.returnAll();
    }
  }
}

// 全局池管理器
export const globalPoolManager = new PoolManager();