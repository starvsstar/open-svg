import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * @swagger
 * /api/community/{id}/share:
 *   post:
 *     summary: 分享SVG
 *     tags: [社区]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SVG ID
 *     responses:
 *       200:
 *         description: 分享成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 share_count:
 *                   type: integer
 *                   description: 最新分享数
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params);
    
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const svgId = id;
    const userId = session.user.id;

    // 记录分享并更新计数
    const result = await db.$transaction(async (tx) => {
      // 创建分享记录
      await tx.svgShare.create({
        data: {
          svg_id: svgId,
          user_id: userId,
          share_type: 'link', // 或其他类型
        },
      });

      // 获取最新的分享数
      const shareCount = await tx.svgShare.count({
        where: {
          svg_id: svgId,
        },
      });

      // 更新 SVG 记录
      await tx.svg.update({
        where: {
          id: svgId,
        },
        data: {
          share_count: shareCount,
        },
      });

      return {
        success: true,
        share_count: shareCount,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sharing SVG:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 