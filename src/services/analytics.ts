import { db } from '@/lib/db'
import { cache, CacheKeyGenerator } from '@/lib/cache'

// 分析选项接口
export interface AnalyticsOptions {
  timeRange: 'day' | 'week' | 'month' | 'quarter' | 'year'
  metrics?: string[]
  groupBy?: 'hour' | 'day' | 'week' | 'month'
  filters?: {
    category?: string
    isPublic?: boolean
    aiModel?: string
  }
}

// 历史数据接口
export interface HistoricalData {
  dates: string[]
  values: number[]
  metric: string
}

// 预测结果接口
export interface PredictionResult {
  date: string
  predicted: number
  confidence: number
}

// 趋势分析结果接口
export interface TrendAnalysis {
  metric: string
  direction: 'up' | 'down' | 'stable'
  confidence: number
  changeRate: number
}

/**
 * 数据分析服务类
 * 提供复杂的数据聚合、分析和预测功能
 */
export class AnalyticsService {
  private readonly cacheTTL = 300 // 5分钟缓存

  /**
   * 获取用户综合分析数据
   */
  async getUserAnalytics(userId: string, options: AnalyticsOptions) {
    const cacheKey = CacheKeyGenerator.analytics(
      userId, 
      options.timeRange, 
      options.metrics || []
    )

    return await cache.getOrSet(
      cacheKey,
      async () => {
        const timeRange = this.getTimeRange(options.timeRange)
        
        // 并行获取各种统计数据
        const [overview, trends, distributions] = await Promise.all([
          this.getOverviewData(userId, timeRange),
          this.getTrendsData(userId, timeRange, options.groupBy || 'day'),
          this.getDistributionsData(userId, timeRange)
        ])

        // 生成预测数据
        const predictions = await this.generatePredictions(trends)

        return {
          overview,
          trends,
          distributions,
          predictions
        }
      },
      this.cacheTTL
    )
  }

  /**
   * 获取用户行为分析数据
   */
  async getUserBehavior(userId: string) {
    const cacheKey = CacheKeyGenerator.userBehavior(userId)

    return await cache.getOrSet(
      cacheKey,
      async () => {
        const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        
        const [creationPatterns, preferences, engagement] = await Promise.all([
          this.getCreationPatterns(userId, threeMonthsAgo),
          this.getUserPreferences(userId, threeMonthsAgo),
          this.getEngagementMetrics(userId, threeMonthsAgo)
        ])

        return {
          creationPatterns,
          preferences,
          engagement
        }
      },
      this.cacheTTL
    )
  }

  /**
   * 获取AI使用分析数据
   */
  async getAiAnalytics(userId: string) {
    const cacheKey = CacheKeyGenerator.aiAnalytics(userId)

    return await cache.getOrSet(
      cacheKey,
      async () => {
        const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        
        const [modelUsage, promptAnalysis, qualityMetrics] = await Promise.all([
          this.getModelUsageStats(userId, threeMonthsAgo),
          this.getPromptAnalysis(userId, threeMonthsAgo),
          this.getQualityMetrics(userId, threeMonthsAgo)
        ])

        return {
          modelUsage,
          promptAnalysis,
          qualityMetrics
        }
      },
      this.cacheTTL
    )
  }

  /**
   * 获取实时指标
   */
  async getRealtimeMetrics() {
    const cacheKey = CacheKeyGenerator.systemHealth()

    return await cache.getOrSet(
      cacheKey,
      async () => {
        const now = new Date()
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

        // 获取实时系统指标
        const [activeUsers, recentActivity, systemLoad] = await Promise.all([
          this.getActiveUsers(oneHourAgo),
          this.getRecentActivity(oneHourAgo),
          this.getSystemLoad()
        ])

        return {
          activeUsers,
          recentActivity,
          systemLoad,
          timestamp: now.toISOString()
        }
      },
      60 // 1分钟缓存
    )
  }

  /**
   * 生成趋势预测
   */
  async generatePredictions(historicalData: HistoricalData[]): Promise<{
    nextWeek: PredictionResult[]
    trends: TrendAnalysis[]
  }> {
    const predictions: PredictionResult[] = []
    const trends: TrendAnalysis[] = []

    for (const data of historicalData) {
      if (data.values.length < 3) continue

      // 简单线性回归预测
      const trend = this.calculateTrend(data.values)
      const prediction = this.predictNextWeek(data.values, data.dates)
      
      predictions.push(...prediction)
      trends.push({
        metric: data.metric,
        direction: trend.slope > 0.1 ? 'up' : trend.slope < -0.1 ? 'down' : 'stable',
        confidence: Math.min(0.9, Math.abs(trend.correlation)),
        changeRate: trend.slope
      })
    }

    return { nextWeek: predictions, trends }
  }

  /**
   * 获取时间范围
   */
  private getTimeRange(timeRange: string): { startDate: Date; endDate: Date } {
    const now = new Date()
    const endDate = new Date(now)
    let startDate: Date

    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    return { startDate, endDate }
  }

  /**
   * 获取概览数据
   */
  private async getOverviewData(userId: string, timeRange: { startDate: Date; endDate: Date }) {
    const [totalSvgs, totalViews, totalLikes, totalShares] = await Promise.all([
      db.svgs.count({
        where: {
          user_id: userId,
          created_at: {
            gte: timeRange.startDate,
            lte: timeRange.endDate
          }
        }
      }),
      db.svgs.aggregate({
        where: {
          user_id: userId,
          created_at: {
            gte: timeRange.startDate,
            lte: timeRange.endDate
          }
        },
        _sum: { view_count: true }
      }),
      db.svgs.aggregate({
         where: {
           user_id: userId,
           created_at: {
             gte: timeRange.startDate,
             lte: timeRange.endDate
           }
         },
         _sum: {
           like_count: true
         }
       }),
       db.svgs.aggregate({
        where: {
          user_id: userId,
          created_at: {
            gte: timeRange.startDate,
            lte: timeRange.endDate
          }
        },
        _sum: { share_count: true }
      })
    ])

    // 计算活跃度和质量评分
    const daysInRange = Math.ceil((timeRange.endDate.getTime() - timeRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
    const avgSvgsPerDay = totalSvgs / daysInRange
    const totalInteractions = Number(totalLikes._sum.like_count || 0) + Number(totalShares._sum.share_count || 0)
    const avgInteractionsPerSvg = totalSvgs > 0 ? totalInteractions / totalSvgs : 0
    
    const activeScore = Math.min(100, Math.round((avgSvgsPerDay * 10 + avgInteractionsPerSvg * 5) * 10))
    const qualityScore = Math.min(100, Math.round((totalInteractions / Math.max(Number(totalViews._sum.view_count || 0), 1)) * 1000))

    return {
      totalSvgs,
      totalViews: Number(totalViews._sum.view_count || 0),
      totalLikes: Number(totalLikes._sum.like_count || 0),
      totalShares: Number(totalShares._sum.share_count || 0),
      activeScore,
      qualityScore
    }
  }

  /**
   * 获取趋势数据
   */
  private async getTrendsData(userId: string, timeRange: { startDate: Date; endDate: Date }, groupBy: string) {
    const dateFormat = groupBy === 'hour' ? '%Y-%m-%d %H:00:00' : 
                      groupBy === 'day' ? '%Y-%m-%d' :
                      groupBy === 'week' ? '%Y-%u' : '%Y-%m'

    const trendsData = await db.$queryRaw`
      SELECT 
        DATE_FORMAT(s.created_at, ${dateFormat}) as date,
        COUNT(*) as svgs,
        COALESCE(SUM(s.view_count), 0) as views,
        COALESCE(SUM(s.like_count), 0) as likes,
        COALESCE(SUM(s.share_count), 0) as shares
      FROM svgs s
      WHERE s.user_id = ${userId}
        AND s.created_at >= ${timeRange.startDate}
        AND s.created_at <= ${timeRange.endDate}
      GROUP BY DATE_FORMAT(s.created_at, ${dateFormat})
      ORDER BY date ASC
    ` as any[]

    return trendsData.map(item => ({
      date: item.date,
      svgs: Number(item.svgs),
      views: Number(item.views),
      likes: Number(item.likes),
      shares: Number(item.shares)
    }))
  }

  /**
   * 获取分布数据
   */
  private async getDistributionsData(userId: string, timeRange: { startDate: Date; endDate: Date }) {
    // 获取分类分布
    const categoryDistribution = await db.$queryRaw`
      SELECT 
        COALESCE(s.category, 'uncategorized') as name,
        COUNT(*) as value
      FROM svgs s
      WHERE s.user_id = ${userId}
        AND s.created_at >= ${timeRange.startDate}
        AND s.created_at <= ${timeRange.endDate}
      GROUP BY s.category
      ORDER BY value DESC
    ` as any[]

    const totalCategorySvgs = categoryDistribution.reduce((sum, cat) => sum + Number(cat.value), 0)
    const categories = categoryDistribution.map(cat => ({
      name: cat.name,
      value: Number(cat.value),
      percentage: totalCategorySvgs > 0 ? Math.round((Number(cat.value) / totalCategorySvgs) * 100) : 0
    }))

    // 获取时间分布
    const timeDistribution = await db.$queryRaw`
      SELECT 
        HOUR(s.created_at) as hour,
        COUNT(*) as activity
      FROM svgs s
      WHERE s.user_id = ${userId}
        AND s.created_at >= ${timeRange.startDate}
        AND s.created_at <= ${timeRange.endDate}
      GROUP BY HOUR(s.created_at)
      ORDER BY hour ASC
    ` as any[]

    return {
      categories,
      aiModels: [], // 待实现
      timeDistribution: timeDistribution.map(item => ({
        hour: Number(item.hour),
        activity: Number(item.activity)
      }))
    }
  }

  /**
   * 计算趋势
   */
  private calculateTrend(values: number[]): { slope: number; correlation: number } {
    const n = values.length
    if (n < 2) return { slope: 0, correlation: 0 }

    const x = Array.from({ length: n }, (_, i) => i)
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = values.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumYY = values.reduce((sum, yi) => sum + yi * yi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))

    return { slope, correlation: isNaN(correlation) ? 0 : correlation }
  }

  /**
   * 预测下周数据
   */
  private predictNextWeek(values: number[], dates: string[]): PredictionResult[] {
    const trend = this.calculateTrend(values)
    const lastValue = values[values.length - 1] || 0
    const predictions: PredictionResult[] = []

    for (let i = 1; i <= 7; i++) {
      const predicted = Math.max(0, Math.round(lastValue + trend.slope * i))
      const confidence = Math.max(0.3, 1 - (i * 0.1))
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + i)
      
      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        predicted,
        confidence
      })
    }

    return predictions
  }

  // 其他私有方法的占位符实现
  private async getCreationPatterns(userId: string, startDate: Date) {
    // 实现创作模式分析
    return {}
  }

  private async getUserPreferences(userId: string, startDate: Date) {
    // 实现用户偏好分析
    return {}
  }

  private async getEngagementMetrics(userId: string, startDate: Date) {
    // 实现参与度指标分析
    return {}
  }

  private async getModelUsageStats(userId: string, startDate: Date) {
    // 实现AI模型使用统计
    return []
  }

  private async getPromptAnalysis(userId: string, startDate: Date) {
    // 实现提示词分析
    return {}
  }

  private async getQualityMetrics(userId: string, startDate: Date) {
    // 实现质量指标分析
    return {}
  }

  private async getActiveUsers(startDate: Date) {
    // 实现活跃用户统计
    return 0
  }

  private async getRecentActivity(startDate: Date) {
    // 实现最近活动统计
    return []
  }

  private async getSystemLoad() {
    // 实现系统负载监控
    return {}
  }
}

// 导出单例实例
export const analyticsService = new AnalyticsService()