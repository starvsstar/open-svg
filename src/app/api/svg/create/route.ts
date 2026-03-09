import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

/**
 * @swagger
 * /api/svg/create:
 *   post:
 *     summary: 创建新的SVG
 *     tags: [SVG]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: SVG标题
 *               svg_content:
 *                 type: string
 *                 description: SVG内容
 *               is_public:
 *                 type: boolean
 *                 description: 是否公开
 *               category:
 *                 type: string
 *                 description: 分类
 *             required:
 *               - title
 *               - svg_content
 *     responses:
 *       201:
 *         description: SVG创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, svg_content, is_public = true, description } = body

    if (!title || !svg_content) {
      return NextResponse.json(
        { error: 'Title and SVG content are required' },
        { status: 400 }
      )
    }

    // 创建SVG记录
    const svg = await prisma.svgs.create({
      data: {
        id: randomUUID(),
        title,
        description,
        svg_content,
        is_public,
        user_id: session.user.id,
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    return NextResponse.json(
      {
        id: svg.id,
        title: svg.title,
        message: 'SVG created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating SVG:', error)
    
    // 详细的错误处理
    if (error instanceof Error) {
      // 数据库连接错误
      if (error.message.includes('PrismaClient') || error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        console.warn('Database connection failed, using fallback mode')
        const mockId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // 尝试保存到本地存储（通过响应头提示前端）
        return NextResponse.json(
          {
            id: mockId,
            title: title,
            message: 'SVG saved locally (database unavailable)',
            fallback: true
          },
          { 
            status: 201,
            headers: {
              'X-Fallback-Mode': 'true',
              'X-Storage-Type': 'local'
            }
          }
        )
      }
      
      // 数据验证错误
      if (error.message.includes('validation') || error.message.includes('constraint')) {
        return NextResponse.json(
          { 
            error: 'Data validation failed',
            details: 'Please check your input data format',
            code: 'VALIDATION_ERROR'
          },
          { status: 400 }
        )
      }
      
      // 权限错误
      if (error.message.includes('permission') || error.message.includes('access')) {
        return NextResponse.json(
          { 
            error: 'Database access denied',
            details: 'Please contact administrator',
            code: 'ACCESS_DENIED'
          },
          { status: 403 }
        )
      }
    }
    
    // 通用错误处理
    return NextResponse.json(
      { 
        error: 'Failed to save SVG',
        details: 'An unexpected error occurred. Please try again.',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}