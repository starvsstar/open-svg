import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/svg/export:
 *   post:
 *     summary: 导出SVG为数据URL
 *     tags: [SVG]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SVGExportRequest'
 *     responses:
 *       200:
 *         description: 成功导出SVG
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SVGExportResponse'
 *       500:
 *         description: 服务器错误
 */

export async function POST(request: Request) {
  try {
    const { svg } = await request.json();

    // 直接返回原始 SVG 内容
    return NextResponse.json({
      data: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
    });
  } catch (error) {
    console.error('Export failed:', error);
    return NextResponse.json(
      { error: 'Failed to export SVG' },
      { status: 500 }
    );
  }
} 