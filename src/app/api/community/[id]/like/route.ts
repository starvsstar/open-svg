import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * @swagger
 * /api/community/{id}/like:
 *   post:
 *     summary: 点赞/取消点赞SVG
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
 *         description: 操作成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 like_count:
 *                   type: integer
 *                   description: 最新点赞数
 *                 isLiked:
 *                   type: boolean
 *                   description: 当前是否已点赞
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
    // 首先等待获取 params
    const { id } = await Promise.resolve(context.params);
    
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const svgId = id;
    const userId = session.user.id;

    // 使用 Prisma 事务
    const result = await db.$transaction(async (tx) => {
      // 检查是否已经点赞
      const existingLike = await tx.svgLike.findUnique({
        where: {
          svg_id_user_id: {
            svg_id: svgId,
            user_id: userId,
          },
        },
      });

      if (existingLike) {
        // 如果已经点赞，则取消点赞
        await tx.svgLike.delete({
          where: {
            svg_id_user_id: {
              svg_id: svgId,
              user_id: userId,
            },
          },
        });
      } else {
        // 如果未点赞，则创建点赞
        await tx.svgLike.create({
          data: {
            svg_id: svgId,
            user_id: userId,
          },
        });
      }

      // 获取最新的点赞数
      const likeCount = await tx.svgLike.count({
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
          like_count: likeCount,
        },
      });

      return {
        success: true,
        like_count: likeCount,
        isLiked: !existingLike
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error liking SVG:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 