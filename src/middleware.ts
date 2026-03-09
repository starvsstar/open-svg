import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const userRole = req.auth?.user?.role;

  // 定义需要保护的路由
  const protectedPaths = [
    '/dashboard',
    '/studio',
    '/my-svgs',
    '/community',
    '/settings',
    '/api/prompts',
    '/api/my-svgs',
    '/api/svgs',
  ];

  // 定义管理员专用路由
  const adminPaths = [
    '/admin',
    '/api/admin'
  ];

  // 检查当前路径
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );
  
  const isAdminPath = adminPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );

  // 如果是管理员路径，检查用户是否是管理员
  if (isAdminPath) {
    if (!isAuthenticated) {
      const callbackUrl = encodeURIComponent(req.nextUrl.pathname);
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${callbackUrl}`, req.nextUrl)
      );
    }
    
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(
        new URL('/403', req.nextUrl)
      );
    }
  }

  return NextResponse.next();
});

// 更新中间件配置以包含管理员路由
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/studio/:path*',
    '/my-svgs/:path*',
    '/community/:path*',
    '/settings/:path*',
    '/api/prompts/:path*',
    '/api/my-svgs/:path*',
    '/api/svgs/:path*',
    '/admin/:path*',  // 添加管理员路由
    '/api/admin/:path*',  // 修改这里，匹配新的管理员 API 路由
    '/api/admin-svg/:path*',  // 更新路径
    '/login',
  ]
}; 
