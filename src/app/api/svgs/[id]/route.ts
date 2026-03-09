import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// 添加管理员检查辅助函数
async function isAdmin(userId: string) {
  const user = await db.users.findUnique({
    where: { id: userId }
  });
  return user?.role === "ADMIN";
}

/**
 * @swagger
 * /api/svgs/{id}:
 *   get:
 *     summary: 获取SVG信息（管理员接口）
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
 *       - in: header
 *         name: x-admin-request
 *         schema:
 *           type: string
 *           enum: ['true']
 *         description: 管理员请求标识
 *     responses:
 *       200:
 *         description: 成功返回SVG信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SVG'
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限
 *       500:
 *         description: 服务器错误
 * 
 *   put:
 *     summary: 更新SVG
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SVGUpdateRequest'
 *     responses:
 *       200:
 *         description: 成功更新SVG
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SVGSuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 *   delete:
 *     summary: 删除SVG
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
 *       200:
 *         description: 成功删除SVG
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限
 *       404:
 *         description: SVG不存在
 *       500:
 *         description: 服务器错误
 */

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = await params.id;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 检查是否是管理员请求
    const isAdminRequest = req.headers.get('x-admin-request') === 'true';
    if (isAdminRequest) {
      const admin = await isAdmin(session.user.id);
      if (!admin) {
        return new NextResponse("Forbidden", { status: 403 });
      }
      // 管理员特殊处理逻辑
      const svg = await db.svgs.findFirst({
        where: {
          id,
          is_official: true
        }
      });
      return NextResponse.json(svg);
    }

    // 普通用户逻辑...
  } catch (error) {
    console.error("[SVG_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = await params.id;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 检查 SVG 是否存在且属于当前用户
    const svg = await db.svgs.findUnique({
      where: { id },
      select: { user_id: true }
    });

    if (!svg) {
      return new NextResponse("SVG not found", { status: 404 });
    }

    if (svg.user_id !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // 使用事务同时删除 SVG 和相关的版本记录
    await db.$transaction(async (tx) => {
      // 删除相关的版本记录
      await tx.svg_versions.deleteMany({
        where: { svg_id: id }
      });

      // 删除 SVG
      await tx.svgs.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SVG_DELETE]", error);
    return new NextResponse(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal Server Error"
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    // 确保 id 存在
    if (!context.params?.id) {
      return new NextResponse("Invalid ID", { status: 400 });
    }
    const id = context.params.id;

    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 解析请求体
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const { title, svg_content, is_public } = body;

    // 验证必需的字段
    if (!title || !svg_content) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // 检查 SVG 是否存在且属于当前用户
    const svg = await db.svgs.findUnique({
      where: { id },
      select: { user_id: true }
    });

    if (!svg) {
      return new NextResponse("SVG not found", { status: 404 });
    }

    if (svg.user_id !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // 使用事务更新 SVG 和创建新版本
    const result = await db.$transaction(async (tx) => {
      // 更新 SVG
      const updatedSvg = await tx.svgs.update({
        where: { id },
        data: {
          title,
          svg_content,
          is_public,
          updated_at: new Date(), // 添加更新时间
        },
      });

      // 获取最新版本号
      const latestVersion = await tx.svg_versions.findFirst({
        where: { svg_id: id },
        orderBy: { version_number: 'desc' },
      });

      // 创建新版本
      await tx.svg_versions.create({
        data: {
          id: crypto.randomUUID(), // 确保添加 id 字段
          svg_id: id,
          svg_content,
          version_number: (latestVersion?.version_number ?? 0) + 1,
          created_by: session.user.id,
        },
      });

      return updatedSvg;
    });

    return NextResponse.json({ 
      success: true, 
      data: result 
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error("[SVG_UPDATE]", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error"
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 