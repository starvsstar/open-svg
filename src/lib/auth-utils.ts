import { auth } from "@/auth";
import { NextResponse } from "next/server";

// 创建一个统一的身份验证工具函数
export async function requireAuth() {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  return session.user;
}

// 统一的错误处理响应
export function handleApiError(error: unknown) {
  console.error("[API_ERROR]", error);
  
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  return new NextResponse(
    JSON.stringify({ error: "Internal Server Error" }),
    { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
} 