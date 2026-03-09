import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

/**
 * @swagger
 * /api/dashboard/ai-analytics:
 *   get:
 *     summary: 获取AI使用分析数据
 *     tags: [仪表盘]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: 成功返回AI使用分析数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AiAnalyticsResponse'
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */

interface AiAnalyticsResponse {
  modelUsage: {
    model: string
    totalRequests: number
    successRate: number
    averageResponseTime: number
    userSatisfaction: number
  }[]
  promptAnalysis: {
    topPrompts: { prompt: string; usage: number; successRate: number }[]
    promptCategories: { category: string; count: number }[]
    improvementSuggestions: string[]
  }
  qualityMetrics: {
    generationQuality: number
    userAcceptanceRate: number
    iterationCount: number
    finalSatisfaction: number
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

    // 获取AI模型使用统计
    const modelUsageStats = await db.$queryRaw`
      SELECT 
        'GPT-4 Mini' as model,
        COUNT(*) as totalRequests,
        ROUND(AVG(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100, 2) as successRate,
        AVG(TIMESTAMPDIFF(SECOND, created_at, 
          COALESCE(
            (SELECT MIN(s.created_at) FROM svgs s WHERE s.prompt_id = ph.id),
            DATE_ADD(created_at, INTERVAL 30 SECOND)
          )
        )) as avgResponseTime
      FROM prompt_history ph
      WHERE ph.user_id = ${userId}
        AND ph.created_at >= ${threeMonthsAgo}
      UNION ALL
      SELECT 
        'DeepSeek-V3' as model,
        0 as totalRequests,
        0 as successRate,
        0 as avgResponseTime
      UNION ALL
      SELECT 
        'DeepSeek-R1' as model,
        0 as totalRequests,
        0 as successRate,
        0 as avgResponseTime
    ` as any[]

    // 计算用户满意度（基于生成后是否继续编辑/保存）
    const satisfactionData = await db.$queryRaw`
      SELECT 
        ph.id,
        CASE 
          WHEN s.id IS NOT NULL THEN 1 
          ELSE 0 
        END as kept_result
      FROM prompt_history ph
      LEFT JOIN svgs s ON s.prompt_id = ph.id
      WHERE ph.user_id = ${userId}
        AND ph.created_at >= ${threeMonthsAgo}
        AND ph.status = 'success'
    ` as any[]

    const totalSuccessfulPrompts = satisfactionData.length
    const keptResults = satisfactionData.filter(item => Number(item.kept_result) === 1).length
    const userSatisfaction = totalSuccessfulPrompts > 0 ? 
      Math.round((keptResults / totalSuccessfulPrompts) * 100) : 0

    const modelUsage = modelUsageStats.map(model => ({
      model: model.model,
      totalRequests: Number(model.totalRequests),
      successRate: Number(model.successRate),
      averageResponseTime: Number(model.avgResponseTime || 0),
      userSatisfaction: model.model === 'GPT-4 Mini' ? userSatisfaction : 0
    }))

    // 获取热门提示词分析
    const topPrompts = await db.$queryRaw`
      SELECT 
        SUBSTRING(content, 1, 100) as prompt,
        COUNT(*) as usage,
        ROUND(AVG(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100, 2) as successRate
      FROM prompt_history
      WHERE user_id = ${userId}
        AND created_at >= ${threeMonthsAgo}
        AND LENGTH(content) > 10
      GROUP BY SUBSTRING(content, 1, 100)
      HAVING COUNT(*) > 1
      ORDER BY usage DESC, successRate DESC
      LIMIT 10
    ` as any[]

    const topPromptsData = topPrompts.map(item => ({
      prompt: item.prompt + (item.prompt.length >= 100 ? '...' : ''),
      usage: Number(item.usage),
      successRate: Number(item.successRate)
    }))

    // 分析提示词类别（基于关键词）
    const promptCategorization = await db.$queryRaw`
      SELECT 
        CASE 
          WHEN LOWER(content) REGEXP 'icon|logo|symbol' THEN 'Icons'
          WHEN LOWER(content) REGEXP 'illustration|drawing|art' THEN 'Illustrations'
          WHEN LOWER(content) REGEXP 'pattern|background|texture' THEN 'Patterns'
          WHEN LOWER(content) REGEXP 'chart|graph|diagram' THEN 'Charts'
          WHEN LOWER(content) REGEXP 'ui|interface|button' THEN 'UI Elements'
          ELSE 'Other'
        END as category,
        COUNT(*) as count
      FROM prompt_history
      WHERE user_id = ${userId}
        AND created_at >= ${threeMonthsAgo}
        AND status = 'success'
      GROUP BY category
      ORDER BY count DESC
    ` as any[]

    const promptCategories = promptCategorization.map(item => ({
      category: item.category,
      count: Number(item.count)
    }))

    // 生成改进建议
    const improvementSuggestions = []
    
    // 基于成功率给出建议
    const overallSuccessRate = modelUsage.reduce((sum, model) => sum + model.successRate, 0) / modelUsage.length
    if (overallSuccessRate < 70) {
      improvementSuggestions.push('尝试使用更具体和详细的提示词描述')
    }
    if (overallSuccessRate < 50) {
      improvementSuggestions.push('考虑参考成功案例的提示词格式')
    }

    // 基于使用模式给出建议
    const mostUsedCategory = promptCategories.length > 0 ? promptCategories[0] : null
    if (mostUsedCategory && mostUsedCategory.category !== 'Other') {
      improvementSuggestions.push(`您经常创建${mostUsedCategory.category}，可以学习该领域的专业术语`)
    }

    // 基于响应时间给出建议
    const avgResponseTime = modelUsage.reduce((sum, model) => sum + model.averageResponseTime, 0) / modelUsage.length
    if (avgResponseTime > 60) {
      improvementSuggestions.push('尝试简化提示词以获得更快的响应')
    }

    if (improvementSuggestions.length === 0) {
      improvementSuggestions.push('您的AI使用效果很好，继续保持！')
    }

    // 计算质量指标
    const totalPrompts = await db.promptHistory.count({
      where: {
        user_id: userId,
        created_at: {
          gte: threeMonthsAgo
        }
      }
    })

    const successfulPrompts = await db.promptHistory.count({
      where: {
        user_id: userId,
        status: 'success',
        created_at: {
          gte: threeMonthsAgo
        }
      }
    })

    // 计算迭代次数（同一个SVG的多次生成）
    const iterationData = await db.$queryRaw`
      SELECT 
        s.id,
        COUNT(ph.id) as iterations
      FROM svgs s
      LEFT JOIN prompt_history ph ON ph.svg_id = s.id
      WHERE s.user_id = ${userId}
        AND s.created_at >= ${threeMonthsAgo}
      GROUP BY s.id
      HAVING COUNT(ph.id) > 0
    ` as any[]

    const avgIterations = iterationData.length > 0 ? 
      iterationData.reduce((sum, item) => sum + Number(item.iterations), 0) / iterationData.length : 1

    const generationQuality = totalPrompts > 0 ? Math.round((successfulPrompts / totalPrompts) * 100) : 0
    const userAcceptanceRate = userSatisfaction
    const iterationCount = Math.round(avgIterations * 10) / 10
    const finalSatisfaction = Math.round((generationQuality + userAcceptanceRate) / 2)

    const response: AiAnalyticsResponse = {
      modelUsage,
      promptAnalysis: {
        topPrompts: topPromptsData,
        promptCategories,
        improvementSuggestions
      },
      qualityMetrics: {
        generationQuality,
        userAcceptanceRate,
        iterationCount,
        finalSatisfaction
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching AI analytics data:', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}