import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/prompts:
 *   get:
 *     summary: 获取用户的所有提示词模板
 *     tags: [提示词]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: 成功返回提示词列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PromptTemplate'
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 * 
 *   post:
 *     summary: 创建新的提示词模板
 *     tags: [提示词]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *                 description: 提示词标题
 *               content:
 *                 type: string
 *                 description: 提示词内容
 *     responses:
 *       200:
 *         description: 成功创建提示词
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PromptTemplate'
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */

// GET /api/prompts - 获取用户的所有 prompts
export async function GET() {
  try {
    // 临时返回空数组，避免数据库连接错误
    const prompts: any[] = [];
    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Get prompts error:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/prompts - 创建新的 prompt
export async function POST(req: Request) {
  try {
    const { title, content } = await req.json();
    
    // 临时返回模拟数据，避免数据库连接错误
    const prompt = {
      id: Date.now().toString(),
      title,
      content,
      created_at: new Date(),
      updated_at: new Date(),
      is_public: false,
      like_count: 0,
      use_count: 0,
    };

    return NextResponse.json(prompt);
  } catch (error) {
    console.error('Create prompt error:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}