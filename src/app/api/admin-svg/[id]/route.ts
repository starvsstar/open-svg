import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

/**
 * @swagger
 * /api/admin-svg/{id}:
 *   get:
 *     summary: 获取指定的官方SVG
 *     tags: [管理员]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SVG ID
 *     responses:
 *       200:
 *         description: 成功返回SVG
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
 *     summary: 更新指定的官方SVG
 *     tags: [管理员]
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
 *     responses:
 *       200:
 *         description: 成功更新SVG
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
 *
 *   delete:
 *     summary: 删除指定的官方SVG
 *     tags: [管理员]
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
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限
 *       500:
 *         description: 服务器错误
 */

// GET 方法
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const svg = await db.svgs.findFirst({
      where: {
        id: params.id,
        is_official: true
      }
    });

    return NextResponse.json(svg);
  } catch (error) {
    console.error('[ADMIN_SVG_GET]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PUT 方法
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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
    const { title, svg_content, is_public } = body;

    if (!title || !svg_content) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const svg = await db.svgs.update({
      where: {
        id: params.id
      },
      data: {
        title,
        svg_content,
        is_public
      }
    });

    return NextResponse.json(svg);
  } catch (error) {
    console.error('[ADMIN_SVG_PUT]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE 方法
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const id = params.id;
    if (!id) {
      return new NextResponse("SVG ID is required", { status: 400 });
    }

    // 删除相关联的数据
    await db.$transaction([
      // 删除点赞
      db.svgLike.deleteMany({
        where: { svg_id: id },
      }),
      // 删除收藏
      db.svgFavorite.deleteMany({
        where: { svg_id: id },
      }),
      // 删除分享记录
      db.svgShare.deleteMany({
        where: { svg_id: id },
      }),
      // 删除评论
      db.svgComment.deleteMany({
        where: { svg_id: id },
      }),
      // 删除标签关联
      db.svgTag.deleteMany({
        where: { svg_id: id },
      }),
      // 删除版本历史
      db.svgVersion.deleteMany({
        where: { svg_id: id },
      }),
      // 最后删除 SVG 本身
      db.svgs.delete({
        where: { id },
      }),
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[ADMIN_SVG_DELETE]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}