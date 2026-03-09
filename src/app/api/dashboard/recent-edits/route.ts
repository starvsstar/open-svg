import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/dashboard/recent-edits:
 *   get:
 *     summary: 获取最近编辑的SVG
 *     tags: [仪表盘]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: 成功返回最近编辑列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RecentEdit'
 *       401:
 *         description: 未授权
 *       404:
 *         description: 用户未找到
 *       500:
 *         description: 服务器错误
 */

export async function GET() {
  try {
    const session = await auth();
    console.log("Session in API:", session);
    
    if (!session) {
      return NextResponse.json(
        { error: "No session found" },
        { status: 401 }
      );
    }

    if (!session.user?.email) {
      return NextResponse.json(
        { error: "No user email in session" },
        { status: 401 }
      );
    }

    const user = await prisma.users.findUnique({
      where: {
        email: session.user.email
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const recentEdits = await prisma.svg.findMany({
      where: {
        user_id: user.id,
      },
      orderBy: {
        updated_at: 'desc',
      },
      take: 5,
      select: {
        id: true,
        title: true,
        updated_at: true,
        svg_content: true,
      },
    });

    return NextResponse.json(recentEdits);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}