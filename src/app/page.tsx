'use client'

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserNav } from "@/components/layout/UserNav";
import { ThemeToggle } from "@/components/theme-toggle";
import { SvgShowcase } from "@/components/svg-showcase";
import { useState } from "react";

// 添加 features 数据
const features = [
  {
    title: "AI智能创作",
    description: "通过我们先进的AI技术，将文字描述瞬间转化为专业的SVG图形。",
    icon: (
      <svg className="w-6 h-6 text-white dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: "智能编辑",
    description: "直观的工具和AI辅助让SVG编辑变得前所未有的简单。",
    icon: (
      <svg className="w-6 h-6 text-white dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    )
  },
  {
    title: "导出分享",
    description: "支持多种格式导出您的SVG作品，轻松与团队分享。",
    icon: (
      <svg className="w-6 h-6 text-white dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    )
  }
];

export default function Home() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 z-50 transition-all duration-300">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Image 
                src="/logo.svg" 
                alt="Logo" 
                width={32} 
                height={32} 
                className="group-hover:scale-110 transition-transform duration-300" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SVG Studio
            </span>
          </Link>
          
          {/* 桌面端导航菜单 */}
          <div className="hidden md:flex items-center gap-8">
             <Link href="/features" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
               功能特色
             </Link>
             <Link href="/templates" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
               模板库
             </Link>
             <Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
               价格方案
             </Link>
           </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {/* 桌面端用户菜单 */}
            <div className="hidden md:flex items-center gap-4">
              {session ? (
                <UserNav />
              ) : (
                <div className="flex items-center gap-3">
                  <Link 
                     href="/login" 
                     className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                   >
                     登录
                   </Link>
                   <Link 
                     href="/register" 
                     className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-medium"
                   >
                     开始使用
                   </Link>
                </div>
              )}
            </div>
            
            {/* 移动端菜单按钮 */}
            <button 
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>
        
        {/* 移动端菜单 */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50">
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col gap-4">
                <Link 
                   href="/features" 
                   className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors py-2"
                   onClick={() => setMobileMenuOpen(false)}
                 >
                   功能特色
                 </Link>
                 <Link 
                   href="/templates" 
                   className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors py-2"
                   onClick={() => setMobileMenuOpen(false)}
                 >
                   模板库
                 </Link>
                 <Link 
                   href="/pricing" 
                   className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors py-2"
                   onClick={() => setMobileMenuOpen(false)}
                 >
                   价格方案
                 </Link>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  {session ? (
                    <UserNav />
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Link 
                         href="/login" 
                         className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors py-2"
                         onClick={() => setMobileMenuOpen(false)}
                       >
                         登录
                       </Link>
                       <Link 
                         href="/register" 
                         className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium text-center"
                         onClick={() => setMobileMenuOpen(false)}
                       >
                         开始使用
                       </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
          {/* 革命性动态背景 */}
          <div className="absolute inset-0">
            {/* 主背景渐变 */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/80 dark:from-gray-950 dark:via-blue-950/30 dark:to-indigo-950/50"></div>
            
            {/* 动态网格背景 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            
            {/* 浮动光效 */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/30 to-purple-600/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/30 to-pink-600/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-indigo-400/30 to-cyan-600/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            
            {/* 几何装饰元素 */}
            <div className="absolute top-20 left-20 w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
            <div className="absolute top-40 right-32 w-1 h-1 bg-purple-500 rounded-full animate-ping animation-delay-1000"></div>
            <div className="absolute bottom-32 left-16 w-1.5 h-1.5 bg-pink-500 rounded-full animate-ping animation-delay-2000"></div>
            <div className="absolute bottom-20 right-20 w-2 h-2 bg-cyan-500 rounded-full animate-ping animation-delay-3000"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-7xl mx-auto">
              {/* 主要内容区域 */}
              <div className="text-center mb-12">
                {/* 超级标题 */}
                <div className="relative mb-6">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-none">
                    <span className="relative">
                      <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x">
                        创建精美的
                      </span>
                      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 blur-lg -z-10 animate-pulse"></div>
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      SVG图形
                    </span>
                  </h1>
                  
                  {/* 副标题带特效 */}
                  <div className="relative mt-4">
                    <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent">
                      AI智能驱动
                    </p>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-2xl"></div>
                  </div>
                </div>
                
                {/* 描述文字重新设计 */}
                 <div className="max-w-4xl mx-auto mb-10">
                   <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                     将您的
                     <span className="relative inline-block mx-2">
                       <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-semibold">创意灵感</span>
                       <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transform scale-x-0 animate-scale-x block"></span>
                     </span>
                     瞬间转化为
                     <span className="relative inline-block mx-2">
                       <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold">专业矢量图形</span>
                       <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 transform scale-x-0 animate-scale-x animation-delay-500 block"></span>
                     </span>
                   </p>
                 </div>
                
                {/* 重新设计的特色标签 */}
                <div className="flex flex-wrap justify-center gap-3 mb-10">
                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                    <div className="relative px-4 py-2 bg-white dark:bg-gray-900 rounded-xl leading-none flex items-center">
                      <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">✨ AI智能驱动</span>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt animation-delay-1000"></div>
                    <div className="relative px-4 py-2 bg-white dark:bg-gray-900 rounded-xl leading-none flex items-center">
                      <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">🎨 专业品质</span>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-red-600 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt animation-delay-2000"></div>
                    <div className="relative px-4 py-2 bg-white dark:bg-gray-900 rounded-xl leading-none flex items-center">
                      <span className="text-pink-600 dark:text-pink-400 text-sm font-medium">⚡ 即时生成</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SVG Showcase with scroll */}
              <div className="w-full max-w-7xl mx-auto mb-8">
                <SvgShowcase />
              </div>

              {/* CTA按钮组优化 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                <Link 
                  href={session ? "/studio" : "/login?redirect=/studio"}
                  className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 flex items-center justify-center gap-3 font-semibold text-lg"
                >
                  <span className="relative z-10">免费开始创作</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                </Link>
                
                <Link 
                  href="/templates" 
                  className="group px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 font-semibold text-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  浏览模板
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-pink-50/80 dark:from-gray-900 dark:via-indigo-950/50 dark:to-purple-950/50" />
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          {/* 装饰性元素 */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-xl animate-pulse delay-1000"></div>
          
          <div className="container mx-auto px-4 relative">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    强大功能
                  </span>
                  <br />
                  <span className="text-gray-900 dark:text-white text-3xl lg:text-4xl">
                    为现代创作者而生
                  </span>
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  创建、编辑和分享专业SVG图形所需的一切功能
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                {features.map((feature, index) => (
                  <div 
                    key={index} 
                    className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 lg:p-10
                      border border-gray-200/50 dark:border-gray-700/50 
                      hover:shadow-2xl hover:shadow-indigo-500/20 dark:hover:shadow-indigo-500/10
                      hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                  >
                    {/* 背景渐变效果 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-pink-950/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* 装饰性光效 */}
                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 
                        rounded-2xl rotate-3 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500
                        flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <div className="w-full h-full text-white flex items-center justify-center">
                          {feature.icon}
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                        {feature.description}
                      </p>
                    </div>
                    
                    {/* 底部装饰线 */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-3xl" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}