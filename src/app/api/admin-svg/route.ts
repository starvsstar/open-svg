import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/admin-svg:
 *   get:
 *     summary: 获取所有官方SVG
 *     tags: [管理员]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: 成功返回SVG列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SVG'
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限
 *       500:
 *         description: 服务器错误
 *   post:
 *     summary: 创建新的官方SVG
 *     tags: [管理员]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, svg_content]
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
 *                 default: true
 *     responses:
 *       200:
 *         description: 成功创建SVG
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SVG'
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限
 *       500:
 *         description: 服务器错误
 */

// GET 方法 - 获取所有官方 SVG
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 获取完整的用户信息
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const svgs = await db.svgs.findMany({
      where: {
        is_official: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json(svgs);
  } catch (error) {
    console.error('[ADMIN_SVGS_GET]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST 方法 - 创建新的官方 SVG
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 获取完整的用户信息
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { title, svg_content, is_public = true } = body;

    if (!title || !svg_content) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const svg = await db.svgs.create({
      data: {
        title,
        svg_content,
        is_public,
        is_official: true,
        user_id: session.user.id
      }
    });

    return NextResponse.json(svg);
  } catch (error) {
    console.error('[ADMIN_SVGS_POST]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}