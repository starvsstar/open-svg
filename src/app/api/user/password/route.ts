import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    const user = await prisma.users.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return new NextResponse("Invalid current password", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.users.update({
      where: {
        email: session.user.email,
      },
      data: {
        password_hash: hashedPassword,
      },
    });

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}