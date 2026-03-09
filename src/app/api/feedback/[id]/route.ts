import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/feedback/{id}:
 *   get:
 *     summary: 获取单个反馈详情
 *     tags: [反馈]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 反馈ID
 *     responses:
 *       200:
 *         description: 成功返回反馈详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 *       401:
 *         description: 未授权
 *       404:
 *         description: 反馈不存在
 *       500:
 *         description: 服务器错误
 * 
 *   patch:
 *     summary: 更新反馈状态
 *     tags: [反馈]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 反馈ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, resolved, rejected]
 *                 description: 新的状态
 *     responses:
 *       200:
 *         description: 状态更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 *       401:
 *         description: 未授权
 *       404:
 *         description: 反馈不存在
 *       500:
 *         description: 服务器错误
 */

// 获取单个反馈
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feedback = await prisma.feedback.findUnique({
      where: { id: params.id },
    });

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 更新反馈状态
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const { status } = json;

    const feedback = await prisma.feedback.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}