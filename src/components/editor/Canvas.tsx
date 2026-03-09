'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'
import { cn } from '@/lib/utils'
import { SVG, Svg, Element as SVGElement } from '@svgdotjs/svg.js'
import '@svgdotjs/svg.draggable.js'
import '@svgdotjs/svg.select.js'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCcw, Grid, Eye, EyeOff } from 'lucide-react'

// SVG.js 相关类型
interface CanvasState {
  isDragging: boolean;
  lastPosX: number;
  lastPosY: number;
  zoom: number;
  showGrid: boolean;
  showRulers: boolean;
}

export function Canvas() {
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const [svgInstance, setSvgInstance] = useState<Svg | null>(null)
  const [canvasState, setCanvasState] = useState<CanvasState>({
    isDragging: false,
    lastPosX: 0,
    lastPosY: 0,
    zoom: 1,
    showGrid: true,
    showRulers: true
  })
  const { zoom, setZoom, pan, setPan, activeTool, selectedObject, setSelectedObject } = useEditorStore()

  // 初始化SVG画布
  useEffect(() => {
    if (!svgContainerRef.current) return

    // 清除旧实例
    if (svgInstance) {
      svgInstance.remove()
    }

    // 创建新的SVG实例
    const svg = SVG().addTo(svgContainerRef.current).size(800, 600)
    
    // 设置背景
    svg.rect(800, 600).fill('#ffffff').move(0, 0)

    // 创建网格背景
    const createGrid = () => {
      const gridSize = 20
      const gridGroup = svg.group().addClass('grid-group')
      
      // 垂直线
      for (let i = 0; i <= 800; i += gridSize) {
        gridGroup.line(i, 0, i, 600).stroke({ color: '#e5e5e5', width: 0.5, opacity: 0.7 })
      }
      // 水平线
      for (let i = 0; i <= 600; i += gridSize) {
        gridGroup.line(0, i, 800, i).stroke({ color: '#e5e5e5', width: 0.5, opacity: 0.7 })
      }
      
      // 主网格线（每100px）
      for (let i = 0; i <= 800; i += 100) {
        gridGroup.line(i, 0, i, 600).stroke({ color: '#d1d5db', width: 1, opacity: 0.8 })
      }
      for (let i = 0; i <= 600; i += 100) {
        gridGroup.line(0, i, 800, i).stroke({ color: '#d1d5db', width: 1, opacity: 0.8 })
      }
      
      gridGroup.back()
      gridGroup.hide(!canvasState.showGrid)
      return gridGroup
    }
    
    const gridGroup = createGrid()

    // SVG点击事件处理
    svg.on('click', (event) => {
      const target = event.target
      if (target && target !== svg.node) {
        const svgElement = SVG(target)
        setSelectedObject(svgElement)
        
        // 添加选择效果
        if (typeof svgElement.selectize === 'function') {
          svgElement.selectize({
            rotationPoint: true,
            pointType: 'circle'
          })
        }
      } else {
        // 取消选择
        if (selectedObject && typeof selectedObject.selectize === 'function') {
          selectedObject.selectize(false)
        }
        setSelectedObject(null)
      }
    })

    // 鼠标滚轮缩放（以鼠标位置为中心）
    svg.node.addEventListener('wheel', (event) => {
      event.preventDefault()
      const rect = svg.node.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      
      const delta = event.deltaY
      let newZoom = canvasState.zoom
      const zoomFactor = delta > 0 ? 0.9 : 1.1
      newZoom *= zoomFactor
      
      // 限制缩放范围
      if (newZoom > 10) newZoom = 10
      if (newZoom < 0.1) newZoom = 0.1
      
      // 计算缩放中心点偏移
      const zoomDelta = newZoom - canvasState.zoom
      const offsetX = (mouseX - 400) * zoomDelta
      const offsetY = (mouseY - 300) * zoomDelta
      
      setCanvasState(prev => ({ ...prev, zoom: newZoom }))
      setZoom(newZoom)
      
      // 应用缩放和平移
      svg.node.style.transform = `scale(${newZoom})`
      svg.node.style.transformOrigin = `${mouseX}px ${mouseY}px`
    })

    // 平移处理
    svg.node.addEventListener('mousedown', (event) => {
      if (event.altKey) {
        setCanvasState(prev => ({
          ...prev,
          isDragging: true,
          lastPosX: event.clientX,
          lastPosY: event.clientY
        }))
      }
    })

    svg.node.addEventListener('mousemove', (event) => {
      if (canvasState.isDragging) {
        const deltaX = event.clientX - canvasState.lastPosX
        const deltaY = event.clientY - canvasState.lastPosY
        
        setPan({
          x: pan.x + deltaX,
          y: pan.y + deltaY
        })
        
        setCanvasState(prev => ({
          ...prev,
          lastPosX: event.clientX,
          lastPosY: event.clientY
        }))
      }
    })

    svg.node.addEventListener('mouseup', () => {
      setCanvasState(prev => ({ ...prev, isDragging: false }))
    })

    // 绘图工具处理
    const handleCanvasClick = (event: MouseEvent) => {
      if (activeTool === 'select' || event.altKey) return

      const rect = svg.node.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      let element: SVGElement | null = null

      switch (activeTool) {
        case 'rectangle':
          element = svg.rect(100, 100)
            .move(x - 50, y - 50)
            .fill('transparent')
            .stroke({ color: '#000', width: 2 })
            .draggable()
          break
        case 'circle':
          element = svg.circle(100)
            .move(x - 50, y - 50)
            .fill('transparent')
            .stroke({ color: '#000', width: 2 })
            .draggable()
          break
        case 'triangle':
          element = svg.polygon('50,0 100,100 0,100')
            .move(x - 50, y - 50)
            .fill('transparent')
            .stroke({ color: '#000', width: 2 })
            .draggable()
          break
        case 'text':
          element = svg.text('文本')
            .move(x, y)
            .font({ size: 16, family: 'Arial' })
            .fill('#000')
            .draggable()
          break
      }

      if (element) {
        setSelectedObject(element)
        if (typeof element.selectize === 'function') {
          element.selectize({
            rotationPoint: true,
            pointType: 'circle'
          })
        }
      }
    }

    svg.node.addEventListener('click', handleCanvasClick)

    setSvgInstance(svg)

    return () => {
      svg.node.removeEventListener('click', handleCanvasClick)
      svg.remove()
    }
  }, [activeTool, canvasState.isDragging])

  // 缩放控制函数
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(canvasState.zoom * 1.2, 10)
    setCanvasState(prev => ({ ...prev, zoom: newZoom }))
    setZoom(newZoom)
    if (svgInstance) {
      svgInstance.node.style.transform = `scale(${newZoom})`
    }
  }, [canvasState.zoom, svgInstance, setZoom])

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(canvasState.zoom * 0.8, 0.1)
    setCanvasState(prev => ({ ...prev, zoom: newZoom }))
    setZoom(newZoom)
    if (svgInstance) {
      svgInstance.node.style.transform = `scale(${newZoom})`
    }
  }, [canvasState.zoom, svgInstance, setZoom])

  const handleResetZoom = useCallback(() => {
    setCanvasState(prev => ({ ...prev, zoom: 1 }))
    setZoom(1)
    setPan({ x: 0, y: 0 })
    if (svgInstance) {
      svgInstance.node.style.transform = 'scale(1)'
    }
  }, [svgInstance, setZoom, setPan])

  const toggleGrid = useCallback(() => {
    setCanvasState(prev => ({ ...prev, showGrid: !prev.showGrid }))
    if (svgInstance) {
      const gridGroup = svgInstance.findOne('.grid-group')
      if (gridGroup) {
        gridGroup.toggle(!canvasState.showGrid)
      }
    }
  }, [canvasState.showGrid, svgInstance])

  const toggleRulers = useCallback(() => {
    setCanvasState(prev => ({ ...prev, showRulers: !prev.showRulers }))
  }, [])

  // 生成标尺刻度
  const generateRulerMarks = (length: number, isVertical = false) => {
    const marks = []
    for (let i = 0; i <= length; i += 10) {
      const isMajor = i % 50 === 0
      marks.push(
        <div
          key={i}
          className={cn(
            "absolute text-xs text-muted-foreground",
            isVertical ? "left-0 flex items-center" : "top-0 flex justify-center"
          )}
          style={{
            [isVertical ? 'top' : 'left']: `${(i / length) * 100}%`,
            transform: isVertical ? 'translateY(-50%)' : 'translateX(-50%)'
          }}
        >
          {isMajor && (
            <span className={cn(
              "text-xs",
              isVertical && "transform -rotate-90 origin-center"
            )}>
              {i}
            </span>
          )}
          <div
            className={cn(
              "bg-border",
              isVertical 
                ? `w-${isMajor ? '3' : '2'} h-px ml-1`
                : `h-${isMajor ? '3' : '2'} w-px mt-1`
            )}
          />
        </div>
      )
    }
    return marks
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50">
      {/* 控制按钮 */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <div className="bg-background/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleZoomIn}
            title="放大 (Ctrl + +)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleZoomOut}
            title="缩小 (Ctrl + -)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleResetZoom}
            title="重置视图 (Ctrl + 0)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="bg-background/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border flex gap-1">
          <Button
            variant={canvasState.showGrid ? "default" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={toggleGrid}
            title="切换网格 (Ctrl + G)"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={canvasState.showRulers ? "default" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={toggleRulers}
            title="切换标尺 (Ctrl + R)"
          >
            {canvasState.showRulers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 标尺 */}
      {canvasState.showRulers && (
        <>
          <div className="absolute top-0 left-0 w-full h-6 bg-background border-b z-10">
            {/* 水平标尺 */}
            <div className="relative w-full h-full">
              {generateRulerMarks(800)}
            </div>
          </div>
          <div className="absolute top-0 left-0 w-6 h-full bg-background border-r z-10">
            {/* 垂直标尺 */}
            <div className="relative w-full h-full">
              {generateRulerMarks(600, true)}
            </div>
          </div>
        </>
      )}
      
      {/* SVG容器 */}
      <div 
        ref={svgContainerRef} 
        className="absolute bg-white shadow-sm border"
        style={{
          top: canvasState.showRulers ? '24px' : '0px',
          left: canvasState.showRulers ? '24px' : '0px',
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          cursor: canvasState.isDragging ? 'grabbing' : activeTool === 'select' ? 'default' : 'crosshair'
        }}
      />
      
      {/* 状态信息 */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-muted-foreground shadow-sm border">
        <div className="flex items-center gap-4">
          <span>缩放: {Math.round(zoom * 100)}%</span>
          <span>工具: {activeTool}</span>
          <span>画布: 800×600</span>
          {selectedObject && (
            <span>已选择: {selectedObject.type || '元素'}</span>
          )}
        </div>
      </div>
    </div>
  )
}