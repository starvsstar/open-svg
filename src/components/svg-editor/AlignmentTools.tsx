'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ArrowLeftRight,
  ArrowUpDown,
  Grid3X3,
  Move3D,
  Crosshair
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/store/editor'
import { Element as SVGElement } from '@svgdotjs/svg.js'

interface AlignmentToolsProps {
  selectedElements?: SVGElement[]
  onElementsChange?: (elements: SVGElement[]) => void
  className?: string
}

type AlignmentType = 
  | 'left' | 'center' | 'right'
  | 'top' | 'middle' | 'bottom'
  | 'distribute-horizontal' | 'distribute-vertical'

interface ElementBounds {
  element: SVGElement
  x: number
  y: number
  width: number
  height: number
  centerX: number
  centerY: number
  right: number
  bottom: number
}

export function AlignmentTools({ selectedElements = [], onElementsChange, className }: AlignmentToolsProps) {
  const [showGrid, setShowGrid] = useState(false)
  const [showGuides, setShowGuides] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [snapToElements, setSnapToElements] = useState(true)
  const [gridSize, setGridSize] = useState(20)
  const { selectedObject, svgInstance } = useEditorStore()

  // 获取元素边界信息
  const getElementBounds = (element: SVGElement): ElementBounds => {
    const bbox = element.bbox()
    return {
      element,
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
      centerX: bbox.x + bbox.width / 2,
      centerY: bbox.y + bbox.height / 2,
      right: bbox.x + bbox.width,
      bottom: bbox.y + bbox.height
    }
  }

  // 获取选中元素的边界
  const getSelectedBounds = (): ElementBounds[] => {
    const elements = selectedElements.length > 0 ? selectedElements : (selectedObject ? [selectedObject] : [])
    return elements.map(getElementBounds)
  }

  // 获取对齐参考边界
  const getAlignmentReference = (bounds: ElementBounds[]): ElementBounds => {
    if (bounds.length === 0) {
      return {
        element: null as any,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        centerX: 0,
        centerY: 0,
        right: 0,
        bottom: 0
      }
    }

    const minX = Math.min(...bounds.map(b => b.x))
    const minY = Math.min(...bounds.map(b => b.y))
    const maxRight = Math.max(...bounds.map(b => b.right))
    const maxBottom = Math.max(...bounds.map(b => b.bottom))

    return {
      element: null as any,
      x: minX,
      y: minY,
      width: maxRight - minX,
      height: maxBottom - minY,
      centerX: (minX + maxRight) / 2,
      centerY: (minY + maxBottom) / 2,
      right: maxRight,
      bottom: maxBottom
    }
  }

  // 执行对齐操作
  const performAlignment = (type: AlignmentType) => {
    const bounds = getSelectedBounds()
    if (bounds.length < 2) return

    const reference = getAlignmentReference(bounds)

    bounds.forEach(({ element }) => {
      const elementBounds = getElementBounds(element)
      let newX = elementBounds.x
      let newY = elementBounds.y

      switch (type) {
        case 'left':
          newX = reference.x
          break
        case 'center':
          newX = reference.centerX - elementBounds.width / 2
          break
        case 'right':
          newX = reference.right - elementBounds.width
          break
        case 'top':
          newY = reference.y
          break
        case 'middle':
          newY = reference.centerY - elementBounds.height / 2
          break
        case 'bottom':
          newY = reference.bottom - elementBounds.height
          break
      }

      // 应用新位置
      element.move(newX, newY)
    })

    onElementsChange?.(bounds.map(b => b.element))
  }

  // 执行分布操作
  const performDistribution = (type: 'distribute-horizontal' | 'distribute-vertical') => {
    const bounds = getSelectedBounds()
    if (bounds.length < 3) return

    // 按位置排序
    const sortedBounds = [...bounds].sort((a, b) => {
      return type === 'distribute-horizontal' ? a.centerX - b.centerX : a.centerY - b.centerY
    })

    const first = sortedBounds[0]
    const last = sortedBounds[sortedBounds.length - 1]
    const totalSpace = type === 'distribute-horizontal' 
      ? last.centerX - first.centerX
      : last.centerY - first.centerY
    const spacing = totalSpace / (sortedBounds.length - 1)

    sortedBounds.forEach((bounds, index) => {
      if (index === 0 || index === sortedBounds.length - 1) return // 保持首尾元素不动

      const targetPosition = type === 'distribute-horizontal'
        ? first.centerX + spacing * index
        : first.centerY + spacing * index

      const currentCenter = type === 'distribute-horizontal' ? bounds.centerX : bounds.centerY
      const offset = targetPosition - currentCenter

      if (type === 'distribute-horizontal') {
        bounds.element.move(bounds.x + offset, bounds.y)
      } else {
        bounds.element.move(bounds.x, bounds.y + offset)
      }
    })

    onElementsChange?.(bounds.map(b => b.element))
  }

  // 显示/隐藏网格
  const toggleGrid = () => {
    if (!svgInstance) return

    const existingGrid = svgInstance.findOne('#alignment-grid')
    if (existingGrid) {
      existingGrid.remove()
      setShowGrid(false)
    } else {
      createGrid()
      setShowGrid(true)
    }
  }

  // 创建网格
  const createGrid = () => {
    if (!svgInstance) return

    const canvasWidth = svgInstance.width()
    const canvasHeight = svgInstance.height()
    
    const grid = svgInstance.group().id('alignment-grid')
    
    // 垂直线
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      grid.line(x, 0, x, canvasHeight)
        .stroke({ color: '#e5e5e5', width: 1, opacity: 0.5 })
    }
    
    // 水平线
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      grid.line(0, y, canvasWidth, y)
        .stroke({ color: '#e5e5e5', width: 1, opacity: 0.5 })
    }
    
    grid.back() // 移到最底层
  }

  // 智能参考线
  const showSmartGuides = (element: SVGElement) => {
    if (!svgInstance || !showGuides) return

    // 移除现有参考线
    svgInstance.find('.smart-guide').forEach(guide => guide.remove())

    const elementBounds = getElementBounds(element)
    const allElements = svgInstance.children().filter(child => 
      child !== element && child.type !== 'defs' && !child.hasClass('smart-guide')
    ) as SVGElement[]

    const guides: { x1: number, y1: number, x2: number, y2: number }[] = []

    allElements.forEach(otherElement => {
      const otherBounds = getElementBounds(otherElement)
      const threshold = 5 // 对齐阈值

      // 检查水平对齐
      if (Math.abs(elementBounds.x - otherBounds.x) < threshold) {
        guides.push({
          x1: elementBounds.x,
          y1: Math.min(elementBounds.y, otherBounds.y) - 10,
          x2: elementBounds.x,
          y2: Math.max(elementBounds.bottom, otherBounds.bottom) + 10
        })
      }
      if (Math.abs(elementBounds.centerX - otherBounds.centerX) < threshold) {
        guides.push({
          x1: elementBounds.centerX,
          y1: Math.min(elementBounds.y, otherBounds.y) - 10,
          x2: elementBounds.centerX,
          y2: Math.max(elementBounds.bottom, otherBounds.bottom) + 10
        })
      }
      if (Math.abs(elementBounds.right - otherBounds.right) < threshold) {
        guides.push({
          x1: elementBounds.right,
          y1: Math.min(elementBounds.y, otherBounds.y) - 10,
          x2: elementBounds.right,
          y2: Math.max(elementBounds.bottom, otherBounds.bottom) + 10
        })
      }

      // 检查垂直对齐
      if (Math.abs(elementBounds.y - otherBounds.y) < threshold) {
        guides.push({
          x1: Math.min(elementBounds.x, otherBounds.x) - 10,
          y1: elementBounds.y,
          x2: Math.max(elementBounds.right, otherBounds.right) + 10,
          y2: elementBounds.y
        })
      }
      if (Math.abs(elementBounds.centerY - otherBounds.centerY) < threshold) {
        guides.push({
          x1: Math.min(elementBounds.x, otherBounds.x) - 10,
          y1: elementBounds.centerY,
          x2: Math.max(elementBounds.right, otherBounds.right) + 10,
          y2: elementBounds.centerY
        })
      }
      if (Math.abs(elementBounds.bottom - otherBounds.bottom) < threshold) {
        guides.push({
          x1: Math.min(elementBounds.x, otherBounds.x) - 10,
          y1: elementBounds.bottom,
          x2: Math.max(elementBounds.right, otherBounds.right) + 10,
          y2: elementBounds.bottom
        })
      }
    })

    // 绘制参考线
    guides.forEach(guide => {
      svgInstance.line(guide.x1, guide.y1, guide.x2, guide.y2)
        .stroke({ color: '#ff6b6b', width: 1, dasharray: '3,3' })
        .addClass('smart-guide')
    })
  }

  // 网格吸附
  const snapToGridPosition = (x: number, y: number): { x: number, y: number } => {
    if (!snapToGrid) return { x, y }
    
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    }
  }

  const selectedCount = selectedElements.length || (selectedObject ? 1 : 0)

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Move3D className="h-5 w-5" />
          对齐和分布工具
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 选中元素信息 */}
        <div className="text-sm text-muted-foreground">
          已选中 {selectedCount} 个元素
          {selectedCount < 2 && (
            <div className="text-xs mt-1">需要选中至少2个元素才能进行对齐操作</div>
          )}
        </div>

        {/* 对齐工具 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">对齐</Label>
          
          {/* 水平对齐 */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">水平对齐</Label>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => performAlignment('left')}
                disabled={selectedCount < 2}
                className="flex-1"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => performAlignment('center')}
                disabled={selectedCount < 2}
                className="flex-1"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => performAlignment('right')}
                disabled={selectedCount < 2}
                className="flex-1"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 垂直对齐 */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">垂直对齐</Label>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => performAlignment('top')}
                disabled={selectedCount < 2}
                className="flex-1"
              >
                <AlignVerticalJustifyStart className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => performAlignment('middle')}
                disabled={selectedCount < 2}
                className="flex-1"
              >
                <AlignVerticalJustifyCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => performAlignment('bottom')}
                disabled={selectedCount < 2}
                className="flex-1"
              >
                <AlignVerticalJustifyEnd className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* 分布工具 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">分布</Label>
          <div className="text-xs text-muted-foreground mb-2">
            需要选中至少3个元素才能进行分布操作
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => performDistribution('distribute-horizontal')}
              disabled={selectedCount < 3}
              className="flex-1 flex items-center gap-2"
            >
              <ArrowLeftRight className="h-4 w-4" />
              水平分布
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => performDistribution('distribute-vertical')}
              disabled={selectedCount < 3}
              className="flex-1 flex items-center gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              垂直分布
            </Button>
          </div>
        </div>

        <Separator />

        {/* 辅助工具 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">辅助工具</Label>
          
          {/* 网格设置 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">显示网格</Label>
              <Switch
                checked={showGrid}
                onCheckedChange={toggleGrid}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-xs">智能参考线</Label>
              <Switch
                checked={showGuides}
                onCheckedChange={setShowGuides}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-xs">网格吸附</Label>
              <Switch
                checked={snapToGrid}
                onCheckedChange={setSnapToGrid}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-xs">元素吸附</Label>
              <Switch
                checked={snapToElements}
                onCheckedChange={setSnapToElements}
              />
            </div>
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">快捷操作</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // 居中对齐到画布
                const bounds = getSelectedBounds()
                if (bounds.length === 0 || !svgInstance) return
                
                const canvasCenter = {
                  x: svgInstance.width() / 2,
                  y: svgInstance.height() / 2
                }
                
                bounds.forEach(({ element }) => {
                  const elementBounds = getElementBounds(element)
                  element.move(
                    canvasCenter.x - elementBounds.width / 2,
                    canvasCenter.y - elementBounds.height / 2
                  )
                })
              }}
              disabled={selectedCount === 0}
            >
              <Crosshair className="h-4 w-4 mr-1" />
              居中到画布
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // 重置网格
                if (svgInstance) {
                  const existingGrid = svgInstance.findOne('#alignment-grid')
                  if (existingGrid) {
                    existingGrid.remove()
                    createGrid()
                  }
                }
              }}
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              重置网格
            </Button>
          </div>
        </div>

        {/* 网格大小设置 */}
        {showGrid && (
          <div className="space-y-2">
            <Label className="text-xs">网格大小: {gridSize}px</Label>
            <input
              type="range"
              min="10"
              max="50"
              value={gridSize}
              onChange={(e) => {
                setGridSize(Number(e.target.value))
                if (showGrid) {
                  // 重新创建网格
                  const existingGrid = svgInstance?.findOne('#alignment-grid')
                  if (existingGrid) {
                    existingGrid.remove()
                    createGrid()
                  }
                }
              }}
              className="w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}