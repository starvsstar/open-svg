'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { 
  Filter,
  Plus,
  Minus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Circle,
  Sun,
  Droplets
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/store/editor'
import { Element as SVGElement } from '@svgdotjs/svg.js'

interface FilterEffect {
  id: string
  type: 'blur' | 'drop-shadow' | 'glow' | 'emboss' | 'noise' | 'color-matrix' | 'displacement'
  enabled: boolean
  parameters: Record<string, any>
}

interface FilterPreset {
  name: string
  description: string
  effects: Omit<FilterEffect, 'id'>[] 
}

interface FilterEditorProps {
  selectedElement?: SVGElement
  onFilterChange?: (filterId: string, filterSVG: string) => void
  className?: string
}

const filterPresets: FilterPreset[] = [
  {
    name: '模糊',
    description: '简单的高斯模糊效果',
    effects: [{
      type: 'blur',
      enabled: true,
      parameters: { stdDeviation: 3 }
    }]
  },
  {
    name: '投影',
    description: '经典的投影效果',
    effects: [{
      type: 'drop-shadow',
      enabled: true,
      parameters: { dx: 4, dy: 4, blur: 6, color: '#00000080' }
    }]
  },
  {
    name: '发光',
    description: '外发光效果',
    effects: [{
      type: 'glow',
      enabled: true,
      parameters: { blur: 8, color: '#3b82f6', intensity: 1 }
    }]
  },
  {
    name: '浮雕',
    description: '3D浮雕效果',
    effects: [{
      type: 'emboss',
      enabled: true,
      parameters: { strength: 1, angle: 45 }
    }]
  },
  {
    name: '噪点',
    description: '添加噪点纹理',
    effects: [{
      type: 'noise',
      enabled: true,
      parameters: { scale: 50, opacity: 0.3 }
    }]
  },
  {
    name: '复古',
    description: '复古色调效果',
    effects: [{
      type: 'color-matrix',
      enabled: true,
      parameters: { 
        matrix: [0.8, 0.2, 0.2, 0, 0.1, 0.2, 0.8, 0.2, 0, 0.1, 0.2, 0.2, 0.8, 0, 0.1, 0, 0, 0, 1, 0]
      }
    }]
  }
]

export function FilterEditor({ selectedElement, onFilterChange, className }: FilterEditorProps) {
  const [effects, setEffects] = useState<FilterEffect[]>([])
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null)
  const [previewEnabled, setPreviewEnabled] = useState(true)
  const { svgInstance } = useEditorStore()

  // 生成滤镜ID
  const generateFilterId = () => `filter-${Date.now()}`

  // 生成SVG滤镜定义
  const generateFilterSVG = (filterEffects: FilterEffect[]): string => {
    const filterId = generateFilterId()
    const enabledEffects = filterEffects.filter(effect => effect.enabled)
    
    if (enabledEffects.length === 0) return ''

    let filterContent = ''
    let currentResult = 'SourceGraphic'
    
    enabledEffects.forEach((effect, index) => {
      const resultName = `effect${index}`
      
      switch (effect.type) {
        case 'blur':
          filterContent += `<feGaussianBlur in="${currentResult}" stdDeviation="${effect.parameters.stdDeviation}" result="${resultName}" />\n`
          break
          
        case 'drop-shadow':
          filterContent += `
            <feDropShadow in="${currentResult}" dx="${effect.parameters.dx}" dy="${effect.parameters.dy}" 
                         stdDeviation="${effect.parameters.blur}" flood-color="${effect.parameters.color}" 
                         result="${resultName}" />
          `
          break
          
        case 'glow':
          filterContent += `
            <feGaussianBlur in="${currentResult}" stdDeviation="${effect.parameters.blur}" result="blur${index}" />
            <feFlood flood-color="${effect.parameters.color}" flood-opacity="${effect.parameters.intensity}" result="flood${index}" />
            <feComposite in="flood${index}" in2="blur${index}" operator="in" result="glow${index}" />
            <feMerge result="${resultName}">
              <feMergeNode in="glow${index}" />
              <feMergeNode in="${currentResult}" />
            </feMerge>
          `
          break
          
        case 'emboss':
          const angle = (effect.parameters.angle * Math.PI) / 180
          const dx = Math.cos(angle) * effect.parameters.strength
          const dy = Math.sin(angle) * effect.parameters.strength
          filterContent += `
            <feConvolveMatrix in="${currentResult}" 
                             kernelMatrix="-2 -1 0 -1 1 1 0 1 2" 
                             divisor="1" bias="0.5" result="${resultName}" />
          `
          break
          
        case 'noise':
          filterContent += `
            <feTurbulence baseFrequency="${effect.parameters.scale / 1000}" numOctaves="1" 
                         type="fractalNoise" result="noise${index}" />
            <feBlend in="${currentResult}" in2="noise${index}" mode="multiply" 
                     result="${resultName}" opacity="${effect.parameters.opacity}" />
          `
          break
          
        case 'color-matrix':
          const matrix = effect.parameters.matrix.join(' ')
          filterContent += `<feColorMatrix in="${currentResult}" values="${matrix}" result="${resultName}" />\n`
          break
          
        case 'displacement':
          filterContent += `
            <feTurbulence baseFrequency="0.02" numOctaves="3" result="turbulence${index}" />
            <feDisplacementMap in="${currentResult}" in2="turbulence${index}" 
                              scale="${effect.parameters.scale}" result="${resultName}" />
          `
          break
      }
      
      currentResult = resultName
    })

    return `<filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">\n${filterContent}</filter>`
  }

  // 应用滤镜到元素
  const applyFilterToElement = () => {
    if (!selectedElement || !svgInstance) return
    
    const filterSVG = generateFilterSVG(effects)
    if (!filterSVG) {
      selectedElement.attr('filter', null)
      return
    }
    
    // 添加滤镜定义到SVG
    let defs = svgInstance.findOne('defs')
    if (!defs) {
      defs = svgInstance.defs()
    }
    
    // 移除旧的滤镜
    defs.find('filter').forEach(filter => {
      if (filter.id().startsWith('filter-')) {
        filter.remove()
      }
    })
    
    // 添加新滤镜
    const filterId = `filter-${Date.now()}`
    defs.node.innerHTML += filterSVG.replace(/filter-\d+/, filterId)
    
    // 应用滤镜到元素
    selectedElement.attr('filter', `url(#${filterId})`)
    
    onFilterChange?.(filterId, filterSVG)
  }

  // 当效果变化时应用滤镜
  useEffect(() => {
    if (previewEnabled) {
      applyFilterToElement()
    }
  }, [effects, previewEnabled])

  // 添加效果
  const addEffect = (type: FilterEffect['type']) => {
    const defaultParameters = getDefaultParameters(type)
    const newEffect: FilterEffect = {
      id: `effect-${Date.now()}`,
      type,
      enabled: true,
      parameters: defaultParameters
    }
    
    setEffects(prev => [...prev, newEffect])
    setSelectedEffect(newEffect.id)
  }

  // 获取默认参数
  const getDefaultParameters = (type: FilterEffect['type']): Record<string, any> => {
    switch (type) {
      case 'blur':
        return { stdDeviation: 3 }
      case 'drop-shadow':
        return { dx: 4, dy: 4, blur: 6, color: '#00000080' }
      case 'glow':
        return { blur: 8, color: '#3b82f6', intensity: 1 }
      case 'emboss':
        return { strength: 1, angle: 45 }
      case 'noise':
        return { scale: 50, opacity: 0.3 }
      case 'color-matrix':
        return { matrix: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0] }
      case 'displacement':
        return { scale: 10 }
      default:
        return {}
    }
  }

  // 删除效果
  const removeEffect = (effectId: string) => {
    setEffects(prev => prev.filter(effect => effect.id !== effectId))
    if (selectedEffect === effectId) {
      setSelectedEffect(null)
    }
  }

  // 更新效果
  const updateEffect = (effectId: string, updates: Partial<FilterEffect>) => {
    setEffects(prev => prev.map(effect => 
      effect.id === effectId ? { ...effect, ...updates } : effect
    ))
  }

  // 应用预设
  const applyPreset = (preset: FilterPreset) => {
    const newEffects = preset.effects.map((effect, index) => ({
      ...effect,
      id: `effect-${Date.now()}-${index}`
    }))
    
    setEffects(newEffects)
    setSelectedEffect(newEffects[0]?.id || null)
  }

  // 清除所有滤镜
  const clearAllFilters = () => {
    setEffects([])
    setSelectedEffect(null)
    if (selectedElement) {
      selectedElement.attr('filter', null)
    }
  }

  // 渲染效果参数编辑器
  const renderEffectEditor = (effect: FilterEffect) => {
    switch (effect.type) {
      case 'blur':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">模糊强度</Label>
                <span className="text-xs text-muted-foreground">{effect.parameters.stdDeviation}</span>
              </div>
              <Slider
                min={0}
                max={20}
                step={0.1}
                value={[effect.parameters.stdDeviation]}
                onValueChange={(value) => updateEffect(effect.id, {
                  parameters: { ...effect.parameters, stdDeviation: value[0] }
                })}
              />
            </div>
          </div>
        )
        
      case 'drop-shadow':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">X 偏移</Label>
                <Input
                  type="number"
                  value={effect.parameters.dx}
                  onChange={(e) => updateEffect(effect.id, {
                    parameters: { ...effect.parameters, dx: Number(e.target.value) }
                  })}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Y 偏移</Label>
                <Input
                  type="number"
                  value={effect.parameters.dy}
                  onChange={(e) => updateEffect(effect.id, {
                    parameters: { ...effect.parameters, dy: Number(e.target.value) }
                  })}
                  className="h-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">模糊半径</Label>
                <span className="text-xs text-muted-foreground">{effect.parameters.blur}</span>
              </div>
              <Slider
                min={0}
                max={20}
                step={0.1}
                value={[effect.parameters.blur]}
                onValueChange={(value) => updateEffect(effect.id, {
                  parameters: { ...effect.parameters, blur: value[0] }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">阴影颜色</Label>
              <Input
                type="color"
                value={effect.parameters.color.slice(0, 7)}
                onChange={(e) => updateEffect(effect.id, {
                  parameters: { ...effect.parameters, color: e.target.value + '80' }
                })}
                className="h-8"
              />
            </div>
          </div>
        )
        
      case 'glow':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">发光半径</Label>
                <span className="text-xs text-muted-foreground">{effect.parameters.blur}</span>
              </div>
              <Slider
                min={0}
                max={30}
                step={0.1}
                value={[effect.parameters.blur]}
                onValueChange={(value) => updateEffect(effect.id, {
                  parameters: { ...effect.parameters, blur: value[0] }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">发光颜色</Label>
              <Input
                type="color"
                value={effect.parameters.color}
                onChange={(e) => updateEffect(effect.id, {
                  parameters: { ...effect.parameters, color: e.target.value }
                })}
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">强度</Label>
                <span className="text-xs text-muted-foreground">{effect.parameters.intensity}</span>
              </div>
              <Slider
                min={0}
                max={2}
                step={0.1}
                value={[effect.parameters.intensity]}
                onValueChange={(value) => updateEffect(effect.id, {
                  parameters: { ...effect.parameters, intensity: value[0] }
                })}
              />
            </div>
          </div>
        )
        
      case 'emboss':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">强度</Label>
                <span className="text-xs text-muted-foreground">{effect.parameters.strength}</span>
              </div>
              <Slider
                min={0}
                max={3}
                step={0.1}
                value={[effect.parameters.strength]}
                onValueChange={(value) => updateEffect(effect.id, {
                  parameters: { ...effect.parameters, strength: value[0] }
                })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">角度</Label>
                <span className="text-xs text-muted-foreground">{effect.parameters.angle}°</span>
              </div>
              <Slider
                min={0}
                max={360}
                step={1}
                value={[effect.parameters.angle]}
                onValueChange={(value) => updateEffect(effect.id, {
                  parameters: { ...effect.parameters, angle: value[0] }
                })}
              />
            </div>
          </div>
        )
        
      case 'noise':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">噪点大小</Label>
                <span className="text-xs text-muted-foreground">{effect.parameters.scale}</span>
              </div>
              <Slider
                min={10}
                max={200}
                step={1}
                value={[effect.parameters.scale]}
                onValueChange={(value) => updateEffect(effect.id, {
                  parameters: { ...effect.parameters, scale: value[0] }
                })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">透明度</Label>
                <span className="text-xs text-muted-foreground">{Math.round(effect.parameters.opacity * 100)}%</span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[effect.parameters.opacity]}
                onValueChange={(value) => updateEffect(effect.id, {
                  parameters: { ...effect.parameters, opacity: value[0] }
                })}
              />
            </div>
          </div>
        )
        
      case 'displacement':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">扭曲强度</Label>
                <span className="text-xs text-muted-foreground">{effect.parameters.scale}</span>
              </div>
              <Slider
                min={0}
                max={50}
                step={1}
                value={[effect.parameters.scale]}
                onValueChange={(value) => updateEffect(effect.id, {
                  parameters: { ...effect.parameters, scale: value[0] }
                })}
              />
            </div>
          </div>
        )
        
      default:
        return <div className="text-xs text-muted-foreground">暂无可编辑参数</div>
    }
  }

  // 获取效果图标
  const getEffectIcon = (type: FilterEffect['type']) => {
    switch (type) {
      case 'blur': return <Circle className="h-4 w-4" />
      case 'drop-shadow': return <Sun className="h-4 w-4" />
      case 'glow': return <Sparkles className="h-4 w-4" />
      case 'noise': return <Droplets className="h-4 w-4" />
      default: return <Filter className="h-4 w-4" />
    }
  }

  // 获取效果名称
  const getEffectName = (type: FilterEffect['type']) => {
    const names = {
      'blur': '模糊',
      'drop-shadow': '投影',
      'glow': '发光',
      'emboss': '浮雕',
      'noise': '噪点',
      'color-matrix': '颜色矩阵',
      'displacement': '扭曲'
    }
    return names[type] || type
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          滤镜编辑器
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
        {/* 快速预设 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">快速预设</Label>
          <div className="grid grid-cols-2 gap-2">
            {filterPresets.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                className="text-xs h-auto p-2 flex flex-col items-start"
                disabled={!selectedElement}
              >
                <span className="font-medium">{preset.name}</span>
                <span className="text-muted-foreground text-xs">{preset.description}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* 添加效果 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">滤镜效果</Label>
            <div className="flex gap-1">
              <Select onValueChange={(value) => addEffect(value as FilterEffect['type'])}>
                <SelectTrigger className="h-8 w-auto">
                  <Plus className="h-4 w-4" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blur">模糊</SelectItem>
                  <SelectItem value="drop-shadow">投影</SelectItem>
                  <SelectItem value="glow">发光</SelectItem>
                  <SelectItem value="emboss">浮雕</SelectItem>
                  <SelectItem value="noise">噪点</SelectItem>
                  <SelectItem value="color-matrix">颜色矩阵</SelectItem>
                  <SelectItem value="displacement">扭曲</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                disabled={effects.length === 0}
              >
                清除
              </Button>
            </div>
          </div>
          
          {/* 效果列表 */}
          {effects.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              {selectedElement ? '点击添加按钮创建滤镜效果' : '请先选择一个元素'}
            </div>
          ) : (
            <div className="space-y-2">
              {effects.map((effect, index) => (
                <div
                  key={effect.id}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer",
                    selectedEffect === effect.id ? "border-primary bg-primary/5" : "border-border"
                  )}
                  onClick={() => setSelectedEffect(effect.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={effect.enabled}
                        onCheckedChange={(checked) => updateEffect(effect.id, { enabled: checked })}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {getEffectIcon(effect.type)}
                      <span className="text-sm font-medium">{getEffectName(effect.type)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          // 复制效果
                          const newEffect = {
                            ...effect,
                            id: `effect-${Date.now()}`,
                            parameters: { ...effect.parameters }
                          }
                          setEffects(prev => [...prev, newEffect])
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeEffect(effect.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    效果 #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 效果参数编辑 */}
        {selectedEffect && (() => {
          const effect = effects.find(e => e.id === selectedEffect)
          if (!effect) return null
          
          return (
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center gap-2">
                {getEffectIcon(effect.type)}
                <Label className="text-sm font-medium">{getEffectName(effect.type)} 参数</Label>
              </div>
              {renderEffectEditor(effect)}
            </div>
          )
        })()}

        {/* 滤镜信息 */}
        <div className="space-y-2">
          <Separator />
          <Label className="text-sm font-medium">滤镜信息</Label>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>效果数量: {effects.length}</div>
            <div>启用效果: {effects.filter(e => e.enabled).length}</div>
          </div>
        </div>

        {/* SVG 代码 */}
        {effects.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">SVG 滤镜代码</Label>
            <div className="p-2 bg-muted rounded text-xs font-mono break-all max-h-32 overflow-y-auto">
              {generateFilterSVG(effects) || '暂无滤镜代码'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}