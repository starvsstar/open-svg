"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useState, useEffect, createContext, useContext } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

// 创建一个 Context 来共享折叠状态
export const SidebarContext = createContext<{
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}>({
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsCollapsed(isMobile);
  }, [isMobile]);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className={cn(
          "transition-all duration-300",
          isCollapsed ? "ml-16" : "ml-64",
          // 移动端时不需要 margin
          isMobile && "ml-0"
        )}>
          <Header />
          <main className="h-[calc(100vh-4rem)]">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
} 