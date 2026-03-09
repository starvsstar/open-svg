'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Play, 
  Lightbulb,
  MousePointer,
  Keyboard,
  Palette,
  Layers,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface GuideStep {
  id: string
  title: string
  description: string
  target?: string // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right'
  icon?: React.ReactNode
  action?: () => void
}

interface UserGuideProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

const guideSteps: GuideStep[] = [
  {
    id: 'welcome',
    title: '欢迎使用SVG编辑器',
    description: '这是一个功能强大的在线SVG编辑器，让我们一起来了解它的主要功能。',
    icon: <Lightbulb className="h-6 w-6" />
  },
  {
    id: 'toolbar',
    title: '工具栏',
    description: '左侧工具栏包含了所有绘图工具：选择工具、形状工具、文本工具等。点击任意工具开始创作。',
    target: '.tool-panel',
    position: 'right',
    icon: <MousePointer className="h-6 w-6" />
  },
  {
    id: 'canvas',
    title: '画布区域',
    description: '中央的白色区域是您的创作画布。您可以在这里绘制、编辑和组织您的SVG元素。',
    target: '.svg-container',
    position: 'top',
    icon: <Palette className="h-6 w-6" />
  },
  {
    id: 'properties',
    title: '属性面板',
    description: '右侧面板显示选中元素的属性，您可以在这里调整颜色、大小、位置等属性。',
    target: '.properties-panel',
    position: 'left',
    icon: <Layers className="h-6 w-6" />
  },
  {
    id: 'shortcuts',
    title: '快捷键',
    description: '使用快捷键提高效率：Ctrl+Z 撤销，Ctrl+Y 重做，Delete 删除选中元素，方向键移动元素。',
    icon: <Keyboard className="h-6 w-6" />
  },
  {
    id: 'export',
    title: '导出作品',
    description: '完成创作后，您可以将作品导出为SVG、PNG、JPG等多种格式。',
    target: '.export-button',
    position: 'bottom',
    icon: <Download className="h-6 w-6" />
  }
]

export function UserGuide({ isOpen, onClose, onComplete }: UserGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)

  const currentGuideStep = guideSteps[currentStep]
  const isLastStep = currentStep === guideSteps.length - 1
  const isFirstStep = currentStep === 0

  // 高亮目标元素
  useEffect(() => {
    if (!isOpen || !currentGuideStep.target) {
      removeHighlight()
      return
    }

    const targetElement = document.querySelector(currentGuideStep.target) as HTMLElement
    if (targetElement) {
      highlightElement(targetElement)
    }

    return () => removeHighlight()
  }, [currentStep, isOpen, currentGuideStep.target])

  const highlightElement = (element: HTMLElement) => {
    removeHighlight()
    
    // 创建高亮遮罩
    const overlay = document.createElement('div')
    overlay.className = 'user-guide-overlay'
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: 40;
      pointer-events: none;
    `
    
    // 创建高亮区域
    const rect = element.getBoundingClientRect()
    const highlight = document.createElement('div')
    highlight.className = 'user-guide-highlight'
    highlight.style.cssText = `
      position: fixed;
      top: ${rect.top - 8}px;
      left: ${rect.left - 8}px;
      width: ${rect.width + 16}px;
      height: ${rect.height + 16}px;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      background: rgba(59, 130, 246, 0.1);
      z-index: 41;
      pointer-events: none;
      animation: pulse 2s infinite;
    `
    
    document.body.appendChild(overlay)
    document.body.appendChild(highlight)
    
    setHighlightedElement(element)
  }

  const removeHighlight = () => {
    const overlay = document.querySelector('.user-guide-overlay')
    const highlight = document.querySelector('.user-guide-highlight')
    
    if (overlay) overlay.remove()
    if (highlight) highlight.remove()
    
    setHighlightedElement(null)
  }

  const nextStep = () => {
    if (currentGuideStep.action) {
      currentGuideStep.action()
    }
    
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    removeHighlight()
    onComplete?.()
    onClose()
    
    // 标记用户已完成引导
    localStorage.setItem('svg-editor-guide-completed', 'true')
  }

  const handleSkip = () => {
    removeHighlight()
    onClose()
  }

  // 添加CSS动画
  useEffect(() => {
    if (!document.querySelector('#user-guide-styles')) {
      const style = document.createElement('style')
      style.id = 'user-guide-styles'
      style.textContent = `
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentGuideStep.icon}
              <DialogTitle className="text-lg">{currentGuideStep.title}</DialogTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {currentStep + 1} / {guideSteps.length}
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <DialogDescription className="text-sm leading-relaxed">
            {currentGuideStep.description}
          </DialogDescription>
          
          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / guideSteps.length) * 100}%` }}
            />
          </div>
          
          {/* 导航按钮 */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
            >
              跳过引导
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={isFirstStep}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                上一步
              </Button>
              
              <Button
                size="sm"
                onClick={nextStep}
              >
                {isLastStep ? (
                  <>
                    完成
                    <Play className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    下一步
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 检查是否需要显示用户引导
export function shouldShowGuide(): boolean {
  if (typeof window === 'undefined') return false
  return !localStorage.getItem('svg-editor-guide-completed')
}

// 重置引导状态（用于测试）
export function resetGuide(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('svg-editor-guide-completed')
  }
}