import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/templates/random:
 *   get:
 *     summary: 随机获取一个模板
 *     tags: [模板]
 *     responses:
 *       200:
 *         description: 成功返回随机模板
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TemplateResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

export async function GET() {
  try {
    // 获取所有模板的数量
    const count = await prisma.template.count();
    
    // 生成随机跳过的数量
    const skip = Math.floor(Math.random() * count);
    
    // 随机获取一个模板
    const randomTemplate = await prisma.template.findMany({
      take: 1,
      skip: skip,
    });

    return NextResponse.json(randomTemplate[0]);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
} 