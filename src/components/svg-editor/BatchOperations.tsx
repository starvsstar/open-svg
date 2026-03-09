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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Zap,
  Move,
  RotateCw,
  Flip,
  Scale,
  Palette,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Group,
  Ungroup,
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignTop,
  AlignBottom,
  DistributeHorizontal,
  DistributeVertical,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowLeftRight,
  Plus,
  Minus,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Settings,
  Play,
  Save
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Element as SVGElement } from '@svgdotjs/svg.js'

interface BatchOperation {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'transform' | 'style' | 'layer' | 'utility' | 'animation'
  requiresParams: boolean
  destructive?: boolean
}

interface OperationParams {
  // 变换参数
  translateX?: number
  translateY?: number
  scaleX?: number
  scaleY?: number
  rotation?: number
  skewX?: number
  skewY?: number
  
  // 样式参数
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
  
  // 对齐参数
  alignType?: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  distributeType?: 'horizontal' | 'vertical'
  spacing?: number
  
  // 图层参数
  layerAction?: 'bring-to-front' | 'send-to-back' | 'bring-forward' | 'send-backward'
  
  // 动画参数
  duration?: number
  easing?: string
  delay?: number
}

interface BatchTemplate {
  name: string
  description: string
  operations: Array<{
    operationId: string
    params: OperationParams
  }>
}

const batchOperations: BatchOperation[] = [
  // 变换操作
  {
    id: 'translate',
    name: '移动',
    description: '批量移动元素位置',
    icon: <Move className="h-4 w-4" />,
    category: 'transform',
    requiresParams: true
  },
  {
    id: 'scale',
    name: '缩放',
    description: '批量缩放元素大小',
    icon: <Scale className="h-4 w-4" />,
    category: 'transform',
    requiresParams: true
  },
  {
    id: 'rotate',
    name: '旋转',
    description: '批量旋转元素',
    icon: <RotateCw className="h-4 w-4" />,
    category: 'transform',
    requiresParams: true
  },
  {
    id: 'flip-horizontal',
    name: '水平翻转',
    description: '水平翻转选中元素',
    icon: <FlipHorizontal className="h-4 w-4" />,
    category: 'transform',
    requiresParams: false
  },
  {
    id: 'flip-vertical',
    name: '垂直翻转',
    description: '垂直翻转选中元素',
    icon: <FlipVertical className="h-4 w-4" />,
    category: 'transform',
    requiresParams: false
  },
  
  // 样式操作
  {
    id: 'change-fill',
    name: '填充色',
    description: '批量修改填充颜色',
    icon: <Palette className="h-4 w-4" />,
    category: 'style',
    requiresParams: true
  },
  {
    id: 'change-stroke',
    name: '描边',
    description: '批量修改描边样式',
    icon: <Palette className="h-4 w-4" />,
    category: 'style',
    requiresParams: true
  },
  {
    id: 'change-opacity',
    name: '透明度',
    description: '批量修改透明度',
    icon: <Eye className="h-4 w-4" />,
    category: 'style',
    requiresParams: true
  },
  
  // 对齐操作
  {
    id: 'align-left',
    name: '左对齐',
    description: '将元素左对齐',
    icon: <AlignLeft className="h-4 w-4" />,
    category: 'transform',
    requiresParams: false
  },
  {
    id: 'align-center',
    name: '居中对齐',
    description: '将元素居中对齐',
    icon: <AlignCenter className="h-4 w-4" />,
    category: 'transform',
    requiresParams: false
  },
  {
    id: 'align-right',
    name: '右对齐',
    description: '将元素右对齐',
    icon: <AlignRight className="h-4 w-4" />,
    category: 'transform',
    requiresParams: false
  },
  {
    id: 'distribute-horizontal',
    name: '水平分布',
    description: '水平均匀分布元素',
    icon: <ArrowLeftRight className="h-4 w-4" />,
    category: 'transform',
    requiresParams: true
  },
  {
    id: 'distribute-vertical',
    name: '垂直分布',
    description: '垂直均匀分布元素',
    icon: <ArrowUpDown className="h-4 w-4" />,
    category: 'transform',
    requiresParams: true
  },
  
  // 图层操作
  {
    id: 'group',
    name: '组合',
    description: '将选中元素组合',
    icon: <Group className="h-4 w-4" />,
    category: 'layer',
    requiresParams: false
  },
  {
    id: 'ungroup',
    name: '取消组合',
    description: '解散选中的组',
    icon: <Ungroup className="h-4 w-4" />,
    category: 'layer',
    requiresParams: false
  },
  {
    id: 'bring-to-front',
    name: '置于顶层',
    description: '将元素移到最前面',
    icon: <ArrowUp className="h-4 w-4" />,
    category: 'layer',
    requiresParams: false
  },
  {
    id: 'send-to-back',
    name: '置于底层',
    description: '将元素移到最后面',
    icon: <ArrowDown className="h-4 w-4" />,
    category: 'layer',
    requiresParams: false
  },
  {
    id: 'toggle-visibility',
    name: '切换可见性',
    description: '批量切换元素可见性',
    icon: <Eye className="h-4 w-4" />,
    category: 'layer',
    requiresParams: false
  },
  {
    id: 'toggle-lock',
    name: '切换锁定',
    description: '批量切换元素锁定状态',
    icon: <Lock className="h-4 w-4" />,
    category: 'layer',
    requiresParams: false
  },
  
  // 实用工具
  {
    id: 'duplicate',
    name: '复制',
    description: '复制选中的元素',
    icon: <Copy className="h-4 w-4" />,
    category: 'utility',
    requiresParams: false
  },
  {
    id: 'delete',
    name: '删除',
    description: '删除选中的元素',
    icon: <Trash2 className="h-4 w-4" />,
    category: 'utility',
    requiresParams: false,
    destructive: true
  }
]

const batchTemplates: BatchTemplate[] = [
  {
    name: '网格排列',
    description: '将元素排列成网格',
    operations: [
      {
        operationId: 'align-left',
        params: {}
      },
      {
        operationId: 'distribute-vertical',
        params: { spacing: 20 }
      }
    ]
  },
  {
    name: '卡片效果',
    description: '添加卡片样式效果',
    operations: [
      {
        operationId: 'change-stroke',
        params: { stroke: '#e5e7eb', strokeWidth: 1 }
      },
      {
        operationId: 'scale',
        params: { scaleX: 1.05, scaleY: 1.05 }
      }
    ]
  },
  {
    name: '淡入效果',
    description: '创建淡入动画效果',
    operations: [
      {
        operationId: 'change-opacity',
        params: { opacity: 0 }
      }
    ]
  }
]

interface BatchOperationsProps {
  selectedElements: SVGElement[]
  onBatchOperation: (operationId: string, params: OperationParams) => void
  onSelectionChange: (elements: SVGElement[]) => void
  className?: string
}

export function BatchOperations({
  selectedElements,
  onBatchOperation,
  onSelectionChange,
  className
}: BatchOperationsProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [operationParams, setOperationParams] = useState<OperationParams>({})
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isExecuting, setIsExecuting] = useState(false)

  // 重置参数
  const resetParams = () => {
    setOperationParams({})
  }

  // 执行批量操作
  const executeBatchOperation = async (operationId: string, params: OperationParams = {}) => {
    if (selectedElements.length === 0) {
      alert('请先选择要操作的元素')
      return
    }

    setIsExecuting(true)
    
    try {
      // 合并参数
      const finalParams = { ...operationParams, ...params }
      
      // 执行操作
      await onBatchOperation(operationId, finalParams)
      
      // 重置参数（可选）
      if (!showAdvanced) {
        resetParams()
      }
    } catch (error) {
      console.error('批量操作失败:', error)
      alert('操作执行失败，请重试')
    } finally {
      setIsExecuting(false)
    }
  }

  // 应用模板
  const applyTemplate = async (template: BatchTemplate) => {
    if (selectedElements.length === 0) {
      alert('请先选择要操作的元素')
      return
    }

    setIsExecuting(true)
    
    try {
      for (const operation of template.operations) {
        await onBatchOperation(operation.operationId, operation.params)
        // 添加小延迟以便用户看到操作过程
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error('模板应用失败:', error)
      alert('模板应用失败，请重试')
    } finally {
      setIsExecuting(false)
    }
  }

  // 过滤操作
  const filteredOperations = activeCategory === 'all' 
    ? batchOperations 
    : batchOperations.filter(op => op.category === activeCategory)

  // 更新参数
  const updateParam = (key: keyof OperationParams, value: any) => {
    setOperationParams(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 选择信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            批量操作
            {selectedElements.length > 0 && (
              <Badge variant="secondary">{selectedElements.length} 个元素</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedElements.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">请选择要操作的元素</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 快速模板 */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">快速模板</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="选择操作模板" />
                  </SelectTrigger>
                  <SelectContent>
                    {batchTemplates.map((template, index) => (
                      <SelectItem key={index} value={template.name}>
                        {template.name} - {template.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedTemplate && (
                  <Button 
                    size="sm" 
                    onClick={() => {
                      const template = batchTemplates.find(t => t.name === selectedTemplate)
                      if (template) applyTemplate(template)
                    }}
                    disabled={isExecuting}
                    className="w-full"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    应用模板
                  </Button>
                )}
              </div>
              
              <Separator />
              
              {/* 高级设置开关 */}
              <div className="flex items-center justify-between">
                <Label className="text-xs">高级设置</Label>
                <Switch
                  checked={showAdvanced}
                  onCheckedChange={setShowAdvanced}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedElements.length > 0 && (
        <>
          {/* 操作分类 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">操作分类</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="text-xs">全部</TabsTrigger>
                  <TabsTrigger value="transform" className="text-xs">变换</TabsTrigger>
                  <TabsTrigger value="style" className="text-xs">样式</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-3 mt-2">
                  <TabsTrigger value="layer" className="text-xs">图层</TabsTrigger>
                  <TabsTrigger value="utility" className="text-xs">工具</TabsTrigger>
                  <TabsTrigger value="animation" className="text-xs">动画</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* 操作按钮 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">可用操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {filteredOperations.map((operation) => (
                  operation.destructive ? (
                    <AlertDialog key={operation.id}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isExecuting}
                          className="h-auto p-2 flex flex-col items-center gap-1"
                        >
                          {operation.icon}
                          <span className="text-xs">{operation.name}</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认操作</AlertDialogTitle>
                          <AlertDialogDescription>
                            确定要{operation.description}吗？此操作无法撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => executeBatchOperation(operation.id)}
                          >
                            确认
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button
                      key={operation.id}
                      variant="outline"
                      size="sm"
                      onClick={() => executeBatchOperation(operation.id)}
                      disabled={isExecuting}
                      className="h-auto p-2 flex flex-col items-center gap-1"
                      title={operation.description}
                    >
                      {operation.icon}
                      <span className="text-xs">{operation.name}</span>
                    </Button>
                  )
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* 高级参数设置 */}
          {showAdvanced && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">操作参数</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetParams}
                    className="h-6 w-6 p-0"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="transform">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="transform" className="text-xs">变换</TabsTrigger>
                    <TabsTrigger value="style" className="text-xs">样式</TabsTrigger>
                    <TabsTrigger value="layout" className="text-xs">布局</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="transform" className="space-y-3">
                    {/* 移动参数 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">X偏移</Label>
                        <Input
                          type="number"
                          value={operationParams.translateX || 0}
                          onChange={(e) => updateParam('translateX', Number(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Y偏移</Label>
                        <Input
                          type="number"
                          value={operationParams.translateY || 0}
                          onChange={(e) => updateParam('translateY', Number(e.target.value))}
                          className="h-8"
                        />
                      </div>
                    </div>
                    
                    {/* 缩放参数 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">X缩放</Label>
                        <Slider
                          min={0.1}
                          max={3}
                          step={0.1}
                          value={[operationParams.scaleX || 1]}
                          onValueChange={(value) => updateParam('scaleX', value[0])}
                        />
                        <div className="text-xs text-muted-foreground text-center">
                          {(operationParams.scaleX || 1).toFixed(1)}x
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Y缩放</Label>
                        <Slider
                          min={0.1}
                          max={3}
                          step={0.1}
                          value={[operationParams.scaleY || 1]}
                          onValueChange={(value) => updateParam('scaleY', value[0])}
                        />
                        <div className="text-xs text-muted-foreground text-center">
                          {(operationParams.scaleY || 1).toFixed(1)}x
                        </div>
                      </div>
                    </div>
                    
                    {/* 旋转参数 */}
                    <div className="space-y-1">
                      <Label className="text-xs">旋转角度</Label>
                      <Slider
                        min={-180}
                        max={180}
                        step={15}
                        value={[operationParams.rotation || 0]}
                        onValueChange={(value) => updateParam('rotation', value[0])}
                      />
                      <div className="text-xs text-muted-foreground text-center">
                        {operationParams.rotation || 0}°
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="style" className="space-y-3">
                    {/* 填充颜色 */}
                    <div className="space-y-1">
                      <Label className="text-xs">填充颜色</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={operationParams.fill || '#000000'}
                          onChange={(e) => updateParam('fill', e.target.value)}
                          className="w-16 h-8 p-1"
                        />
                        <Input
                          value={operationParams.fill || '#000000'}
                          onChange={(e) => updateParam('fill', e.target.value)}
                          className="flex-1 h-8"
                        />
                      </div>
                    </div>
                    
                    {/* 描边设置 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">描边颜色</Label>
                        <Input
                          type="color"
                          value={operationParams.stroke || '#000000'}
                          onChange={(e) => updateParam('stroke', e.target.value)}
                          className="w-full h-8 p-1"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">描边宽度</Label>
                        <Input
                          type="number"
                          min={0}
                          value={operationParams.strokeWidth || 1}
                          onChange={(e) => updateParam('strokeWidth', Number(e.target.value))}
                          className="h-8"
                        />
                      </div>
                    </div>
                    
                    {/* 透明度 */}
                    <div className="space-y-1">
                      <Label className="text-xs">透明度</Label>
                      <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={[operationParams.opacity || 1]}
                        onValueChange={(value) => updateParam('opacity', value[0])}
                      />
                      <div className="text-xs text-muted-foreground text-center">
                        {Math.round((operationParams.opacity || 1) * 100)}%
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="layout" className="space-y-3">
                    {/* 对齐方式 */}
                    <div className="space-y-1">
                      <Label className="text-xs">对齐方式</Label>
                      <Select 
                        value={operationParams.alignType || ''} 
                        onValueChange={(value) => updateParam('alignType', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="选择对齐方式" />
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
                    
                    {/* 分布间距 */}
                    <div className="space-y-1">
                      <Label className="text-xs">分布间距</Label>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[operationParams.spacing || 20]}
                        onValueChange={(value) => updateParam('spacing', value[0])}
                      />
                      <div className="text-xs text-muted-foreground text-center">
                        {operationParams.spacing || 20}px
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}