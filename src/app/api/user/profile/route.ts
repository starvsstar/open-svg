import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name } = await req.json();

    await prisma.users.update({
      where: {
        email: session.user.email,
      },
      data: {
        name,
      },
    });

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const randomTemplate = await prisma.template.findMany({
      take: 1,
      orderBy: {
        _count: 'asc'
      }
    });

    return NextResponse.json(randomTemplate[0]);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}