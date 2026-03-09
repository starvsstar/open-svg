import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: 获取仪表盘统计数据
 *     tags: [仪表盘]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: 成功返回统计数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardStats'
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: 错误信息
 */

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userId = session.user.id

    // 获取当前日期和最近6个月的日期范围
    const now = new Date()
    // 获取当前月份的最后一天
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    // 获取6个月前的第一天
    const startOfSixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0)

    // 修改月份生成逻辑
    const months = []
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    // 从当前月份开始,往前推5个月
    for (let i = 5; i >= 0; i--) {
      const targetYear = currentYear
      const targetMonth = currentMonth - i
      // 处理月份可能为负数的情况
      const adjustedMonth = targetMonth <= 0 ? targetMonth + 12 : targetMonth
      const adjustedYear = targetMonth <= 0 ? currentYear - 1 : currentYear
      
      // 格式化月份，确保月份是两位数
      const formattedMonth = String(adjustedMonth).padStart(2, '0')
      const formattedDate = `${adjustedYear}-${formattedMonth}`
      months.push(formattedDate)
    }

    console.log('Generated months:', months) // 调试用

    // 修改日统计数据查询为最近7天
    const dailyStats = await db.$queryRaw`
      SELECT 
        DATE_FORMAT(s.created_at, '%Y-%m-%d') as date,
        COUNT(*) as count
      FROM svgs s
      WHERE s.user_id = ${userId}
        AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE_FORMAT(s.created_at, '%Y-%m-%d')
      ORDER BY date ASC
    `

    // 生成最近7天的日期数组，包括没有数据的日期
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      last7Days.push(date.toISOString().slice(0, 10)) // Format: YYYY-MM-DD
    }

    // 格式化数据，确保每天都有数据点
    const dailyTrend = last7Days.map(date => ({
      date,
      svgs: Number((dailyStats as any[]).find(stat => stat.date === date)?.count || 0)
    }))

    // 获取月统计数据
    const monthlyStats = await db.$queryRaw`
      SELECT 
        DATE_FORMAT(s.created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM svgs s
      WHERE s.user_id = ${userId}
        AND s.created_at >= ${startOfSixMonthsAgo}
        AND s.created_at <= ${endOfCurrentMonth}
      GROUP BY DATE_FORMAT(s.created_at, '%Y-%m')
      ORDER BY month ASC
    `

    // 格式化数据
    const monthlyTrend = months.map(month => ({
      date: month,
      svgs: Number((monthlyStats as any[]).find(stat => stat.month === month)?.count || 0)
    }));

    // 获取其他统计数据，同样使用关联查询
    const [totalSvgs, publicSvgs, personalSvgs, communityShares, downloads] = await Promise.all([
      // 总SVG数
      db.svgs.count({
        where: { 
          user_id: userId,
          user: {
            id: userId
          }
        }
      }),
      // 公开SVG数
      db.svgs.count({
        where: { 
          user_id: userId,
          is_public: true,
          user: {
            id: userId
          }
        }
      }),
      // 私人SVG数
      db.svgs.count({
        where: { 
          user_id: userId,
          is_public: false,
          user: {
            id: userId
          }
        }
      }),
      // 分享数
      db.svgShare.count({
        where: { 
          user_id: userId,
          user: {
            id: userId
          }
        }
      }),
      // 下载数（暂用浏览数代替）
      db.svgs.aggregate({
        where: { 
          user_id: userId,
          user: {
            id: userId
          }
        },
        _sum: {
          view_count: true
        }
      })
    ])

    // 在返回之前转换所有 BigInt 为 number
    return NextResponse.json({
      dailyTrend,
      monthlyTrend,
      stats: {
        total: Number(totalSvgs),
        public: Number(publicSvgs),
        personal: Number(personalSvgs),
        shares: Number(communityShares),
        downloads: Number(downloads._sum.view_count || 0)
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}