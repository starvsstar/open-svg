import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

/**
 * @swagger
 * /api/prompts/{id}:
 *   get:
 *     summary: 获取单个提示词模板
 *     tags: [提示词]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 提示词模板ID
 *     responses:
 *       200:
 *         description: 成功返回提示词
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PromptTemplate'
 *       401:
 *         description: 未授权
 *       404:
 *         description: 提示词不存在
 *       500:
 *         description: 服务器错误
 * 
 *   patch:
 *     summary: 更新提示词模板
 *     tags: [提示词]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 提示词模板ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: 提示词标题
 *               content:
 *                 type: string
 *                 description: 提示词内容
 *     responses:
 *       200:
 *         description: 成功更新提示词
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PromptTemplate'
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 * 
 *   delete:
 *     summary: 删除提示词模板
 *     tags: [提示词]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 提示词模板ID
 *     responses:
 *       204:
 *         description: 成功删除提示词
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */

// 定义路由处理器
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prompt = await prisma.promptTemplate.findUnique({
      where: {
        id: params.id,
        created_by: session.user.id,
      },
    });

    if (!prompt) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(prompt);
  } catch (error) {
    console.error('Get prompt error:', error);
    return Response.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content } = await request.json();

    const prompt = await prisma.promptTemplate.update({
      where: {
        id: params.id,
        created_by: session.user.id,
      },
      data: {
        ...(title && { title }),
        ...(content && { content }),
      },
    });

    return Response.json(prompt);
  } catch (error) {
    console.error('Update prompt error:', error);
    return Response.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.promptTemplate.delete({
      where: {
        id: params.id,
        created_by: session.user.id,
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Delete prompt error:', error);
    return Response.json({ error: "Internal Error" }, { status: 500 });
  }
}