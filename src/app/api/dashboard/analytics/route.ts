import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

/**
 * @swagger
 * /api/dashboard/analytics:
 *   get:
 *     summary: 获取综合分析数据
 *     tags: [仪表盘]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year]
 *         description: 时间范围
 *       - in: query
 *         name: metrics
 *         schema:
 *           type: string
 *         description: 指标列表，逗号分隔
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *         description: 分组方式
 *     responses:
 *       200:
 *         description: 成功返回分析数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsResponse'
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */

interface AnalyticsRequest {
  timeRange: 'day' | 'week' | 'month' | 'quarter' | 'year'
  metrics: string[]
  groupBy?: 'hour' | 'day' | 'week' | 'month'
  filters?: {
    category?: string
    isPublic?: boolean
    aiModel?: string
  }
}

interface AnalyticsResponse {
  overview: {
    totalSvgs: number
    totalViews: number
    totalLikes: number
    totalShares: number
    activeScore: number
    qualityScore: number
  }
  trends: {
    date: string
    svgs: number
    views: number
    likes: number
    shares: number
  }[]
  distributions: {
    categories: { name: string; value: number; percentage: number }[]
    aiModels: { name: string; value: number; successRate: number }[]
    timeDistribution: { hour: number; activity: number }[]
  }
  predictions: {
    nextWeek: { date: string; predicted: number; confidence: number }[]
    trends: { metric: string; direction: 'up' | 'down' | 'stable'; confidence: number }[]
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    
    const timeRange = (searchParams.get('timeRange') as AnalyticsRequest['timeRange']) || 'month'
    const metricsParam = searchParams.get('metrics') || 'svgs,views,likes,shares'
    const metrics = metricsParam.split(',')
    const groupBy = (searchParams.get('groupBy') as AnalyticsRequest['groupBy']) || 'day'
    
    // 计算时间范围
    const now = new Date()
    let startDate: Date
    const endDate = new Date(now)
    
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

    // 获取概览数据
    const [totalSvgs, totalViews, totalLikes, totalShares] = await Promise.all([
      db.svgs.count({
        where: {
          user_id: userId,
          created_at: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      db.svgs.aggregate({
        where: {
          user_id: userId,
          created_at: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          view_count: true
        }
      }),
      db.svgs.aggregate({
         where: {
           user_id: userId,
           created_at: {
             gte: startDate,
             lte: endDate
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
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          share_count: true
        }
      })
    ])

    // 计算活跃度评分（基于创作频率和互动）
    const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const avgSvgsPerDay = totalSvgs / daysInRange
    const avgInteractionsPerSvg = totalSvgs > 0 ? (Number(totalLikes._sum.like_count || 0) + Number(totalShares._sum.share_count || 0)) / totalSvgs : 0
    const activeScore = Math.min(100, Math.round((avgSvgsPerDay * 10 + avgInteractionsPerSvg * 5) * 10))

    // 计算质量评分（基于互动率）
    const totalInteractions = Number(totalLikes._sum.like_count || 0) + Number(totalShares._sum.share_count || 0)
    const totalViewsCount = Number(totalViews._sum.view_count || 0)
    const interactionRate = totalViewsCount > 0 ? totalInteractions / totalViewsCount : 0
    const qualityScore = Math.min(100, Math.round(interactionRate * 1000))

    // 获取趋势数据
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
        AND s.created_at >= ${startDate}
        AND s.created_at <= ${endDate}
      GROUP BY DATE_FORMAT(s.created_at, ${dateFormat})
      ORDER BY date ASC
    ` as any[]

    // 获取分类分布
    const categoryDistribution = await db.$queryRaw`
      SELECT 
        COALESCE(s.category, 'uncategorized') as name,
        COUNT(*) as value
      FROM svgs s
      WHERE s.user_id = ${userId}
        AND s.created_at >= ${startDate}
        AND s.created_at <= ${endDate}
      GROUP BY s.category
      ORDER BY value DESC
    ` as any[]

    const totalCategorySvgs = categoryDistribution.reduce((sum, cat) => sum + Number(cat.value), 0)
    const categories = categoryDistribution.map(cat => ({
      name: cat.name,
      value: Number(cat.value),
      percentage: totalCategorySvgs > 0 ? Math.round((Number(cat.value) / totalCategorySvgs) * 100) : 0
    }))

    // 获取AI模型使用分布
    const aiModelDistribution = await db.$queryRaw`
      SELECT 
        'GPT-4' as model,
        COUNT(*) as value,
        ROUND(AVG(CASE WHEN ph.status = 'success' THEN 1 ELSE 0 END) * 100, 2) as successRate
      FROM prompt_history ph
      WHERE ph.user_id = ${userId}
        AND ph.created_at >= ${startDate}
        AND ph.created_at <= ${endDate}
      UNION ALL
      SELECT 
        'DeepSeek' as model,
        0 as value,
        0 as successRate
    ` as any[]

    const aiModels = aiModelDistribution.map(model => ({
      name: model.model,
      value: Number(model.value),
      successRate: Number(model.successRate)
    }))

    // 获取时间分布（按小时）
    const timeDistribution = await db.$queryRaw`
      SELECT 
        HOUR(s.created_at) as hour,
        COUNT(*) as activity
      FROM svgs s
      WHERE s.user_id = ${userId}
        AND s.created_at >= ${startDate}
        AND s.created_at <= ${endDate}
      GROUP BY HOUR(s.created_at)
      ORDER BY hour ASC
    ` as any[]

    // 生成简单的预测数据（基于历史趋势）
    const recentTrends = trendsData.slice(-7) // 最近7个数据点
    const avgGrowth = recentTrends.length > 1 ? 
      (Number(recentTrends[recentTrends.length - 1].svgs) - Number(recentTrends[0].svgs)) / recentTrends.length : 0

    const nextWeekPredictions = []
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date(endDate.getTime() + i * 24 * 60 * 60 * 1000)
      const predicted = Math.max(0, Math.round(avgGrowth * i + Number(recentTrends[recentTrends.length - 1]?.svgs || 0)))
      nextWeekPredictions.push({
        date: futureDate.toISOString().split('T')[0],
        predicted,
        confidence: Math.max(0.3, 1 - (i * 0.1)) // 置信度随时间递减
      })
    }

    const trendDirection = avgGrowth > 0.1 ? 'up' : avgGrowth < -0.1 ? 'down' : 'stable'
    const trends = [
      {
        metric: 'svgs',
        direction: trendDirection,
        confidence: Math.min(0.9, Math.abs(avgGrowth) * 2)
      }
    ]

    const response: AnalyticsResponse = {
      overview: {
        totalSvgs,
        totalViews: Number(totalViews._sum.view_count || 0),
        totalLikes: Number(totalLikes._sum.like_count || 0),
        totalShares: Number(totalShares._sum.share_count || 0),
        activeScore,
        qualityScore
      },
      trends: trendsData.map(item => ({
        date: item.date,
        svgs: Number(item.svgs),
        views: Number(item.views),
        likes: Number(item.likes),
        shares: Number(item.shares)
      })),
      distributions: {
        categories,
        aiModels,
        timeDistribution: timeDistribution.map(item => ({
          hour: Number(item.hour),
          activity: Number(item.activity)
        }))
      },
      predictions: {
        nextWeek: nextWeekPredictions,
        trends
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}