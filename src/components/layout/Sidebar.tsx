"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Palette,
  FolderOpen,
  Users,
  ChevronLeft,
  Menu,
  Pencil,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useEffect, useContext } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SidebarContext } from "@/app/(dashboard)/layout";

export function Sidebar() {
  const pathname = usePathname();
  // 检测是否是移动设备
  const isMobile = useMediaQuery("(max-width: 768px)");
  // 使用共享的折叠状态
  const { isCollapsed, setIsCollapsed } = useContext(SidebarContext);

  // 在移动端默认折叠
  useEffect(() => {
    setIsCollapsed(isMobile);
  }, [isMobile, setIsCollapsed]);

  const navItems = [
    {
      label: "仪表盘",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "数据分析",
      href: "/analytics",
      icon: BarChart3,
    },
    {
      label: "创作工作室",
      href: "/studio",
      icon: Palette,
    },
    {
      label: "我的作品",
      href: "/my-svgs",
      icon: FolderOpen,
    },
    {
      label: "SVG编辑器",
      href: "/svg-editor",
      icon: Pencil,
    },
    {
      label: "社区",
      href: "/community",
      icon: Users,
    },
  ];

  return (
    <aside 
      className={cn(
        "border-r bg-background fixed h-full flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        // 移动端样式
        isMobile && !isCollapsed && "shadow-xl"
      )}
    >
      {/* Logo区域 */}
      <div className="h-16 border-b flex items-center px-6 justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/logo.svg" alt="Logo" width={32} height={32} />
          {!isCollapsed && <h1 className="text-lg font-semibold ml-3">SVG</h1>}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 导航区域 */}
      <ScrollArea className="flex-1 px-4 py-4">
        <nav>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg text-sm font-medium transition-colors",
                      isCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} className={cn(
                      "shrink-0",
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    )} />
                    {!isCollapsed && item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollArea>
    </aside>
  );
}