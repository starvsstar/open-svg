'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useEditorStore } from '@/store/editor'
import { 
  MousePointer2,
  Square, 
  Circle, 
  Triangle,
  Pen, 
  Type,
  Image as ImageIcon,
  Hand,
  ZoomIn
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function Toolbar() {
  const { activeTool, setActiveTool } = useEditorStore()

  const tools = [
    {
      id: 'select',
      icon: MousePointer2,
      label: '选择工具',
      shortcut: 'V'
    },
    {
      id: 'hand',
      icon: Hand,
      label: '平移工具',
      shortcut: 'H'
    },
    {
      id: 'zoom',
      icon: ZoomIn,
      label: '缩放工具',
      shortcut: 'Z'
    }
  ]

  const shapeTools = [
    {
      id: 'rectangle',
      icon: Square,
      label: '矩形工具',
      shortcut: 'R'
    },
    {
      id: 'circle',
      icon: Circle,
      label: '圆形工具',
      shortcut: 'C'
    },
    {
      id: 'triangle',
      icon: Triangle,
      label: '三角形工具',
      shortcut: 'T'
    }
  ]

  const drawingTools = [
    {
      id: 'pen',
      icon: Pen,
      label: '画笔工具',
      shortcut: 'P'
    },
    {
      id: 'text',
      icon: Type,
      label: '文本工具',
      shortcut: 'T'
    },
    {
      id: 'image',
      icon: ImageIcon,
      label: '图片工具',
      shortcut: 'I'
    }
  ]

  return (
    <div className="flex flex-col gap-1 p-2 h-full">
      {/* 基础工具 */}
      <div className="space-y-1">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === tool.id ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setActiveTool(tool.id as any)}
                  className="w-12 h-12"
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{tool.label} ({tool.shortcut})</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      <Separator className="my-2" />

      {/* 形状工具 */}
      <div className="space-y-1">
        {shapeTools.map((tool) => {
          const Icon = tool.icon
          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === tool.id ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setActiveTool(tool.id as any)}
                  className="w-12 h-12"
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{tool.label} ({tool.shortcut})</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      <Separator className="my-2" />

      {/* 绘图工具 */}
      <div className="space-y-1">
        {drawingTools.map((tool) => {
          const Icon = tool.icon
          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === tool.id ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setActiveTool(tool.id as any)}
                  className="w-12 h-12"
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{tool.label} ({tool.shortcut})</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      {/* 底部填充空间 */}
      <div className="flex-1" />

      {/* 当前工具指示 */}
      <div className="text-xs text-center text-muted-foreground p-1 border-t">
        {tools.concat(shapeTools, drawingTools).find(t => t.id === activeTool)?.label || '未知工具'}
      </div>
    </div>
  )
}