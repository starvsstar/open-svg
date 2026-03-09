import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// 验证请求数据的 schema
const feedbackSchema = z.object({
  type: z.enum(["suggestion", "bug", "other"]),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  email: z.string().email(),
});

// 确保导出为异步函数
export async function POST(request: Request) {
  try {
    // 获取会话信息
    const session = await auth();
    
    // 打印请求数据
    const json = await request.json();
    console.log('Received data:', json);

    // 验证数据
    const validatedData = feedbackSchema.parse(json);
    console.log('Validated data:', validatedData);

    // 检查 Prisma 连接
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
    } catch (connError) {
      console.error('Database connection error:', connError);
      throw new Error('Database connection failed');
    }

    try {
      // 尝试创建反馈记录
      const feedbackData = {
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        email: validatedData.email,
        user_id: session?.user?.id || null,
        status: "pending",
      };

      console.log('Attempting to create feedback with data:', feedbackData);

      const feedback = await prisma.feedback.create({
        data: feedbackData,
      });

      console.log('Feedback created successfully:', feedback);

      return NextResponse.json({ 
        success: true, 
        data: feedback 
      }, { 
        status: 201 
      });

    } catch (dbError) {
      // 数据库错误处理
      console.error('Database error:', dbError);
      return NextResponse.json({
        success: false,
        error: "Database error",
        message: dbError instanceof Error ? dbError.message : "Failed to save feedback"
      }, { 
        status: 500 
      });
    }

  } catch (error) {
    // 其他错误处理
    console.error('Server error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Validation error",
        details: error.errors
      }, { 
        status: 400 
      });
    }

    return NextResponse.json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }, { 
      status: 500 
    });
  }

}

// 添加 OPTIONS 方法处理
export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { status: 200 });
}

// 在现有的 POST 和 OPTIONS 方法之外添加 GET 方法
export async function GET(request: Request) {
  try {
    const session = await auth();
    console.log('Debug - Session:', {
      exists: !!session,
      user: session?.user,
      role: session?.user?.role
    });

    // 修改权限检查逻辑
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 检查用户是否有权限访问
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 添加查询参数调试
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    console.log('Debug - Query Params:', { status });
    
    // 构建查询条件
    const where = status && status !== "all" ? { status } : {};
    console.log('Debug - Query Where:', where);

    try {
      // 添加数据库连接调试
      await prisma.$connect();
      console.log('Debug - Database connected successfully');

      // 获取反馈列表
      const feedbacks = await prisma.feedback.findMany({
        where,
        orderBy: {
          created_at: 'desc'
        },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          email: true,
          status: true,
          created_at: true,
          user_id: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      console.log('Debug - Feedbacks found:', feedbacks.length);
      
      return NextResponse.json(feedbacks);
    } catch (dbError) {
      console.error('Debug - Database Error:', dbError);
      return NextResponse.json(
        { error: "Database error", details: dbError instanceof Error ? dbError.message : "Unknown database error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Debug - General Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  } finally {
    // 确保断开数据库连接
    await prisma.$disconnect();
  }
}

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: 提交反馈
 *     tags: [反馈]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, title, description, email]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [suggestion, bug, other]
 *                 description: 反馈类型
 *               title:
 *                 type: string
 *                 description: 反馈标题
 *               description:
 *                 type: string
 *                 description: 反馈详细描述
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 联系邮箱
 *     responses:
 *       201:
 *         description: 反馈提交成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 * 
 *   get:
 *     summary: 获取反馈列表
 *     tags: [反馈]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, resolved, rejected, all]
 *         description: 筛选状态
 *     responses:
 *       200:
 *         description: 成功返回反馈列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Feedback'
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限
 *       500:
 *         description: 服务器错误
 */