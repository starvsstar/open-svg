import { NextResponse } from 'next/server';
import { svgModel } from '@/lib/models/svg';

/**
 * @swagger
 * /api/svg:
 *   get:
 *     summary: 获取公开的SVG列表
 *     tags: [SVG]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功返回SVG列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SVGListResponse'
 *       500:
 *         description: 服务器错误
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    const svgs = await svgModel.findPublic(page, limit);
    return NextResponse.json(svgs);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch SVGs' },
      { status: 500 }
    );
  }
} 