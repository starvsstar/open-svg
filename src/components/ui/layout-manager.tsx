'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Layout, 
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  Grid3X3,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  Download,
  Upload,
  Eye,
  EyeOff,
  Move,
  Lock,
  Unlock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PanelConfig {
  id: string
  name: string
  position: 'left' | 'right' | 'top' | 'bottom' | 'center'
  width?: number
  height?: number
  visible: boolean
  collapsible: boolean
  collapsed: boolean
  resizable: boolean
  movable: boolean
  locked: boolean
  order: number
}

interface LayoutPreset {
  name: string
  description: string
  panels: PanelConfig[]
}

interface WorkspaceConfig {
  name: string
  panels: PanelConfig[]
  canvasPosition: 'center' | 'left' | 'right'
  showGrid: boolean
  showRulers: boolean
  showGuides: boolean
  snapToGrid: boolean
  snapToGuides: boolean
  gridSize: number
  zoomLevel: number
}

const defaultPanels: PanelConfig[] = [
  {
    id: 'toolbar',
    name: '工具栏',
    position: 'left',
    width: 60,
    visible: true,
    collapsible: false,
    collapsed: false,
    resizable: false,
    movable: false,
    locked: true,
    order: 0
  },
  {
    id: 'properties',
    name: '属性面板',
    position: 'right',
    width: 280,
    visible: true,
    collapsible: true,
    collapsed: false,
    resizable: true,
    movable: true,
    locked: false,
    order: 0
  },
  {
    id: 'layers',
    name: '图层面板',
    position: 'right',
    width: 280,
    visible: true,
    collapsible: true,
    collapsed: false,
    resizable: true,
    movable: true,
    locked: false,
    order: 1
  },
  {
    id: 'history',
    name: '历史记录',
    position: 'right',
    width: 280,
    visible: false,
    collapsible: true,
    collapsed: false,
    resizable: true,
    movable: true,
    locked: false,
    order: 2
  },
  {
    id: 'assets',
    name: '资源库',
    position: 'bottom',
    height: 200,
    visible: false,
    collapsible: true,
    collapsed: false,
    resizable: true,
    movable: true,
    locked: false,
    order: 0
  },
  {
    id: 'timeline',
    name: '时间轴',
    position: 'bottom',
    height: 150,
    visible: false,
    collapsible: true,
    collapsed: false,
    resizable: true,
    movable: true,
    locked: false,
    order: 1
  }
]

const layoutPresets: LayoutPreset[] = [
  {
    name: '默认布局',
    description: '标准的编辑器布局',
    panels: defaultPanels
  },
  {
    name: '简洁模式',
    description: '最小化界面，专注创作',
    panels: defaultPanels.map(panel => ({
      ...panel,
      visible: ['toolbar'].includes(panel.id)
    }))
  },
  {
    name: '设计师模式',
    description: '适合UI设计的布局',
    panels: defaultPanels.map(panel => ({
      ...panel,
      visible: ['toolbar', 'properties', 'layers', 'assets'].includes(panel.id)
    }))
  },
  {
    name: '动画制作',
    description: '专为动画制作优化',
    panels: defaultPanels.map(panel => ({
      ...panel,
      visible: ['toolbar', 'properties', 'layers', 'timeline'].includes(panel.id)
    }))
  },
  {
    name: '全功能模式',
    description: '显示所有面板',
    panels: defaultPanels.map(panel => ({
      ...panel,
      visible: true
    }))
  }
]

interface LayoutManagerProps {
  className?: string
  onLayoutChange?: (config: WorkspaceConfig) => void
}

export function LayoutManager({ className, onLayoutChange }: LayoutManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig>({
    name: '默认工作区',
    panels: defaultPanels,
    canvasPosition: 'center',
    showGrid: true,
    showRulers: true,
    showGuides: true,
    snapToGrid: true,
    snapToGuides: true,
    gridSize: 20,
    zoomLevel: 100
  })
  const [previewMode, setPreviewMode] = useState(false)
  const [draggedPanel, setDraggedPanel] = useState<PanelConfig | null>(null)
  const layoutPreviewRef = useRef<HTMLDivElement>(null)

  // 加载保存的布局配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('svg-editor-layout-config')
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        setWorkspaceConfig({ ...workspaceConfig, ...config })
      } catch (error) {
        console.error('Failed to load layout config:', error)
      }
    }
  }, [])

  // 保存布局配置
  const saveLayout = () => {
    localStorage.setItem('svg-editor-layout-config', JSON.stringify(workspaceConfig))
    onLayoutChange?.(workspaceConfig)
    setIsOpen(false)
  }

  // 应用预设布局
  const applyPreset = (preset: LayoutPreset) => {
    const newConfig = {
      ...workspaceConfig,
      name: preset.name,
      panels: preset.panels
    }
    setWorkspaceConfig(newConfig)
    
    if (previewMode) {
      onLayoutChange?.(newConfig)
    }
  }

  // 重置布局
  const resetLayout = () => {
    const defaultConfig = {
      name: '默认工作区',
      panels: defaultPanels,
      canvasPosition: 'center' as const,
      showGrid: true,
      showRulers: true,
      showGuides: true,
      snapToGrid: true,
      snapToGuides: true,
      gridSize: 20,
      zoomLevel: 100
    }
    setWorkspaceConfig(defaultConfig)
    localStorage.removeItem('svg-editor-layout-config')
  }

  // 更新面板配置
  const updatePanel = (panelId: string, updates: Partial<PanelConfig>) => {
    const newConfig = {
      ...workspaceConfig,
      panels: workspaceConfig.panels.map(panel =>
        panel.id === panelId ? { ...panel, ...updates } : panel
      )
    }
    setWorkspaceConfig(newConfig)
    
    if (previewMode) {
      onLayoutChange?.(newConfig)
    }
  }

  // 更新工作区配置
  const updateWorkspace = (updates: Partial<WorkspaceConfig>) => {
    const newConfig = { ...workspaceConfig, ...updates }
    setWorkspaceConfig(newConfig)
    
    if (previewMode) {
      onLayoutChange?.(newConfig)
    }
  }

  // 导出布局
  const exportLayout = () => {
    const dataStr = JSON.stringify(workspaceConfig, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'svg-editor-layout.json'
    link.click()
    
    URL.revokeObjectURL(url)
  }

  // 导入布局
  const importLayout = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const config = JSON.parse(event.target?.result as string)
            setWorkspaceConfig({ ...workspaceConfig, ...config })
          } catch (error) {
            alert('无法解析布局配置文件')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  // 获取位置图标
  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'left': return <PanelLeft className="h-4 w-4" />
      case 'right': return <PanelRight className="h-4 w-4" />
      case 'top': return <PanelTop className="h-4 w-4" />
      case 'bottom': return <PanelBottom className="h-4 w-4" />
      default: return <Grid3X3 className="h-4 w-4" />
    }
  }

  // 渲染布局预览
  const renderLayoutPreview = () => {
    const leftPanels = workspaceConfig.panels.filter(p => p.position === 'left' && p.visible)
    const rightPanels = workspaceConfig.panels.filter(p => p.position === 'right' && p.visible)
    const topPanels = workspaceConfig.panels.filter(p => p.position === 'top' && p.visible)
    const bottomPanels = workspaceConfig.panels.filter(p => p.position === 'bottom' && p.visible)

    return (
      <div className="w-full h-48 border rounded-lg bg-muted/20 relative overflow-hidden">
        {/* 顶部面板 */}
        {topPanels.length > 0 && (
          <div className="absolute top-0 left-0 right-0 h-8 bg-blue-200 border-b flex items-center justify-center text-xs">
            {topPanels.map(p => p.name).join(', ')}
          </div>
        )}
        
        {/* 左侧面板 */}
        {leftPanels.length > 0 && (
          <div className={cn(
            "absolute left-0 bg-green-200 border-r flex flex-col items-center justify-center text-xs",
            topPanels.length > 0 ? "top-8" : "top-0",
            bottomPanels.length > 0 ? "bottom-8" : "bottom-0",
            "w-12"
          )}>
            <div className="transform -rotate-90 whitespace-nowrap">
              {leftPanels.map(p => p.name).join(', ')}
            </div>
          </div>
        )}
        
        {/* 右侧面板 */}
        {rightPanels.length > 0 && (
          <div className={cn(
            "absolute right-0 bg-orange-200 border-l flex flex-col items-center justify-center text-xs",
            topPanels.length > 0 ? "top-8" : "top-0",
            bottomPanels.length > 0 ? "bottom-8" : "bottom-0",
            "w-16"
          )}>
            <div className="transform -rotate-90 whitespace-nowrap">
              {rightPanels.map(p => p.name).join(', ')}
            </div>
          </div>
        )}
        
        {/* 底部面板 */}
        {bottomPanels.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-purple-200 border-t flex items-center justify-center text-xs">
            {bottomPanels.map(p => p.name).join(', ')}
          </div>
        )}
        
        {/* 画布区域 */}
        <div className={cn(
          "absolute bg-white border-2 border-dashed border-gray-400 flex items-center justify-center text-sm font-medium",
          leftPanels.length > 0 ? "left-12" : "left-2",
          rightPanels.length > 0 ? "right-16" : "right-2",
          topPanels.length > 0 ? "top-8" : "top-2",
          bottomPanels.length > 0 ? "bottom-8" : "bottom-2"
        )}>
          画布区域
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          <Layout className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            布局管理器
          </DialogTitle>
          <DialogDescription>
            自定义编辑器界面布局和面板配置
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 预览模式和操作栏 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={previewMode}
                onCheckedChange={setPreviewMode}
              />
              <Label>实时预览</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={importLayout}>
                <Upload className="h-4 w-4 mr-2" />
                导入
              </Button>
              <Button variant="outline" size="sm" onClick={exportLayout}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Button variant="outline" size="sm" onClick={resetLayout}>
                <RotateCcw className="h-4 w-4 mr-2" />
                重置
              </Button>
            </div>
          </div>
          
          {/* 布局预览 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">布局预览</CardTitle>
            </CardHeader>
            <CardContent>
              {renderLayoutPreview()}
            </CardContent>
          </Card>
          
          <Tabs defaultValue="presets" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="presets">预设布局</TabsTrigger>
              <TabsTrigger value="panels">面板设置</TabsTrigger>
              <TabsTrigger value="workspace">工作区</TabsTrigger>
              <TabsTrigger value="advanced">高级设置</TabsTrigger>
            </TabsList>
            
            {/* 预设布局 */}
            <TabsContent value="presets" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {layoutPresets.map((preset, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => applyPreset(preset)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{preset.name}</h3>
                        <Badge variant="outline">
                          {preset.panels.filter(p => p.visible).length} 面板
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{preset.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {/* 面板设置 */}
            <TabsContent value="panels" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {workspaceConfig.panels.map((panel) => (
                    <Card key={panel.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getPositionIcon(panel.position)}
                            <span className="font-medium">{panel.name}</span>
                            {panel.locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updatePanel(panel.id, { visible: !panel.visible })}
                            >
                              {panel.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                            
                            {!panel.locked && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updatePanel(panel.id, { locked: !panel.locked })}
                              >
                                <Unlock className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>位置</Label>
                            <Select 
                              value={panel.position} 
                              onValueChange={(value) => updatePanel(panel.id, { position: value as any })}
                              disabled={panel.locked}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">左侧</SelectItem>
                                <SelectItem value="right">右侧</SelectItem>
                                <SelectItem value="top">顶部</SelectItem>
                                <SelectItem value="bottom">底部</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {panel.resizable && (
                            <div className="space-y-2">
                              <Label>
                                {panel.position === 'left' || panel.position === 'right' ? '宽度' : '高度'}
                              </Label>
                              <div className="flex items-center gap-2">
                                <Slider
                                  min={100}
                                  max={500}
                                  step={10}
                                  value={[panel.width || panel.height || 200]}
                                  onValueChange={(value) => {
                                    const key = panel.position === 'left' || panel.position === 'right' ? 'width' : 'height'
                                    updatePanel(panel.id, { [key]: value[0] })
                                  }}
                                  disabled={panel.locked}
                                  className="flex-1"
                                />
                                <span className="text-sm text-muted-foreground w-12">
                                  {panel.width || panel.height || 200}px
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={panel.collapsible}
                              onCheckedChange={(checked) => updatePanel(panel.id, { collapsible: checked })}
                              disabled={panel.locked}
                            />
                            <Label className="text-sm">可折叠</Label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={panel.movable}
                              onCheckedChange={(checked) => updatePanel(panel.id, { movable: checked })}
                              disabled={panel.locked}
                            />
                            <Label className="text-sm">可移动</Label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={panel.resizable}
                              onCheckedChange={(checked) => updatePanel(panel.id, { resizable: checked })}
                              disabled={panel.locked}
                            />
                            <Label className="text-sm">可调整大小</Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            {/* 工作区设置 */}
            <TabsContent value="workspace" className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>画布位置</Label>
                    <Select 
                      value={workspaceConfig.canvasPosition} 
                      onValueChange={(value) => updateWorkspace({ canvasPosition: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">居中</SelectItem>
                        <SelectItem value="left">左对齐</SelectItem>
                        <SelectItem value="right">右对齐</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>网格大小</Label>
                      <span className="text-sm text-muted-foreground">{workspaceConfig.gridSize}px</span>
                    </div>
                    <Slider
                      min={10}
                      max={50}
                      step={5}
                      value={[workspaceConfig.gridSize]}
                      onValueChange={(value) => updateWorkspace({ gridSize: value[0] })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>缩放级别</Label>
                      <span className="text-sm text-muted-foreground">{workspaceConfig.zoomLevel}%</span>
                    </div>
                    <Slider
                      min={25}
                      max={400}
                      step={25}
                      value={[workspaceConfig.zoomLevel]}
                      onValueChange={(value) => updateWorkspace({ zoomLevel: value[0] })}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>显示网格</Label>
                    <Switch
                      checked={workspaceConfig.showGrid}
                      onCheckedChange={(checked) => updateWorkspace({ showGrid: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>显示标尺</Label>
                    <Switch
                      checked={workspaceConfig.showRulers}
                      onCheckedChange={(checked) => updateWorkspace({ showRulers: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>显示参考线</Label>
                    <Switch
                      checked={workspaceConfig.showGuides}
                      onCheckedChange={(checked) => updateWorkspace({ showGuides: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>吸附到网格</Label>
                    <Switch
                      checked={workspaceConfig.snapToGrid}
                      onCheckedChange={(checked) => updateWorkspace({ snapToGrid: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>吸附到参考线</Label>
                    <Switch
                      checked={workspaceConfig.snapToGuides}
                      onCheckedChange={(checked) => updateWorkspace({ snapToGuides: checked })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* 高级设置 */}
            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">面板行为</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      配置面板的默认行为和交互方式
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label>自动隐藏面板</Label>
                        <Switch />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>面板动画</Label>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>记住面板状态</Label>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>双击标题栏折叠</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">性能优化</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      优化大型项目的界面性能
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label>虚拟滚动</Label>
                        <Switch />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>延迟渲染</Label>
                        <Switch />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>硬件加速</Label>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>减少动画</Label>
                        <Switch />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              取消
            </Button>
            
            <div className="flex gap-2">
              {previewMode && (
                <Button variant="outline" onClick={resetLayout}>
                  <Eye className="h-4 w-4 mr-2" />
                  预览默认
                </Button>
              )}
              <Button onClick={saveLayout}>
                <Save className="h-4 w-4 mr-2" />
                保存布局
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}