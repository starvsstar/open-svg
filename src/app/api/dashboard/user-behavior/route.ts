import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

/**
 * @swagger
 * /api/dashboard/user-behavior:
 *   get:
 *     summary: 获取用户行为分析数据
 *     tags: [仪表盘]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: 成功返回用户行为分析数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBehaviorResponse'
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */

interface UserBehaviorResponse {
  creationPatterns: {
    hourlyDistribution: { hour: number; count: number }[]
    weeklyDistribution: { day: string; count: number }[]
    monthlyTrends: { month: string; count: number }[]
  }
  preferences: {
    favoriteCategories: string[]
    preferredAiModels: string[]
    averageSessionTime: number
    mostUsedFeatures: string[]
  }
  engagement: {
    socialInteractions: number
    communityParticipation: number
    feedbackProvided: number
    helpfulnessScore: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

    // 获取创作模式 - 按小时分布
    const hourlyDistribution = await db.$queryRaw`
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as count
      FROM svgs
      WHERE user_id = ${userId}
        AND created_at >= ${threeMonthsAgo}
      GROUP BY HOUR(created_at)
      ORDER BY hour ASC
    ` as any[]

    // 填充缺失的小时数据
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const found = hourlyDistribution.find(item => Number(item.hour) === hour)
      return {
        hour,
        count: found ? Number(found.count) : 0
      }
    })

    // 获取创作模式 - 按星期分布
    const weeklyDistribution = await db.$queryRaw`
      SELECT 
        DAYNAME(created_at) as day,
        COUNT(*) as count
      FROM svgs
      WHERE user_id = ${userId}
        AND created_at >= ${threeMonthsAgo}
      GROUP BY DAYOFWEEK(created_at), DAYNAME(created_at)
      ORDER BY DAYOFWEEK(created_at) ASC
    ` as any[]

    const weeklyData = weeklyDistribution.map(item => ({
      day: item.day,
      count: Number(item.count)
    }))

    // 获取创作模式 - 按月趋势
    const monthlyTrends = await db.$queryRaw`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM svgs
      WHERE user_id = ${userId}
        AND created_at >= ${oneYearAgo}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    ` as any[]

    const monthlyData = monthlyTrends.map(item => ({
      month: item.month,
      count: Number(item.count)
    }))

    // 获取偏好分析 - 最喜欢的分类
    const categoryPreferences = await db.$queryRaw`
      SELECT 
        COALESCE(category, 'uncategorized') as category,
        COUNT(*) as count
      FROM svgs
      WHERE user_id = ${userId}
        AND created_at >= ${threeMonthsAgo}
      GROUP BY category
      ORDER BY count DESC
      LIMIT 5
    ` as any[]

    const favoriteCategories = categoryPreferences.map(item => item.category)

    // 获取AI模型偏好
    const aiModelPreferences = await db.$queryRaw`
      SELECT 
        'GPT-4' as model,
        COUNT(*) as count
      FROM prompt_history
      WHERE user_id = ${userId}
        AND created_at >= ${threeMonthsAgo}
      UNION ALL
      SELECT 
        'DeepSeek' as model,
        0 as count
      ORDER BY count DESC
    ` as any[]

    const preferredAiModels = aiModelPreferences
      .filter(item => Number(item.count) > 0)
      .map(item => item.model)

    // 计算平均会话时间（基于创作间隔的估算）
    const sessionData = await db.$queryRaw`
      SELECT 
        created_at,
        updated_at
      FROM svgs
      WHERE user_id = ${userId}
        AND created_at >= ${threeMonthsAgo}
      ORDER BY created_at ASC
    ` as any[]

    let totalSessionTime = 0
    let sessionCount = 0
    
    for (let i = 0; i < sessionData.length; i++) {
      const current = new Date(sessionData[i].created_at)
      const updated = new Date(sessionData[i].updated_at)
      const sessionTime = Math.min((updated.getTime() - current.getTime()) / (1000 * 60), 120) // 最大120分钟
      
      if (sessionTime > 0) {
        totalSessionTime += sessionTime
        sessionCount++
      }
    }

    const averageSessionTime = sessionCount > 0 ? Math.round(totalSessionTime / sessionCount) : 0

    // 最常用功能（基于数据库活动推断）
    const featureUsage = await db.$queryRaw`
      SELECT 
        'AI Generation' as feature,
        COUNT(*) as usage
      FROM prompt_history
      WHERE user_id = ${userId}
        AND created_at >= ${threeMonthsAgo}
      UNION ALL
      SELECT 
        'Manual Creation' as feature,
        COUNT(*) as usage
      FROM svgs
      WHERE user_id = ${userId}
        AND created_at >= ${threeMonthsAgo}
        AND prompt_id IS NULL
      UNION ALL
      SELECT 
        'Community Sharing' as feature,
        COUNT(*) as usage
      FROM svgs
      WHERE user_id = ${userId}
        AND created_at >= ${threeMonthsAgo}
        AND is_public = true
      ORDER BY usage DESC
    ` as any[]

    const mostUsedFeatures = featureUsage
      .filter(item => Number(item.usage) > 0)
      .slice(0, 3)
      .map(item => item.feature)

    // 获取参与度数据
    const [socialInteractions, communityParticipation, feedbackProvided] = await Promise.all([
      // 社交互动（点赞、分享、评论）
      db.$queryRaw`
        SELECT 
          (SELECT COUNT(*) FROM svg_likes WHERE user_id = ${userId} AND created_at >= ${threeMonthsAgo}) +
          (SELECT COUNT(*) FROM svg_shares WHERE user_id = ${userId} AND created_at >= ${threeMonthsAgo}) +
          (SELECT COUNT(*) FROM svg_comments WHERE user_id = ${userId} AND created_at >= ${threeMonthsAgo}) as total
      ` as any[],
      
      // 社区参与度（公开作品数）
      db.svgs.count({
        where: {
          user_id: userId,
          is_public: true,
          created_at: {
            gte: threeMonthsAgo
          }
        }
      }),
      
      // 反馈提供数
      db.feedback.count({
        where: {
          user_id: userId,
          created_at: {
            gte: threeMonthsAgo
          }
        }
      })
    ])

    const totalSocialInteractions = Number(socialInteractions[0]?.total || 0)
    
    // 计算帮助度评分（基于社区贡献和互动质量）
    const userSvgs = await db.svgs.count({
      where: {
        user_id: userId,
        created_at: {
          gte: threeMonthsAgo
        }
      }
    })

    const receivedLikes = await db.$queryRaw`
      SELECT COUNT(*) as count
      FROM svg_likes sl
      JOIN svgs s ON sl.svg_id = s.id
      WHERE s.user_id = ${userId}
        AND sl.created_at >= ${threeMonthsAgo}
    ` as any[]

    const helpfulnessScore = userSvgs > 0 ? 
      Math.min(100, Math.round((Number(receivedLikes[0]?.count || 0) / userSvgs) * 20)) : 0

    const response: UserBehaviorResponse = {
      creationPatterns: {
        hourlyDistribution: hourlyData,
        weeklyDistribution: weeklyData,
        monthlyTrends: monthlyData
      },
      preferences: {
        favoriteCategories,
        preferredAiModels,
        averageSessionTime,
        mostUsedFeatures
      },
      engagement: {
        socialInteractions: totalSocialInteractions,
        communityParticipation,
        feedbackProvided,
        helpfulnessScore
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching user behavior data:', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}