'use client'

import { useEffect, useState, useCallback } from 'react'
import { SVGPreview } from './svg-preview'

// 模板SVG数据接口
interface TemplateSvg {
  id: string
  title: string
  svg_content: string
}

// Fisher-Yates 洗牌算法
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// SVG卡片组件
function SvgCard({ svg, index }: { svg: TemplateSvg; index: number }) {
  return (
    <div
      className="group relative flex-shrink-0 w-[280px] h-[380px] bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 hover:-translate-y-2"
      style={{
        animationDelay: `${index * 100}ms`
      }}
    >
      {/* 背景渐变效果 */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-pink-950/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* SVG内容区域 */}
      <div className="relative h-80 p-8 flex items-center justify-center">
        <SVGPreview 
          content={svg.svg_content}
          className="text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors duration-300 max-w-full max-h-full"
        />
      </div>
      
      {/* 标题区域 */}
      <div className="relative p-6 bg-gradient-to-t from-white/90 to-transparent dark:from-gray-800/90 dark:to-transparent">
        <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 text-center">
          {svg.title}
        </h4>
      </div>
      
      {/* 装饰性光效 */}
      <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* 底部装饰线 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </div>
  )
}

export function SvgShowcase() {
  const [allTemplates, setAllTemplates] = useState<TemplateSvg[]>([])
  const [currentSvgs, setCurrentSvgs] = useState<TemplateSvg[]>([])
  const [nextSvgs, setNextSvgs] = useState<TemplateSvg[]>([])
  const [loading, setLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // 获取模板数据
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch('/api/community?sort=random&page=1')
        const data = await response.json()
        const templates = data.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          svg_content: item.svg_content
        }))
        setAllTemplates(templates)
        // 初始随机排序，显示5个SVG
        const shuffledData = shuffleArray(templates)
        setCurrentSvgs(shuffledData.slice(0, 5))
      } catch (error) {
        console.error('Failed to fetch templates:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  // 平滑切换到新的SVG组合
  const shuffleDisplay = useCallback(() => {
    if (allTemplates.length > 0 && !isTransitioning) {
      const shuffled = shuffleArray(allTemplates)
      const newSvgs = shuffled.slice(0, 5)
      
      // 设置下一组SVG
      setNextSvgs(newSvgs)
      setIsTransitioning(true)
      
      // 1秒后完成过渡
      setTimeout(() => {
        setCurrentSvgs(newSvgs)
        setIsTransitioning(false)
      }, 1000)
    }
  }, [allTemplates, isTransitioning])

  // 自动随机展示
  useEffect(() => {
    if (allTemplates.length === 0) return
    
    const interval = setInterval(() => {
      shuffleDisplay()
    }, 8000) // 每8秒自动切换

    return () => clearInterval(interval)
  }, [allTemplates, shuffleDisplay])

  if (loading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">加载精美作品中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto relative">
      {/* 简化的标题 */}
      <div className="flex items-center justify-center mb-8 px-4">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          精选作品展示
        </h3>
      </div>

      {/* 单行展示区域 */}
      <div className="relative overflow-hidden h-[420px]">
        {/* 左右渐变遮罩 */}
        <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
        
        {/* 滚动容器 */}
         <div className="relative w-full h-full">
           {/* 当前显示的SVG */}
           <div 
             className={`absolute top-0 left-0 flex gap-6 py-4 px-8 transition-transform duration-1000 ease-in-out ${
               isTransitioning ? '-translate-x-full' : 'translate-x-0'
             }`}
             style={{ width: 'calc(5 * 280px + 4 * 24px + 64px)' }} // 5个卡片 + 4个间距 + 左右padding
           >
             {currentSvgs.map((svg, index) => (
               <SvgCard key={`current-${svg.id}`} svg={svg} index={index} />
             ))}
           </div>
           
           {/* 下一组SVG（从右侧滑入） */}
           {isTransitioning && (
             <div 
               className={`absolute top-0 left-0 flex gap-6 py-4 px-8 transition-transform duration-1000 ease-in-out transform translate-x-full ${
                 isTransitioning ? '-translate-x-0' : ''
               }`}
               style={{ 
                 width: 'calc(5 * 280px + 4 * 24px + 64px)',
                 transform: isTransitioning ? 'translateX(0)' : 'translateX(100%)'
               }}
             >
               {nextSvgs.map((svg, index) => (
                 <SvgCard key={`next-${svg.id}`} svg={svg} index={index} />
               ))}
             </div>
           )}
         </div>
      </div>
    </div>
  )
}