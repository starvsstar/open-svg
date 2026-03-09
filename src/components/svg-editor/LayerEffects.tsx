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
  Sparkles,
  Shadow,
  Sun,
  Circle,
  Square,
  Zap,
  Palette,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  RotateCcw,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Element as SVGElement } from '@svgdotjs/svg.js'

interface LayerEffect {
  id: string
  type: 'drop-shadow' | 'inner-shadow' | 'outer-glow' | 'inner-glow' | 'stroke' | 'gradient-overlay' | 'pattern-overlay' | 'color-overlay'
  name: string
  enabled: boolean
  blendMode: string
  opacity: number
  params: Record<string, any>
}

interface EffectPreset {
  name: string
  description: string
  effects: Omit<LayerEffect, 'id'>[]
}

const effectTypes = [
  {
    type: 'drop-shadow',
    name: '投影',
    icon: <Shadow className="h-4 w-4" />,
    description: '为元素添加外部阴影效果'
  },
  {
    type: 'inner-shadow',
    name: '内阴影',
    icon: <Circle className="h-4 w-4" />,
    description: '在元素内部添加阴影效果'
  },
  {
    type: 'outer-glow',
    name: '外发光',
    icon: <Sun className="h-4 w-4" />,
    description: '为元素添加外部发光效果'
  },
  {
    type: 'inner-glow',
    name: '内发光',
    icon: <Sparkles className="h-4 w-4" />,
    description: '在元素内部添加发光效果'
  },
  {
    type: 'stroke',
    name: '描边',
    icon: <Square className="h-4 w-4" />,
    description: '为元素添加描边效果'
  },
  {
    type: 'gradient-overlay',
    name: '渐变叠加',
    icon: <Palette className="h-4 w-4" />,
    description: '在元素上叠加渐变效果'
  },
  {
    type: 'color-overlay',
    name: '颜色叠加',
    icon: <Circle className="h-4 w-4" />,
    description: '在元素上叠加纯色效果'
  }
]

const blendModes = [
  'normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light',
  'color-dodge', 'color-burn', 'darken', 'lighten', 'difference', 'exclusion'
]

const effectPresets: EffectPreset[] = [
  {
    name: '经典投影',
    description: '标准的投影效果',
    effects: [{
      type: 'drop-shadow',
      name: '投影',
      enabled: true,
      blendMode: 'normal',
      opacity: 0.5,
      params: {
        offsetX: 2,
        offsetY: 2,
        blur: 4,
        color: '#000000'
      }
    }]
  },
  {
    name: '霓虹发光',
    description: '霓虹灯发光效果',
    effects: [{
      type: 'outer-glow',
      name: '外发光',
      enabled: true,
      blendMode: 'screen',
      opacity: 0.8,
      params: {
        blur: 8,
        spread: 2,
        color: '#00ffff'
      }
    }]
  },
  {
    name: '浮雕效果',
    description: '3D浮雕样式',
    effects: [
      {
        type: 'drop-shadow',
        name: '高光',
        enabled: true,
        blendMode: 'normal',
        opacity: 0.6,
        params: {
          offsetX: -1,
          offsetY: -1,
          blur: 1,
          color: '#ffffff'
        }
      },
      {
        type: 'drop-shadow',
        name: '阴影',
        enabled: true,
        blendMode: 'normal',
        opacity: 0.4,
        params: {
          offsetX: 1,
          offsetY: 1,
          blur: 1,
          color: '#000000'
        }
      }
    ]
  },
  {
    name: '玻璃效果',
    description: '透明玻璃质感',
    effects: [
      {
        type: 'inner-glow',
        name: '内发光',
        enabled: true,
        blendMode: 'soft-light',
        opacity: 0.3,
        params: {
          blur: 6,
          color: '#ffffff'
        }
      },
      {
        type: 'stroke',
        name: '边框',
        enabled: true,
        blendMode: 'normal',
        opacity: 0.2,
        params: {
          width: 1,
          color: '#ffffff',
          position: 'inside'
        }
      }
    ]
  },
  {
    name: '金属质感',
    description: '金属光泽效果',
    effects: [
      {
        type: 'gradient-overlay',
        name: '渐变叠加',
        enabled: true,
        blendMode: 'overlay',
        opacity: 0.7,
        params: {
          type: 'linear',
          angle: 90,
          stops: [
            { offset: 0, color: '#ffd700' },
            { offset: 0.5, color: '#ffed4e' },
            { offset: 1, color: '#ff8c00' }
          ]
        }
      },
      {
        type: 'stroke',
        name: '描边',
        enabled: true,
        blendMode: 'normal',
        opacity: 0.8,
        params: {
          width: 2,
          color: '#b8860b',
          position: 'outside'
        }
      }
    ]
  }
]

interface LayerEffectsProps {
  selectedElement: SVGElement | null
  onEffectChange: (effects: LayerEffect[]) => void
  className?: string
}

export function LayerEffects({
  selectedElement,
  onEffectChange,
  className
}: LayerEffectsProps) {
  const [effects, setEffects] = useState<LayerEffect[]>([])
  const [activeEffect, setActiveEffect] = useState<string | null>(null)
  const [showPresets, setShowPresets] = useState(false)

  // 生成唯一ID
  const generateId = () => Math.random().toString(36).substr(2, 9)

  // 添加效果
  const addEffect = (type: LayerEffect['type']) => {
    const effectType = effectTypes.find(et => et.type === type)
    if (!effectType) return

    const newEffect: LayerEffect = {
      id: generateId(),
      type,
      name: effectType.name,
      enabled: true,
      blendMode: 'normal',
      opacity: 1,
      params: getDefaultParams(type)
    }

    const updatedEffects = [...effects, newEffect]
    setEffects(updatedEffects)
    setActiveEffect(newEffect.id)
    onEffectChange(updatedEffects)
  }

  // 获取默认参数
  const getDefaultParams = (type: LayerEffect['type']) => {
    switch (type) {
      case 'drop-shadow':
      case 'inner-shadow':
        return {
          offsetX: 2,
          offsetY: 2,
          blur: 4,
          color: '#000000'
        }
      case 'outer-glow':
      case 'inner-glow':
        return {
          blur: 6,
          spread: 0,
          color: '#ffffff'
        }
      case 'stroke':
        return {
          width: 2,
          color: '#000000',
          position: 'outside'
        }
      case 'gradient-overlay':
        return {
          type: 'linear',
          angle: 90,
          stops: [
            { offset: 0, color: '#000000' },
            { offset: 1, color: '#ffffff' }
          ]
        }
      case 'color-overlay':
        return {
          color: '#000000'
        }
      default:
        return {}
    }
  }

  // 删除效果
  const removeEffect = (effectId: string) => {
    const updatedEffects = effects.filter(e => e.id !== effectId)
    setEffects(updatedEffects)
    if (activeEffect === effectId) {
      setActiveEffect(null)
    }
    onEffectChange(updatedEffects)
  }

  // 更新效果
  const updateEffect = (effectId: string, updates: Partial<LayerEffect>) => {
    const updatedEffects = effects.map(effect =>
      effect.id === effectId ? { ...effect, ...updates } : effect
    )
    setEffects(updatedEffects)
    onEffectChange(updatedEffects)
  }

  // 更新效果参数
  const updateEffectParam = (effectId: string, paramKey: string, value: any) => {
    const updatedEffects = effects.map(effect =>
      effect.id === effectId
        ? { ...effect, params: { ...effect.params, [paramKey]: value } }
        : effect
    )
    setEffects(updatedEffects)
    onEffectChange(updatedEffects)
  }

  // 复制效果
  const duplicateEffect = (effectId: string) => {
    const effect = effects.find(e => e.id === effectId)
    if (!effect) return

    const duplicatedEffect: LayerEffect = {
      ...effect,
      id: generateId(),
      name: `${effect.name} 副本`
    }

    const updatedEffects = [...effects, duplicatedEffect]
    setEffects(updatedEffects)
    onEffectChange(updatedEffects)
  }

  // 移动效果顺序
  const moveEffect = (effectId: string, direction: 'up' | 'down') => {
    const currentIndex = effects.findIndex(e => e.id === effectId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= effects.length) return

    const updatedEffects = [...effects]
    const [movedEffect] = updatedEffects.splice(currentIndex, 1)
    updatedEffects.splice(newIndex, 0, movedEffect)

    setEffects(updatedEffects)
    onEffectChange(updatedEffects)
  }

  // 应用预设
  const applyPreset = (preset: EffectPreset) => {
    const newEffects: LayerEffect[] = preset.effects.map(effect => ({
      ...effect,
      id: generateId()
    }))

    setEffects(newEffects)
    onEffectChange(newEffects)
    setShowPresets(false)
  }

  // 清除所有效果
  const clearAllEffects = () => {
    setEffects([])
    setActiveEffect(null)
    onEffectChange([])
  }

  // 渲染效果参数编辑器
  const renderEffectParams = (effect: LayerEffect) => {
    switch (effect.type) {
      case 'drop-shadow':
      case 'inner-shadow':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">X偏移</Label>
                <Input
                  type="number"
                  value={effect.params.offsetX || 0}
                  onChange={(e) => updateEffectParam(effect.id, 'offsetX', Number(e.target.value))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Y偏移</Label>
                <Input
                  type="number"
                  value={effect.params.offsetY || 0}
                  onChange={(e) => updateEffectParam(effect.id, 'offsetY', Number(e.target.value))}
                  className="h-8"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">模糊半径</Label>
              <Slider
                min={0}
                max={20}
                step={0.5}
                value={[effect.params.blur || 0]}
                onValueChange={(value) => updateEffectParam(effect.id, 'blur', value[0])}
              />
              <div className="text-xs text-muted-foreground text-center">
                {effect.params.blur || 0}px
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">阴影颜色</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={effect.params.color || '#000000'}
                  onChange={(e) => updateEffectParam(effect.id, 'color', e.target.value)}
                  className="w-16 h-8 p-1"
                />
                <Input
                  value={effect.params.color || '#000000'}
                  onChange={(e) => updateEffectParam(effect.id, 'color', e.target.value)}
                  className="flex-1 h-8"
                />
              </div>
            </div>
          </div>
        )

      case 'outer-glow':
      case 'inner-glow':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">模糊半径</Label>
              <Slider
                min={0}
                max={30}
                step={0.5}
                value={[effect.params.blur || 0]}
                onValueChange={(value) => updateEffectParam(effect.id, 'blur', value[0])}
              />
              <div className="text-xs text-muted-foreground text-center">
                {effect.params.blur || 0}px
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">扩展</Label>
              <Slider
                min={-10}
                max={10}
                step={0.5}
                value={[effect.params.spread || 0]}
                onValueChange={(value) => updateEffectParam(effect.id, 'spread', value[0])}
              />
              <div className="text-xs text-muted-foreground text-center">
                {effect.params.spread || 0}px
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">发光颜色</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={effect.params.color || '#ffffff'}
                  onChange={(e) => updateEffectParam(effect.id, 'color', e.target.value)}
                  className="w-16 h-8 p-1"
                />
                <Input
                  value={effect.params.color || '#ffffff'}
                  onChange={(e) => updateEffectParam(effect.id, 'color', e.target.value)}
                  className="flex-1 h-8"
                />
              </div>
            </div>
          </div>
        )

      case 'stroke':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">描边宽度</Label>
              <Slider
                min={0}
                max={20}
                step={0.5}
                value={[effect.params.width || 1]}
                onValueChange={(value) => updateEffectParam(effect.id, 'width', value[0])}
              />
              <div className="text-xs text-muted-foreground text-center">
                {effect.params.width || 1}px
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">描边颜色</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={effect.params.color || '#000000'}
                  onChange={(e) => updateEffectParam(effect.id, 'color', e.target.value)}
                  className="w-16 h-8 p-1"
                />
                <Input
                  value={effect.params.color || '#000000'}
                  onChange={(e) => updateEffectParam(effect.id, 'color', e.target.value)}
                  className="flex-1 h-8"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">描边位置</Label>
              <Select 
                value={effect.params.position || 'outside'} 
                onValueChange={(value) => updateEffectParam(effect.id, 'position', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outside">外部</SelectItem>
                  <SelectItem value="inside">内部</SelectItem>
                  <SelectItem value="center">居中</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'color-overlay':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">叠加颜色</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={effect.params.color || '#000000'}
                  onChange={(e) => updateEffectParam(effect.id, 'color', e.target.value)}
                  className="w-16 h-8 p-1"
                />
                <Input
                  value={effect.params.color || '#000000'}
                  onChange={(e) => updateEffectParam(effect.id, 'color', e.target.value)}
                  className="flex-1 h-8"
                />
              </div>
            </div>
          </div>
        )

      default:
        return <div className="text-xs text-muted-foreground">暂无可配置参数</div>
    }
  }

  if (!selectedElement) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">请选择一个元素来添加图层效果</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 效果预设 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              图层效果
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPresets(!showPresets)}
                className="h-6 w-6 p-0"
              >
                <Settings className="h-3 w-3" />
              </Button>
              {effects.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllEffects}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 预设效果 */}
          {showPresets && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">效果预设</Label>
              <div className="grid grid-cols-1 gap-2">
                {effectPresets.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset)}
                    className="h-auto p-2 text-left justify-start"
                  >
                    <div>
                      <div className="font-medium text-xs">{preset.name}</div>
                      <div className="text-xs text-muted-foreground">{preset.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
              <Separator />
            </div>
          )}
          
          {/* 添加效果 */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">添加效果</Label>
            <div className="grid grid-cols-2 gap-1">
              {effectTypes.map((effectType) => (
                <Button
                  key={effectType.type}
                  variant="outline"
                  size="sm"
                  onClick={() => addEffect(effectType.type)}
                  className="h-auto p-2 flex flex-col items-center gap-1"
                  title={effectType.description}
                >
                  {effectType.icon}
                  <span className="text-xs">{effectType.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 效果列表 */}
      {effects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">效果列表</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {effects.map((effect, index) => (
              <div key={effect.id} className="border rounded-lg p-3 space-y-3">
                {/* 效果头部 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={effect.enabled}
                      onCheckedChange={(checked) => updateEffect(effect.id, { enabled: checked })}
                    />
                    <span className="text-sm font-medium">{effect.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {effectTypes.find(et => et.type === effect.type)?.name}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveEffect(effect.id, 'up')}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveEffect(effect.id, 'down')}
                      disabled={index === effects.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateEffect(effect.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEffect(effect.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* 通用设置 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">混合模式</Label>
                    <Select 
                      value={effect.blendMode} 
                      onValueChange={(value) => updateEffect(effect.id, { blendMode: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {blendModes.map(mode => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">不透明度</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={[effect.opacity]}
                        onValueChange={(value) => updateEffect(effect.id, { opacity: value[0] })}
                        className="flex-1"
                      />
                      <span className="text-xs w-10">{Math.round(effect.opacity * 100)}%</span>
                    </div>
                  </div>
                </div>
                
                {/* 效果参数 */}
                {effect.enabled && (
                  <div className="pt-2 border-t">
                    {renderEffectParams(effect)}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}