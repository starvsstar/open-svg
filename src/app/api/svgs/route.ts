import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { svgOperations } from "@/lib/db-utils";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/svgs:
 *   post:
 *     summary: 创建新的SVG
 *     tags: [SVG]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSVGRequest'
 *     responses:
 *       200:
 *         description: 成功创建SVG
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SVG'
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    logger.log('info', 'Creating new SVG', { user_id: user.id });

    let body;
    try {
      body = await req.json();
    } catch (e) {
      logger.log('error', 'Failed to parse request body', { error: e });
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const { title, svg_content, is_public, category } = body;

    // 添加请求数据的日志
    logger.log('debug', 'Request data', { 
      hasTitle: !!title, 
      hasSvgContent: !!svg_content,
      is_public,
      category 
    });

    if (!title || !svg_content) {
      logger.log('warn', 'Missing required fields', { 
        title: !!title, 
        hasContent: !!svg_content 
      });
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const result = await svgOperations.create({
      title,
      svg_content,
      user_id: user.id,
      is_public,
      category
    });

    logger.log('info', 'SVG created successfully', { svg_id: result?.id ?? 'unknown' });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.log('error', 'Failed to create SVG', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return handleApiError(error);
  }
} 