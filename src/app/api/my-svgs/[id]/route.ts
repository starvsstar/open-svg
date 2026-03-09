import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/my-svgs/{id}:
 *   delete:
 *     summary: 删除指定的SVG
 *     tags: [我的SVG]
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
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "SVG deleted successfully"
 *       401:
 *         description: 未授权
 *       404:
 *         description: SVG不存在或无权限
 *       500:
 *         description: 服务器错误
 *
 *   patch:
 *     summary: 更新SVG的公开状态
 *     tags: [我的SVG]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SVG ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [is_public]
 *             properties:
 *               is_public:
 *                 type: boolean
 *                 description: 是否公开
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MySvgItem'
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.log("未授权的删除请求");
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const svgId = context.params.id;
    console.log(`尝试删除SVG ID: ${svgId}, 用户ID: ${session.user.id}`);

    // 先检查 SVG 是否存在且属于当前用户
    const svg = await prisma.svgs.findFirst({
      where: {
        id: svgId,
        user_id: session.user.id,
      },
    });

    if (!svg) {
      return NextResponse.json(
        { error: "SVG not found or unauthorized" },
        { status: 404 }
      );
    }

    // 使用事务来处理所有关联数据的删除
    await prisma.$transaction([
      prisma.svg_tags.deleteMany({
        where: { svg_id: svgId }
      }),
      prisma.svg_versions.deleteMany({
        where: { svg_id: svgId }
      }),
      prisma.svg_likes.deleteMany({
        where: { svg_id: svgId }
      }),
      prisma.svg_comments.deleteMany({
        where: { svg_id: svgId }
      }),
      prisma.svg_favorites.deleteMany({
        where: { svg_id: svgId }
      }),
      prisma.svg_shares.deleteMany({
        where: { svg_id: svgId }
      }),
      prisma.svg_forwards.deleteMany({
        where: {
          OR: [
            { original_svg_id: svgId },
            { new_svg_id: svgId }
          ]
        }
      }),
      prisma.prompt_history.updateMany({
        where: { svg_id: svgId },
        data: { svg_id: null }
      }),
      prisma.svgs.delete({
        where: {
          id: svgId,
        },
      }),
    ]);

    // 在事务完成后添加日志
    console.log(`SVG ${svgId} 已成功删除`);

    return NextResponse.json(
      { success: true, message: "SVG deleted successfully" }
    );

  } catch (error) {
    console.error('详细的删除错误:', error);
    return NextResponse.json(
      { error: "Failed to delete SVG" },
      { status: 500 }
    );
  }
}

// 添加 PATCH 方法来更新 SVG
export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const svgId = context.params.id;
    const data = await request.json();

    // 更新 SVG
    const updatedSvg = await prisma.svgs.update({
      where: {
        id: svgId,
        user_id: session.user.id,
      },
      data: {
        is_public: data.is_public,
      },
    });

    return NextResponse.json(updatedSvg);

  } catch (error) {
    console.error('Error updating SVG:', error);
    return NextResponse.json(
      { error: "Failed to update SVG" },
      { status: 500 }
    );
  }
}