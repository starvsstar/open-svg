'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Palette, 
  Plus, 
  Minus, 
  RotateCcw,
  Copy,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/store/editor'

interface GradientStop {
  id: string
  offset: number // 0-100
  color: string
  opacity: number // 0-1
}

interface LinearGradient {
  id: string
  type: 'linear'
  x1: number
  y1: number
  x2: number
  y2: number
  stops: GradientStop[]
  units: 'userSpaceOnUse' | 'objectBoundingBox'
}

interface RadialGradient {
  id: string
  type: 'radial'
  cx: number
  cy: number
  r: number
  fx?: number
  fy?: number
  stops: GradientStop[]
  units: 'userSpaceOnUse' | 'objectBoundingBox'
}

type Gradient = LinearGradient | RadialGradient

interface GradientEditorProps {
  onGradientChange?: (gradient: Gradient) => void
  initialGradient?: Gradient
  className?: string
}

const defaultLinearGradient: LinearGradient = {
  id: 'gradient-1',
  type: 'linear',
  x1: 0,
  y1: 0,
  x2: 100,
  y2: 0,
  units: 'objectBoundingBox',
  stops: [
    { id: 'stop-1', offset: 0, color: '#3b82f6', opacity: 1 },
    { id: 'stop-2', offset: 100, color: '#8b5cf6', opacity: 1 }
  ]
}

const defaultRadialGradient: RadialGradient = {
  id: 'gradient-2',
  type: 'radial',
  cx: 50,
  cy: 50,
  r: 50,
  units: 'objectBoundingBox',
  stops: [
    { id: 'stop-1', offset: 0, color: '#f59e0b', opacity: 1 },
    { id: 'stop-2', offset: 100, color: '#ef4444', opacity: 1 }
  ]
}

export function GradientEditor({ onGradientChange, initialGradient, className }: GradientEditorProps) {
  const [gradient, setGradient] = useState<Gradient>(initialGradient || defaultLinearGradient)
  const [selectedStop, setSelectedStop] = useState<string | null>(null)
  const [previewEnabled, setPreviewEnabled] = useState(true)
  const gradientBarRef = useRef<HTMLDivElement>(null)
  const { selectedObject } = useEditorStore()

  // 当渐变变化时通知父组件
  useEffect(() => {
    onGradientChange?.(gradient)
  }, [gradient, onGradientChange])

  // 生成SVG渐变定义
  const generateSVGGradient = (grad: Gradient): string => {
    const stopsStr = grad.stops
      .sort((a, b) => a.offset - b.offset)
      .map(stop => `<stop offset="${stop.offset}%" stop-color="${stop.color}" stop-opacity="${stop.opacity}" />`)
      .join('')

    if (grad.type === 'linear') {
      return `<linearGradient id="${grad.id}" x1="${grad.x1}%" y1="${grad.y1}%" x2="${grad.x2}%" y2="${grad.y2}%" gradientUnits="${grad.units}">${stopsStr}</linearGradient>`
    } else {
      const fx = grad.fx !== undefined ? ` fx="${grad.fx}%"` : ''
      const fy = grad.fy !== undefined ? ` fy="${grad.fy}%"` : ''
      return `<radialGradient id="${grad.id}" cx="${grad.cx}%" cy="${grad.cy}%" r="${grad.r}%"${fx}${fy} gradientUnits="${grad.units}">${stopsStr}</radialGradient>`
    }
  }

  // 生成CSS渐变字符串用于预览
  const generateCSSGradient = (grad: Gradient): string => {
    const stopsStr = grad.stops
      .sort((a, b) => a.offset - b.offset)
      .map(stop => `${stop.color} ${stop.offset}%`)
      .join(', ')

    if (grad.type === 'linear') {
      const angle = Math.atan2(grad.y2 - grad.y1, grad.x2 - grad.x1) * 180 / Math.PI
      return `linear-gradient(${angle}deg, ${stopsStr})`
    } else {
      return `radial-gradient(circle at ${grad.cx}% ${grad.cy}%, ${stopsStr})`
    }
  }

  // 添加颜色停止点
  const addColorStop = () => {
    const newOffset = gradient.stops.length > 0 
      ? Math.min(100, Math.max(...gradient.stops.map(s => s.offset)) + 20)
      : 50
    
    const newStop: GradientStop = {
      id: `stop-${Date.now()}`,
      offset: newOffset,
      color: '#000000',
      opacity: 1
    }
    
    setGradient(prev => ({
      ...prev,
      stops: [...prev.stops, newStop]
    }))
    setSelectedStop(newStop.id)
  }

  // 删除颜色停止点
  const removeColorStop = (stopId: string) => {
    if (gradient.stops.length <= 2) return // 至少保留两个停止点
    
    setGradient(prev => ({
      ...prev,
      stops: prev.stops.filter(stop => stop.id !== stopId)
    }))
    
    if (selectedStop === stopId) {
      setSelectedStop(null)
    }
  }

  // 更新颜色停止点
  const updateColorStop = (stopId: string, updates: Partial<GradientStop>) => {
    setGradient(prev => ({
      ...prev,
      stops: prev.stops.map(stop => 
        stop.id === stopId ? { ...stop, ...updates } : stop
      )
    }))
  }

  // 切换渐变类型
  const switchGradientType = (type: 'linear' | 'radial') => {
    if (type === gradient.type) return
    
    if (type === 'linear') {
      setGradient({
        ...defaultLinearGradient,
        id: gradient.id,
        stops: gradient.stops
      })
    } else {
      setGradient({
        ...defaultRadialGradient,
        id: gradient.id,
        stops: gradient.stops
      })
    }
  }

  // 处理渐变条点击
  const handleGradientBarClick = (event: React.MouseEvent) => {
    if (!gradientBarRef.current) return
    
    const rect = gradientBarRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    
    // 检查是否点击在现有停止点附近
    const clickedStop = gradient.stops.find(stop => 
      Math.abs(stop.offset - percentage) < 5
    )
    
    if (clickedStop) {
      setSelectedStop(clickedStop.id)
    } else {
      // 创建新的停止点
      const newStop: GradientStop = {
        id: `stop-${Date.now()}`,
        offset: Math.round(percentage),
        color: '#000000',
        opacity: 1
      }
      
      setGradient(prev => ({
        ...prev,
        stops: [...prev.stops, newStop]
      }))
      setSelectedStop(newStop.id)
    }
  }

  // 预设渐变
  const presetGradients = [
    {
      name: '蓝紫渐变',
      gradient: {
        ...defaultLinearGradient,
        stops: [
          { id: 'stop-1', offset: 0, color: '#3b82f6', opacity: 1 },
          { id: 'stop-2', offset: 100, color: '#8b5cf6', opacity: 1 }
        ]
      }
    },
    {
      name: '日落渐变',
      gradient: {
        ...defaultLinearGradient,
        stops: [
          { id: 'stop-1', offset: 0, color: '#f59e0b', opacity: 1 },
          { id: 'stop-2', offset: 50, color: '#ef4444', opacity: 1 },
          { id: 'stop-3', offset: 100, color: '#dc2626', opacity: 1 }
        ]
      }
    },
    {
      name: '海洋渐变',
      gradient: {
        ...defaultLinearGradient,
        stops: [
          { id: 'stop-1', offset: 0, color: '#06b6d4', opacity: 1 },
          { id: 'stop-2', offset: 100, color: '#0891b2', opacity: 1 }
        ]
      }
    },
    {
      name: '森林渐变',
      gradient: {
        ...defaultLinearGradient,
        stops: [
          { id: 'stop-1', offset: 0, color: '#10b981', opacity: 1 },
          { id: 'stop-2', offset: 100, color: '#059669', opacity: 1 }
        ]
      }
    }
  ]

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          渐变编辑器
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewEnabled(!previewEnabled)}
            className="ml-auto"
          >
            {previewEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 渐变类型选择 */}
        <Tabs value={gradient.type} onValueChange={(value) => switchGradientType(value as 'linear' | 'radial')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="linear">线性渐变</TabsTrigger>
            <TabsTrigger value="radial">径向渐变</TabsTrigger>
          </TabsList>
          
          <TabsContent value="linear" className="space-y-4">
            {/* 线性渐变参数 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">起点 X (%)</Label>
                <Input
                  type="number"
                  value={gradient.type === 'linear' ? gradient.x1 : 0}
                  onChange={(e) => {
                    if (gradient.type === 'linear') {
                      setGradient(prev => ({ ...prev, x1: Number(e.target.value) }))
                    }
                  }}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">起点 Y (%)</Label>
                <Input
                  type="number"
                  value={gradient.type === 'linear' ? gradient.y1 : 0}
                  onChange={(e) => {
                    if (gradient.type === 'linear') {
                      setGradient(prev => ({ ...prev, y1: Number(e.target.value) }))
                    }
                  }}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">终点 X (%)</Label>
                <Input
                  type="number"
                  value={gradient.type === 'linear' ? gradient.x2 : 100}
                  onChange={(e) => {
                    if (gradient.type === 'linear') {
                      setGradient(prev => ({ ...prev, x2: Number(e.target.value) }))
                    }
                  }}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">终点 Y (%)</Label>
                <Input
                  type="number"
                  value={gradient.type === 'linear' ? gradient.y2 : 0}
                  onChange={(e) => {
                    if (gradient.type === 'linear') {
                      setGradient(prev => ({ ...prev, y2: Number(e.target.value) }))
                    }
                  }}
                  className="h-8"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="radial" className="space-y-4">
            {/* 径向渐变参数 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">中心 X (%)</Label>
                <Input
                  type="number"
                  value={gradient.type === 'radial' ? gradient.cx : 50}
                  onChange={(e) => {
                    if (gradient.type === 'radial') {
                      setGradient(prev => ({ ...prev, cx: Number(e.target.value) }))
                    }
                  }}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">中心 Y (%)</Label>
                <Input
                  type="number"
                  value={gradient.type === 'radial' ? gradient.cy : 50}
                  onChange={(e) => {
                    if (gradient.type === 'radial') {
                      setGradient(prev => ({ ...prev, cy: Number(e.target.value) }))
                    }
                  }}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">半径 (%)</Label>
                <Input
                  type="number"
                  value={gradient.type === 'radial' ? gradient.r : 50}
                  onChange={(e) => {
                    if (gradient.type === 'radial') {
                      setGradient(prev => ({ ...prev, r: Number(e.target.value) }))
                    }
                  }}
                  className="h-8"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* 渐变预览 */}
        {previewEnabled && (
          <div className="space-y-2">
            <Label className="text-xs">预览</Label>
            <div 
              className="h-16 rounded-lg border"
              style={{ background: generateCSSGradient(gradient) }}
            />
          </div>
        )}

        {/* 颜色停止点编辑 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">颜色停止点</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={addColorStop}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 渐变条 */}
          <div className="relative">
            <div
              ref={gradientBarRef}
              className="h-8 rounded border cursor-pointer relative"
              style={{ background: generateCSSGradient(gradient) }}
              onClick={handleGradientBarClick}
            >
              {/* 停止点标记 */}
              {gradient.stops.map(stop => (
                <div
                  key={stop.id}
                  className={cn(
                    "absolute top-0 w-3 h-8 border-2 border-white rounded-sm cursor-pointer transform -translate-x-1/2",
                    selectedStop === stop.id ? "border-blue-500 shadow-lg" : "border-gray-400"
                  )}
                  style={{ 
                    left: `${stop.offset}%`,
                    backgroundColor: stop.color
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedStop(stop.id)
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* 选中停止点的属性编辑 */}
          {selectedStop && (() => {
            const stop = gradient.stops.find(s => s.id === selectedStop)
            if (!stop) return null
            
            return (
              <div className="space-y-3 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">停止点属性</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeColorStop(selectedStop)}
                    disabled={gradient.stops.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">位置 (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={stop.offset}
                      onChange={(e) => updateColorStop(selectedStop, { offset: Number(e.target.value) })}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">颜色</Label>
                    <Input
                      type="color"
                      value={stop.color}
                      onChange={(e) => updateColorStop(selectedStop, { color: e.target.value })}
                      className="h-8 p-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">透明度</Label>
                    <span className="text-xs text-muted-foreground">{Math.round(stop.opacity * 100)}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[stop.opacity]}
                    onValueChange={(value) => updateColorStop(selectedStop, { opacity: value[0] })}
                  />
                </div>
              </div>
            )
          })()}
        </div>

        {/* 预设渐变 */}
        <div className="space-y-3">
          <Label className="text-xs">预设渐变</Label>
          <div className="grid grid-cols-2 gap-2">
            {presetGradients.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-12 p-2 flex flex-col items-center gap-1"
                onClick={() => {
                  setGradient({
                    ...preset.gradient,
                    id: gradient.id
                  })
                  setSelectedStop(null)
                }}
              >
                <div 
                  className="w-full h-6 rounded"
                  style={{ background: generateCSSGradient(preset.gradient) }}
                />
                <span className="text-xs">{preset.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* SVG 代码 */}
        <div className="space-y-2">
          <Label className="text-xs">SVG 代码</Label>
          <div className="p-2 bg-muted rounded text-xs font-mono break-all">
            {generateSVGGradient(gradient)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}