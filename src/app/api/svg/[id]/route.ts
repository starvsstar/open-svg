import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

/**
 * @swagger
 * /api/svg/{id}:
 *   delete:
 *     summary: 删除指定的SVG
 *     tags: [SVG]
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
 *       204:
 *         description: 成功删除SVG
 *       401:
 *         description: 未授权
 *       404:
 *         description: SVG不存在或无权限
 *       500:
 *         description: 服务器错误
 */

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 验证 SVG 所有权
    const svg = await db.svgs.findUnique({
      where: {
        id: params.id,
        user_id: session.user.id,
      },
    });

    if (!svg) {
      return new NextResponse("Not found", { status: 404 });
    }

    // 删除 SVG
    await db.svgs.delete({
      where: {
        id: params.id,
      },
    });

    return new NextResponse(null, { status: 204 });
    
  } catch (error) {
    console.error('Delete SVG error:', error);
    return NextResponse.json(
      { error: 'Failed to delete SVG' },
      { status: 500 }
    );
  }
}