import { NextResponse } from 'next/server'
import { clearMemory } from '@/lib/memory'

/**
 * @swagger
 * /api/chat/clear:
 *   post:
 *     summary: 清除聊天记录
 *     tags: [聊天]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: 会话ID
 *     responses:
 *       200:
 *         description: 成功清除聊天记录
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: 错误信息
 */
export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      throw new Error('Session ID is required')
    }

    clearMemory(sessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '发生未知错误',
    }, { status: 500 })
  }
} 