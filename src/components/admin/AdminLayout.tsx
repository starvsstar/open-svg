"use client";

import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* 可以在这里添加管理后台的导航栏等 */}
      <main>{children}</main>
    </div>
  );
} 