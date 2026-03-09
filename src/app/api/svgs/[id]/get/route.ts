import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/svgs/{id}/get:
 *   get:
 *     summary: 获取指定SVG的详细信息
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
 *         description: 成功返回SVG详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SVGDetailResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const svg = await prisma.svgs.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        svg_content: true,
        is_public: true,
        user_id: true,
      }
    });

    if (!svg) {
      return NextResponse.json(
        { error: 'SVG not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(svg);
  } catch (error) {
    const err = error as Error;
    console.error('Failed to fetch SVG:', {
      error,
      errorName: err.name,
      errorMessage: err.message,
      stack: err.stack
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch SVG' },
      { status: 500 }
    );
  }
}