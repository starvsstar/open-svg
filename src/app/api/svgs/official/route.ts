import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

/**
 * @swagger
 * /api/svgs/official:
 *   get:
 *     summary: 获取官方SVG列表
 *     tags: [SVG]
 *     responses:
 *       200:
 *         description: 成功返回官方SVG列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OfficialSVG'
 *       500:
 *         description: 服务器错误
 */

export async function GET() {
  try {
    console.log('Prisma instance check:', {
      isPrismaExists: !!prisma,
      prismaType: typeof prisma,
      hasSvgsModel: !!prisma?.svgs
    });

    if (!prisma?.svgs) {
      console.error('Prisma client or svgs model is not properly initialized');
      return NextResponse.json(
        { error: 'Database connection not properly initialized' },
        { status: 500 }
      );
    }

    const officialSvgs = await prisma.svgs.findMany({
      where: {
        is_official: true,
        is_public: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 8,
      select: {
        id: true,
        title: true,
        svg_content: true
      }
    })

    console.log('Successfully fetched SVGs:', {
      count: officialSvgs.length,
      firstItem: officialSvgs[0]?.id
    });

    return NextResponse.json(officialSvgs)
  } catch (error) {
    const err = error as Error;
    console.error('Failed to fetch official SVGs:', {
      error,
      errorName: err.name,
      errorMessage: err.message,
      stack: err.stack
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch official SVGs' },
      { status: 500 }
    )
  }
}