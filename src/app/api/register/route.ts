import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { RegisterSchema } from "@/schemas";
import crypto from "crypto";

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: 用户注册
 *     tags: [用户]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: 请求参数错误或用户已存在
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: 错误信息
 *                   example: "Email already exists"
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: 错误信息
 *                   example: "注册过程中发生错误，请稍后重试"
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, username, password } = body;

    // 使用 Zod schema 验证
    const validatedFields = RegisterSchema.safeParse({
      email,
      password,
      username,
    });

    if (!validatedFields.success) {
      const errors = validatedFields.error.errors.map(error => error.message);
      return NextResponse.json(
        { error: errors.join(", ") },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email,
        name: username,
        password_hash: hashedPassword,
        status: 'active',
        updated_at: new Date()
      }
    });

    // 不要返回密码相关信息
    const { password_hash, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "注册过程中发生错误，请稍后重试" },
      { status: 500 }
    );
  }
}