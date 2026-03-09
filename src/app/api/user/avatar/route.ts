import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    // 验证文件类型和大小
    if (!file.type.startsWith('image/')) {
      return new NextResponse("File must be an image", { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      return new NextResponse("File size too large", { status: 400 });
    }

    // 生成文件名
    const fileName = `${session.user.email}-${Date.now()}${path.extname(file.name)}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 保存文件
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    await writeFile(path.join(uploadDir, fileName), buffer);

    // 更新用户头像URL
    const avatarUrl = `/uploads/${fileName}`;
    await prisma.users.update({
      where: {
        email: session.user.email,
      },
      data: {
        avatar_url: avatarUrl,
      },
    });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("[AVATAR_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};