import { Redis } from 'ioredis'

// 缓存管理器类
export class CacheManager {
  private redis: Redis | null = null
  private memoryCache: Map<string, { data: any; expiry: number }> = new Map()
  private readonly defaultTTL = 300 // 5分钟默认过期时间

  constructor() {
    this.initRedis()
  }

  private initRedis() {
    try {
      // 如果有Redis配置，初始化Redis客户端
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL)
        console.log('Redis cache initialized')
      } else {
        console.log('Redis not configured, using memory cache')
      }
    } catch (error) {
      console.warn('Failed to initialize Redis, falling back to memory cache:', error)
      this.redis = null
    }
  }

  /**
   * 获取缓存数据，如果不存在则执行fetcher函数获取数据并缓存
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    try {
      // 尝试从缓存获取数据
      const cached = await this.get<T>(key)
      if (cached !== null) {
        return cached
      }

      // 缓存未命中，执行fetcher获取数据
      const data = await fetcher()
      
      // 将数据存入缓存
      await this.set(key, data, ttl)
      
      return data
    } catch (error) {
      console.error('Cache getOrSet error:', error)
      // 如果缓存出错，直接执行fetcher
      return await fetcher()
    }
  }

  /**
   * 获取缓存数据
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redis) {
        const data = await this.redis.get(key)
        return data ? JSON.parse(data) : null
      } else {
        return this.getFromMemory<T>(key)
      }
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * 设置缓存数据
   */
  async set(key: string, data: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(data))
      } else {
        this.setToMemory(key, data, ttl)
      }
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * 删除缓存数据
   */
  async del(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key)
      } else {
        this.memoryCache.delete(key)
      }
    } catch (error) {
      console.error('Cache del error:', error)
    }
  }

  /**
   * 批量删除匹配模式的缓存
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      } else {
        // 内存缓存模式匹配删除
        const regex = new RegExp(pattern.replace(/\*/g, '.*'))
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key)
          }
        }
      }
    } catch (error) {
      console.error('Cache invalidatePattern error:', error)
    }
  }

  /**
   * 清空所有缓存
   */
  async flush(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.flushall()
      } else {
        this.memoryCache.clear()
      }
    } catch (error) {
      console.error('Cache flush error:', error)
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<{
    type: 'redis' | 'memory'
    keys: number
    memory?: string
  }> {
    try {
      if (this.redis) {
        const info = await this.redis.info('memory')
        const keyspace = await this.redis.info('keyspace')
        const keys = keyspace.match(/keys=(\d+)/)?.[1] || '0'
        const memory = info.match(/used_memory_human:([^\r\n]+)/)?.[1] || 'unknown'
        
        return {
          type: 'redis',
          keys: parseInt(keys),
          memory
        }
      } else {
        return {
          type: 'memory',
          keys: this.memoryCache.size
        }
      }
    } catch (error) {
      console.error('Cache getStats error:', error)
      return {
        type: this.redis ? 'redis' : 'memory',
        keys: 0
      }
    }
  }

  /**
   * 从内存缓存获取数据
   */
  private getFromMemory<T>(key: string): T | null {
    const cached = this.memoryCache.get(key)
    if (!cached) return null
    
    // 检查是否过期
    if (Date.now() > cached.expiry) {
      this.memoryCache.delete(key)
      return null
    }
    
    return cached.data
  }

  /**
   * 设置内存缓存数据
   */
  private setToMemory(key: string, data: any, ttl: number): void {
    const expiry = Date.now() + (ttl * 1000)
    this.memoryCache.set(key, { data, expiry })
    
    // 定期清理过期的内存缓存
    this.cleanupMemoryCache()
  }

  /**
   * 清理过期的内存缓存
   */
  private cleanupMemoryCache(): void {
    const now = Date.now()
    for (const [key, value] of this.memoryCache.entries()) {
      if (now > value.expiry) {
        this.memoryCache.delete(key)
      }
    }
  }

  /**
   * 关闭缓存连接
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
    }
    this.memoryCache.clear()
  }
}

// 缓存键生成器
export class CacheKeyGenerator {
  private static readonly PREFIX = 'dashboard'
  
  static analytics(userId: string, timeRange: string, metrics: string[]): string {
    return `${this.PREFIX}:analytics:${userId}:${timeRange}:${metrics.sort().join(',')}`
  }
  
  static userBehavior(userId: string): string {
    return `${this.PREFIX}:user-behavior:${userId}`
  }
  
  static aiAnalytics(userId: string): string {
    return `${this.PREFIX}:ai-analytics:${userId}`
  }
  
  static recentEdits(userId: string): string {
    return `${this.PREFIX}:recent-edits:${userId}`
  }
  
  static stats(userId: string): string {
    return `${this.PREFIX}:stats:${userId}`
  }
  
  static systemHealth(): string {
    return `${this.PREFIX}:system:health`
  }
  
  static recommendations(userId: string): string {
    return `${this.PREFIX}:recommendations:${userId}`
  }
  
  static userPattern(userId: string): string {
    return `${this.PREFIX}:user:*:${userId}*`
  }
  
  static allDashboard(): string {
    return `${this.PREFIX}:*`
  }
}

// 缓存装饰器
export function cached(ttl: number = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`
      const cache = new CacheManager()
      
      return await cache.getOrSet(
        cacheKey,
        () => method.apply(this, args),
        ttl
      )
    }
    
    return descriptor
  }
}

// 全局缓存实例
export const cache = new CacheManager()

// 缓存中间件（用于API路由）
export function withCache(ttl: number = 300) {
  return function (handler: (req: any, res: any) => Promise<any>) {
    return async function (req: any, res: any) {
      const cacheKey = `api:${req.url}:${JSON.stringify(req.query)}`
      
      try {
        const cached = await cache.get(cacheKey)
        if (cached) {
          return res.json(cached)
        }
        
        // 执行原始处理器
        const result = await handler(req, res)
        
        // 如果返回的是Response对象，缓存其数据
        if (result && typeof result.json === 'function') {
          const data = await result.json()
          await cache.set(cacheKey, data, ttl)
          return res.json(data)
        }
        
        return result
      } catch (error) {
        console.error('Cache middleware error:', error)
        return handler(req, res)
      }
    }
  }
}