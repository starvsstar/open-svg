'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  MousePointer,
  Square,
  Circle,
  Lasso,
  Wand2,
  Target,
  Filter,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Move,
  RotateCw,
  Flip,
  Group,
  Ungroup,
  AlignCenter,
  Layers,
  Palette,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Element as SVGElement } from '@svgdotjs/svg.js'

interface SelectionCriteria {
  type?: string
  fill?: string
  stroke?: string
  opacity?: number
  size?: { min: number; max: number }
  position?: { x: number; y: number; radius: number }
  layer?: string
  visible?: boolean
  locked?: boolean
}

interface SelectionTool {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  mode: 'single' | 'multiple' | 'area' | 'smart'
}

interface BatchOperation {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'transform' | 'style' | 'layer' | 'utility'
}

const selectionTools: SelectionTool[] = [
  {
    id: 'pointer',
    name: '指针选择',
    description: '标准的点击选择工具',
    icon: <MousePointer className="h-4 w-4" />,
    mode: 'single'
  },
  {
    id: 'rectangle',
    name: '矩形选择',
    description: '拖拽矩形区域选择多个元素',
    icon: <Square className="h-4 w-4" />,
    mode: 'area'
  },
  {
    id: 'circle',
    name: '圆形选择',
    description: '拖拽圆形区域选择多个元素',
    icon: <Circle className="h-4 w-4" />,
    mode: 'area'
  },
  {
    id: 'lasso',
    name: '套索选择',
    description: '自由绘制选择区域',
    icon: <Lasso className="h-4 w-4" />,
    mode: 'area'
  },
  {
    id: 'magic',
    name: '魔术棒',
    description: '根据相似属性智能选择',
    icon: <Wand2 className="h-4 w-4" />,
    mode: 'smart'
  },
  {
    id: 'target',
    name: '精确选择',
    description: '基于条件的精确选择',
    icon: <Target className="h-4 w-4" />,
    mode: 'smart'
  }
]

const batchOperations: BatchOperation[] = [
  {
    id: 'copy',
    name: '复制',
    description: '复制选中的元素',
    icon: <Copy className="h-4 w-4" />,
    category: 'utility'
  },
  {
    id: 'delete',
    name: '删除',
    description: '删除选中的元素',
    icon: <Trash2 className="h-4 w-4" />,
    category: 'utility'
  },
  {
    id: 'group',
    name: '组合',
    description: '将选中元素组合为一个组',
    icon: <Group className="h-4 w-4" />,
    category: 'layer'
  },
  {
    id: 'ungroup',
    name: '取消组合',
    description: '解散选中的组',
    icon: <Ungroup className="h-4 w-4" />,
    category: 'layer'
  },
  {
    id: 'align',
    name: '对齐',
    description: '对齐选中的元素',
    icon: <AlignCenter className="h-4 w-4" />,
    category: 'transform'
  },
  {
    id: 'distribute',
    name: '分布',
    description: '均匀分布选中的元素',
    icon: <Move className="h-4 w-4" />,
    category: 'transform'
  },
  {
    id: 'rotate',
    name: '旋转',
    description: '旋转选中的元素',
    icon: <RotateCw className="h-4 w-4" />,
    category: 'transform'
  },
  {
    id: 'flip',
    name: '翻转',
    description: '翻转选中的元素',
    icon: <Flip className="h-4 w-4" />,
    category: 'transform'
  },
  {
    id: 'style',
    name: '样式',
    description: '批量修改样式属性',
    icon: <Palette className="h-4 w-4" />,
    category: 'style'
  },
  {
    id: 'layer',
    name: '图层',
    description: '批量修改图层属性',
    icon: <Layers className="h-4 w-4" />,
    category: 'layer'
  },
  {
    id: 'visibility',
    name: '可见性',
    description: '批量切换可见性',
    icon: <Eye className="h-4 w-4" />,
    category: 'layer'
  },
  {
    id: 'lock',
    name: '锁定',
    description: '批量锁定/解锁元素',
    icon: <Lock className="h-4 w-4" />,
    category: 'layer'
  }
]

interface AdvancedSelectionToolsProps {
  selectedElements: SVGElement[]
  onSelectionChange: (elements: SVGElement[]) => void
  onSelectionModeChange: (mode: string) => void
  onBatchOperation: (operation: string, params?: any) => void
  className?: string
}

export function AdvancedSelectionTools({
  selectedElements,
  onSelectionChange,
  onSelectionModeChange,
  onBatchOperation,
  className
}: AdvancedSelectionToolsProps) {
  const [activeSelectionTool, setActiveSelectionTool] = useState('pointer')
  const [selectionCriteria, setSelectionCriteria] = useState<SelectionCriteria>({})
  const [showCriteria, setShowCriteria] = useState(false)
  const [batchParams, setBatchParams] = useState<any>({})
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // 更新选择工具
  const handleSelectionToolChange = (toolId: string) => {
    setActiveSelectionTool(toolId)
    onSelectionModeChange(toolId)
    
    // 如果是智能选择工具，显示条件设置
    const tool = selectionTools.find(t => t.id === toolId)
    setShowCriteria(tool?.mode === 'smart')
  }

  // 执行批量操作
  const handleBatchOperation = (operationId: string) => {
    if (selectedElements.length === 0) {
      alert('请先选择要操作的元素')
      return
    }

    switch (operationId) {
      case 'copy':
        onBatchOperation('copy')
        break
      case 'delete':
        if (confirm(`确定要删除 ${selectedElements.length} 个元素吗？`)) {
          onBatchOperation('delete')
        }
        break
      case 'group':
        onBatchOperation('group')
        break
      case 'ungroup':
        onBatchOperation('ungroup')
        break
      case 'align':
        onBatchOperation('align', batchParams.alignType || 'center')
        break
      case 'distribute':
        onBatchOperation('distribute', batchParams.distributeType || 'horizontal')
        break
      case 'rotate':
        onBatchOperation('rotate', batchParams.rotateAngle || 90)
        break
      case 'flip':
        onBatchOperation('flip', batchParams.flipDirection || 'horizontal')
        break
      case 'style':
        onBatchOperation('style', batchParams.styleChanges || {})
        break
      case 'layer':
        onBatchOperation('layer', batchParams.layerAction || 'bring-to-front')
        break
      case 'visibility':
        onBatchOperation('visibility', !batchParams.visible)
        break
      case 'lock':
        onBatchOperation('lock', !batchParams.locked)
        break
      default:
        console.warn('Unknown batch operation:', operationId)
    }
  }

  // 根据条件选择元素
  const selectByCriteria = () => {
    onBatchOperation('selectByCriteria', selectionCriteria)
  }

  // 过滤批量操作
  const filteredOperations = selectedCategory === 'all' 
    ? batchOperations 
    : batchOperations.filter(op => op.category === selectedCategory)

  return (
    <div className={cn('space-y-4', className)}>
      {/* 选择工具 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MousePointer className="h-4 w-4" />
            选择工具
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {selectionTools.map((tool) => (
              <Button
                key={tool.id}
                variant={activeSelectionTool === tool.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSelectionToolChange(tool.id)}
                className="h-auto p-2 flex flex-col items-center gap-1"
              >
                {tool.icon}
                <span className="text-xs">{tool.name}</span>
              </Button>
            ))}
          </div>
          
          {/* 智能选择条件 */}
          {showCriteria && (
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-xs font-medium">选择条件</Label>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">元素类型</Label>
                  <Select 
                    value={selectionCriteria.type || ''} 
                    onValueChange={(value) => setSelectionCriteria(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="全部" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">全部类型</SelectItem>
                      <SelectItem value="rect">矩形</SelectItem>
                      <SelectItem value="circle">圆形</SelectItem>
                      <SelectItem value="path">路径</SelectItem>
                      <SelectItem value="text">文本</SelectItem>
                      <SelectItem value="image">图像</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">填充颜色</Label>
                  <Input
                    type="color"
                    value={selectionCriteria.fill || '#000000'}
                    onChange={(e) => setSelectionCriteria(prev => ({ ...prev, fill: e.target.value }))}
                    className="h-8 w-full"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">不透明度范围</Label>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={[selectionCriteria.opacity || 1]}
                  onValueChange={(value) => setSelectionCriteria(prev => ({ ...prev, opacity: value[0] }))}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground text-center">
                  {Math.round((selectionCriteria.opacity || 1) * 100)}%
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={selectionCriteria.visible !== false}
                  onCheckedChange={(checked) => setSelectionCriteria(prev => ({ ...prev, visible: checked }))}
                />
                <Label className="text-xs">仅可见元素</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={selectionCriteria.locked !== true}
                  onCheckedChange={(checked) => setSelectionCriteria(prev => ({ ...prev, locked: !checked }))}
                />
                <Label className="text-xs">排除锁定元素</Label>
              </div>
              
              <Button size="sm" onClick={selectByCriteria} className="w-full">
                <Target className="h-3 w-3 mr-1" />
                按条件选择
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 选择信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            选择信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">已选择元素</span>
              <Badge variant="secondary">{selectedElements.length}</Badge>
            </div>
            
            {selectedElements.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">元素类型分布:</div>
                {Object.entries(
                  selectedElements.reduce((acc, el) => {
                    const type = el.type || 'unknown'
                    acc[type] = (acc[type] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <span className="capitalize">{type}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* 批量操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            批量操作
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 操作分类 */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部操作</SelectItem>
              <SelectItem value="transform">变换操作</SelectItem>
              <SelectItem value="style">样式操作</SelectItem>
              <SelectItem value="layer">图层操作</SelectItem>
              <SelectItem value="utility">实用工具</SelectItem>
            </SelectContent>
          </Select>
          
          {/* 操作按钮 */}
          <div className="grid grid-cols-2 gap-2">
            {filteredOperations.map((operation) => (
              <Button
                key={operation.id}
                variant="outline"
                size="sm"
                onClick={() => handleBatchOperation(operation.id)}
                disabled={selectedElements.length === 0}
                className="h-auto p-2 flex flex-col items-center gap-1"
                title={operation.description}
              >
                {operation.icon}
                <span className="text-xs">{operation.name}</span>
              </Button>
            ))}
          </div>
          
          {/* 操作参数 */}
          {selectedElements.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs font-medium">操作参数</Label>
              
              {/* 旋转角度 */}
              <div className="space-y-1">
                <Label className="text-xs">旋转角度</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    min={-180}
                    max={180}
                    step={15}
                    value={[batchParams.rotateAngle || 0]}
                    onValueChange={(value) => setBatchParams(prev => ({ ...prev, rotateAngle: value[0] }))}
                    className="flex-1"
                  />
                  <span className="text-xs w-12">{batchParams.rotateAngle || 0}°</span>
                </div>
              </div>
              
              {/* 对齐方式 */}
              <div className="space-y-1">
                <Label className="text-xs">对齐方式</Label>
                <Select 
                  value={batchParams.alignType || 'center'} 
                  onValueChange={(value) => setBatchParams(prev => ({ ...prev, alignType: value }))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">左对齐</SelectItem>
                    <SelectItem value="center">居中对齐</SelectItem>
                    <SelectItem value="right">右对齐</SelectItem>
                    <SelectItem value="top">顶部对齐</SelectItem>
                    <SelectItem value="middle">垂直居中</SelectItem>
                    <SelectItem value="bottom">底部对齐</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* 分布方式 */}
              <div className="space-y-1">
                <Label className="text-xs">分布方式</Label>
                <Select 
                  value={batchParams.distributeType || 'horizontal'} 
                  onValueChange={(value) => setBatchParams(prev => ({ ...prev, distributeType: value }))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">水平分布</SelectItem>
                    <SelectItem value="vertical">垂直分布</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}