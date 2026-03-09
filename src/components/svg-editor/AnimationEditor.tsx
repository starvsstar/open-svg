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
import { Switch } from '@/components/ui/switch'
import { 
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Plus,
  Minus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Zap,
  RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/store/editor'
import { Element as SVGElement } from '@svgdotjs/svg.js'

interface Keyframe {
  id: string
  time: number // 时间（秒）
  properties: {
    x?: number
    y?: number
    rotation?: number
    scaleX?: number
    scaleY?: number
    opacity?: number
    fill?: string
    stroke?: string
  }
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

interface AnimationTrack {
  id: string
  elementId: string
  elementName: string
  keyframes: Keyframe[]
  enabled: boolean
}

interface Animation {
  id: string
  name: string
  duration: number // 总时长（秒）
  loop: boolean
  autoplay: boolean
  tracks: AnimationTrack[]
}

interface AnimationEditorProps {
  selectedElement?: SVGElement
  onAnimationChange?: (animation: Animation) => void
  className?: string
}

const defaultAnimation: Animation = {
  id: 'animation-1',
  name: '新动画',
  duration: 3,
  loop: false,
  autoplay: false,
  tracks: []
}

const easingOptions = [
  { value: 'linear', label: '线性' },
  { value: 'ease', label: '缓动' },
  { value: 'ease-in', label: '缓入' },
  { value: 'ease-out', label: '缓出' },
  { value: 'ease-in-out', label: '缓入缓出' }
]

const animationPresets = [
  {
    name: '淡入',
    keyframes: [
      { time: 0, properties: { opacity: 0 } },
      { time: 1, properties: { opacity: 1 } }
    ]
  },
  {
    name: '滑入（左）',
    keyframes: [
      { time: 0, properties: { x: -100, opacity: 0 } },
      { time: 1, properties: { x: 0, opacity: 1 } }
    ]
  },
  {
    name: '缩放进入',
    keyframes: [
      { time: 0, properties: { scaleX: 0, scaleY: 0, opacity: 0 } },
      { time: 1, properties: { scaleX: 1, scaleY: 1, opacity: 1 } }
    ]
  },
  {
    name: '旋转',
    keyframes: [
      { time: 0, properties: { rotation: 0 } },
      { time: 2, properties: { rotation: 360 } }
    ]
  },
  {
    name: '弹跳',
    keyframes: [
      { time: 0, properties: { y: 0 } },
      { time: 0.5, properties: { y: -50 } },
      { time: 1, properties: { y: 0 } }
    ]
  }
]

export function AnimationEditor({ selectedElement, onAnimationChange, className }: AnimationEditorProps) {
  const [animation, setAnimation] = useState<Animation>(defaultAnimation)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)
  const [selectedKeyframe, setSelectedKeyframe] = useState<string | null>(null)
  const [timelineZoom, setTimelineZoom] = useState(1)
  const timelineRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const { svgInstance } = useEditorStore()

  // 当动画变化时通知父组件
  useEffect(() => {
    onAnimationChange?.(animation)
  }, [animation, onAnimationChange])

  // 播放动画
  const playAnimation = () => {
    if (isPlaying) return
    
    setIsPlaying(true)
    const startTime = Date.now() - currentTime * 1000
    
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      
      if (elapsed >= animation.duration) {
        if (animation.loop) {
          setCurrentTime(0)
          playAnimation()
        } else {
          setCurrentTime(animation.duration)
          setIsPlaying(false)
        }
        return
      }
      
      setCurrentTime(elapsed)
      applyAnimationAtTime(elapsed)
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }

  // 暂停动画
  const pauseAnimation = () => {
    setIsPlaying(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  // 停止动画
  const stopAnimation = () => {
    pauseAnimation()
    setCurrentTime(0)
    applyAnimationAtTime(0)
  }

  // 在指定时间应用动画
  const applyAnimationAtTime = (time: number) => {
    if (!svgInstance) return
    
    animation.tracks.forEach(track => {
      if (!track.enabled) return
      
      const element = svgInstance.findOne(`#${track.elementId}`) as SVGElement
      if (!element) return
      
      const sortedKeyframes = [...track.keyframes].sort((a, b) => a.time - b.time)
      
      // 找到当前时间的前后关键帧
      let prevKeyframe = sortedKeyframes[0]
      let nextKeyframe = sortedKeyframes[sortedKeyframes.length - 1]
      
      for (let i = 0; i < sortedKeyframes.length - 1; i++) {
        if (time >= sortedKeyframes[i].time && time <= sortedKeyframes[i + 1].time) {
          prevKeyframe = sortedKeyframes[i]
          nextKeyframe = sortedKeyframes[i + 1]
          break
        }
      }
      
      if (prevKeyframe === nextKeyframe) {
        // 只有一个关键帧或时间超出范围
        applyKeyframeToElement(element, prevKeyframe)
      } else {
        // 插值计算
        const progress = (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time)
        const easedProgress = applyEasing(progress, nextKeyframe.easing)
        const interpolatedKeyframe = interpolateKeyframes(prevKeyframe, nextKeyframe, easedProgress)
        applyKeyframeToElement(element, interpolatedKeyframe)
      }
    })
  }

  // 应用关键帧到元素
  const applyKeyframeToElement = (element: SVGElement, keyframe: Keyframe) => {
    const props = keyframe.properties
    
    if (props.x !== undefined || props.y !== undefined) {
      const currentBbox = element.bbox()
      element.move(
        props.x !== undefined ? props.x : currentBbox.x,
        props.y !== undefined ? props.y : currentBbox.y
      )
    }
    
    if (props.rotation !== undefined) {
      element.rotate(props.rotation)
    }
    
    if (props.scaleX !== undefined || props.scaleY !== undefined) {
      element.scale(
        props.scaleX !== undefined ? props.scaleX : 1,
        props.scaleY !== undefined ? props.scaleY : 1
      )
    }
    
    if (props.opacity !== undefined) {
      element.opacity(props.opacity)
    }
    
    if (props.fill !== undefined) {
      element.fill(props.fill)
    }
    
    if (props.stroke !== undefined) {
      element.stroke(props.stroke)
    }
  }

  // 插值计算
  const interpolateKeyframes = (prev: Keyframe, next: Keyframe, progress: number): Keyframe => {
    const interpolated: Keyframe = {
      id: 'interpolated',
      time: prev.time + (next.time - prev.time) * progress,
      properties: {},
      easing: next.easing
    }
    
    const interpolateValue = (prevVal?: number, nextVal?: number): number | undefined => {
      if (prevVal === undefined && nextVal === undefined) return undefined
      const p = prevVal || 0
      const n = nextVal || 0
      return p + (n - p) * progress
    }
    
    interpolated.properties = {
      x: interpolateValue(prev.properties.x, next.properties.x),
      y: interpolateValue(prev.properties.y, next.properties.y),
      rotation: interpolateValue(prev.properties.rotation, next.properties.rotation),
      scaleX: interpolateValue(prev.properties.scaleX, next.properties.scaleX),
      scaleY: interpolateValue(prev.properties.scaleY, next.properties.scaleY),
      opacity: interpolateValue(prev.properties.opacity, next.properties.opacity),
      fill: progress < 0.5 ? prev.properties.fill : next.properties.fill,
      stroke: progress < 0.5 ? prev.properties.stroke : next.properties.stroke
    }
    
    return interpolated
  }

  // 应用缓动函数
  const applyEasing = (t: number, easing: string): number => {
    switch (easing) {
      case 'ease-in':
        return t * t
      case 'ease-out':
        return 1 - (1 - t) * (1 - t)
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)
      case 'ease':
        return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)
      default:
        return t
    }
  }

  // 添加轨道
  const addTrack = () => {
    if (!selectedElement) return
    
    const newTrack: AnimationTrack = {
      id: `track-${Date.now()}`,
      elementId: selectedElement.id() || `element-${Date.now()}`,
      elementName: selectedElement.type || '元素',
      keyframes: [],
      enabled: true
    }
    
    setAnimation(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }))
    setSelectedTrack(newTrack.id)
  }

  // 删除轨道
  const removeTrack = (trackId: string) => {
    setAnimation(prev => ({
      ...prev,
      tracks: prev.tracks.filter(track => track.id !== trackId)
    }))
    
    if (selectedTrack === trackId) {
      setSelectedTrack(null)
    }
  }

  // 添加关键帧
  const addKeyframe = (trackId: string, time?: number) => {
    const track = animation.tracks.find(t => t.id === trackId)
    if (!track || !selectedElement) return
    
    const keyframeTime = time !== undefined ? time : currentTime
    const currentBbox = selectedElement.bbox()
    
    const newKeyframe: Keyframe = {
      id: `keyframe-${Date.now()}`,
      time: keyframeTime,
      properties: {
        x: currentBbox.x,
        y: currentBbox.y,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: selectedElement.opacity() || 1
      },
      easing: 'ease'
    }
    
    setAnimation(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => 
        t.id === trackId 
          ? { ...t, keyframes: [...t.keyframes, newKeyframe] }
          : t
      )
    }))
    
    setSelectedKeyframe(newKeyframe.id)
  }

  // 删除关键帧
  const removeKeyframe = (trackId: string, keyframeId: string) => {
    setAnimation(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId
          ? { ...track, keyframes: track.keyframes.filter(kf => kf.id !== keyframeId) }
          : track
      )
    }))
    
    if (selectedKeyframe === keyframeId) {
      setSelectedKeyframe(null)
    }
  }

  // 更新关键帧
  const updateKeyframe = (trackId: string, keyframeId: string, updates: Partial<Keyframe>) => {
    setAnimation(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId
          ? {
              ...track,
              keyframes: track.keyframes.map(kf => 
                kf.id === keyframeId ? { ...kf, ...updates } : kf
              )
            }
          : track
      )
    }))
  }

  // 应用预设动画
  const applyPreset = (preset: typeof animationPresets[0]) => {
    if (!selectedElement || !selectedTrack) return
    
    const keyframes = preset.keyframes.map((kf, index) => ({
      id: `keyframe-${Date.now()}-${index}`,
      time: kf.time,
      properties: kf.properties,
      easing: 'ease' as const
    }))
    
    setAnimation(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === selectedTrack
          ? { ...track, keyframes }
          : track
      )
    }))
  }

  // 生成SVG动画代码
  const generateSVGAnimation = (): string => {
    let animationCode = ''
    
    animation.tracks.forEach(track => {
      if (!track.enabled || track.keyframes.length === 0) return
      
      const sortedKeyframes = [...track.keyframes].sort((a, b) => a.time - b.time)
      
      // 为每个属性生成动画
      const properties = ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'opacity', 'fill', 'stroke'] as const
      
      properties.forEach(prop => {
        const values = sortedKeyframes
          .filter(kf => kf.properties[prop] !== undefined)
          .map(kf => kf.properties[prop])
        
        if (values.length < 2) return
        
        const times = sortedKeyframes
          .filter(kf => kf.properties[prop] !== undefined)
          .map(kf => kf.time / animation.duration)
        
        const attributeName = prop === 'scaleX' || prop === 'scaleY' ? 'transform' : prop
        
        animationCode += `<animate attributeName="${attributeName}" values="${values.join(';')}" keyTimes="${times.join(';')}" dur="${animation.duration}s" ${animation.loop ? 'repeatCount="indefinite"' : ''} />\n`
      })
    })
    
    return animationCode
  }

  const timelineWidth = animation.duration * 100 * timelineZoom
  const currentTimePosition = (currentTime / animation.duration) * timelineWidth

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          动画编辑器
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 动画控制 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={isPlaying ? pauseAnimation : playAnimation}
              disabled={animation.tracks.length === 0}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={stopAnimation}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentTime(0)
                applyAnimationAtTime(0)
              }}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentTime(animation.duration)
                applyAnimationAtTime(animation.duration)
              }}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 时间控制 */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>时间: {currentTime.toFixed(2)}s</span>
              <span>总时长: {animation.duration}s</span>
            </div>
            <Slider
              min={0}
              max={animation.duration}
              step={0.01}
              value={[currentTime]}
              onValueChange={(value) => {
                setCurrentTime(value[0])
                applyAnimationAtTime(value[0])
              }}
            />
          </div>
        </div>

        <Separator />

        {/* 动画设置 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">动画设置</Label>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">名称</Label>
              <Input
                value={animation.name}
                onChange={(e) => setAnimation(prev => ({ ...prev, name: e.target.value }))}
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">时长 (秒)</Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={animation.duration}
                onChange={(e) => setAnimation(prev => ({ ...prev, duration: Number(e.target.value) }))}
                className="h-8"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-xs">循环播放</Label>
            <Switch
              checked={animation.loop}
              onCheckedChange={(checked) => setAnimation(prev => ({ ...prev, loop: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-xs">自动播放</Label>
            <Switch
              checked={animation.autoplay}
              onCheckedChange={(checked) => setAnimation(prev => ({ ...prev, autoplay: checked }))}
            />
          </div>
        </div>

        <Separator />

        {/* 轨道管理 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">动画轨道</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addTrack}
              disabled={!selectedElement}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {animation.tracks.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              {selectedElement ? '点击添加按钮创建动画轨道' : '请先选择一个元素'}
            </div>
          ) : (
            <div className="space-y-2">
              {animation.tracks.map(track => (
                <div
                  key={track.id}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer",
                    selectedTrack === track.id ? "border-primary bg-primary/5" : "border-border"
                  )}
                  onClick={() => setSelectedTrack(track.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={track.enabled}
                        onCheckedChange={(checked) => {
                          setAnimation(prev => ({
                            ...prev,
                            tracks: prev.tracks.map(t => 
                              t.id === track.id ? { ...t, enabled: checked } : t
                            )
                          }))
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm font-medium">{track.elementName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          addKeyframe(track.id)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeTrack(track.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* 关键帧显示 */}
                  <div className="mt-2 text-xs text-muted-foreground">
                    关键帧: {track.keyframes.length}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 时间轴 */}
        {selectedTrack && (() => {
          const track = animation.tracks.find(t => t.id === selectedTrack)
          if (!track) return null
          
          return (
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">时间轴</Label>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">缩放:</Label>
                  <Slider
                    min={0.5}
                    max={3}
                    step={0.1}
                    value={[timelineZoom]}
                    onValueChange={(value) => setTimelineZoom(value[0])}
                    className="w-20"
                  />
                </div>
              </div>
              
              <div className="relative border rounded-lg p-2 bg-muted/20 overflow-x-auto">
                <div 
                  ref={timelineRef}
                  className="relative h-16"
                  style={{ width: Math.max(timelineWidth, 300) }}
                >
                  {/* 时间刻度 */}
                  <div className="absolute top-0 left-0 right-0 h-4 border-b">
                    {Array.from({ length: Math.ceil(animation.duration) + 1 }, (_, i) => (
                      <div
                        key={i}
                        className="absolute text-xs text-muted-foreground"
                        style={{ left: (i / animation.duration) * timelineWidth }}
                      >
                        {i}s
                      </div>
                    ))}
                  </div>
                  
                  {/* 当前时间指示器 */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                    style={{ left: currentTimePosition }}
                  />
                  
                  {/* 关键帧 */}
                  <div className="absolute top-4 left-0 right-0 bottom-0">
                    {track.keyframes.map(keyframe => (
                      <div
                        key={keyframe.id}
                        className={cn(
                          "absolute w-3 h-8 rounded cursor-pointer border-2",
                          selectedKeyframe === keyframe.id 
                            ? "bg-primary border-primary" 
                            : "bg-blue-500 border-blue-600 hover:bg-blue-400"
                        )}
                        style={{ 
                          left: (keyframe.time / animation.duration) * timelineWidth - 6,
                          top: 8
                        }}
                        onClick={() => setSelectedKeyframe(keyframe.id)}
                        title={`时间: ${keyframe.time}s`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* 关键帧编辑 */}
        {selectedKeyframe && selectedTrack && (() => {
          const track = animation.tracks.find(t => t.id === selectedTrack)
          const keyframe = track?.keyframes.find(kf => kf.id === selectedKeyframe)
          if (!keyframe) return null
          
          return (
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">关键帧属性</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeKeyframe(selectedTrack, selectedKeyframe)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">时间 (秒)</Label>
                  <Input
                    type="number"
                    min="0"
                    max={animation.duration}
                    step="0.01"
                    value={keyframe.time}
                    onChange={(e) => updateKeyframe(selectedTrack, selectedKeyframe, { time: Number(e.target.value) })}
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">缓动</Label>
                  <Select
                    value={keyframe.easing}
                    onValueChange={(value) => updateKeyframe(selectedTrack, selectedKeyframe, { easing: value as any })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {easingOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* 属性编辑 */}
              <Tabs defaultValue="transform" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="transform">变换</TabsTrigger>
                  <TabsTrigger value="style">样式</TabsTrigger>
                  <TabsTrigger value="position">位置</TabsTrigger>
                </TabsList>
                
                <TabsContent value="transform" className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">旋转 (度)</Label>
                      <Input
                        type="number"
                        value={keyframe.properties.rotation || 0}
                        onChange={(e) => updateKeyframe(selectedTrack, selectedKeyframe, {
                          properties: { ...keyframe.properties, rotation: Number(e.target.value) }
                        })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">缩放 X</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={keyframe.properties.scaleX || 1}
                        onChange={(e) => updateKeyframe(selectedTrack, selectedKeyframe, {
                          properties: { ...keyframe.properties, scaleX: Number(e.target.value) }
                        })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">缩放 Y</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={keyframe.properties.scaleY || 1}
                        onChange={(e) => updateKeyframe(selectedTrack, selectedKeyframe, {
                          properties: { ...keyframe.properties, scaleY: Number(e.target.value) }
                        })}
                        className="h-8"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="style" className="space-y-3">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">透明度</Label>
                      <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={[keyframe.properties.opacity || 1]}
                        onValueChange={(value) => updateKeyframe(selectedTrack, selectedKeyframe, {
                          properties: { ...keyframe.properties, opacity: value[0] }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">填充颜色</Label>
                      <Input
                        type="color"
                        value={keyframe.properties.fill || '#000000'}
                        onChange={(e) => updateKeyframe(selectedTrack, selectedKeyframe, {
                          properties: { ...keyframe.properties, fill: e.target.value }
                        })}
                        className="h-8"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="position" className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">X 位置</Label>
                      <Input
                        type="number"
                        value={keyframe.properties.x || 0}
                        onChange={(e) => updateKeyframe(selectedTrack, selectedKeyframe, {
                          properties: { ...keyframe.properties, x: Number(e.target.value) }
                        })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Y 位置</Label>
                      <Input
                        type="number"
                        value={keyframe.properties.y || 0}
                        onChange={(e) => updateKeyframe(selectedTrack, selectedKeyframe, {
                          properties: { ...keyframe.properties, y: Number(e.target.value) }
                        })}
                        className="h-8"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )
        })()}

        {/* 预设动画 */}
        <div className="space-y-3">
          <Separator />
          <Label className="text-sm font-medium">预设动画</Label>
          <div className="grid grid-cols-2 gap-2">
            {animationPresets.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                disabled={!selectedTrack}
                className="text-xs"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* SVG 代码 */}
        <div className="space-y-2">
          <Separator />
          <Label className="text-sm font-medium">SVG 动画代码</Label>
          <div className="p-2 bg-muted rounded text-xs font-mono break-all max-h-32 overflow-y-auto">
            {generateSVGAnimation() || '暂无动画代码'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}