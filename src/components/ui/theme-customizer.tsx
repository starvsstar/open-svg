'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Palette, 
  Monitor, 
  Sun, 
  Moon, 
  Laptop,
  Eye,
  RotateCcw,
  Download,
  Upload,
  Save
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'

interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  borderRadius: number
  fontSize: number
  spacing: number
  animations: boolean
  compactMode: boolean
  highContrast: boolean
}

interface ThemePreset {
  name: string
  description: string
  config: Partial<ThemeConfig>
}

const defaultTheme: ThemeConfig = {
  mode: 'system',
  primaryColor: '#3b82f6',
  accentColor: '#10b981',
  backgroundColor: '#ffffff',
  surfaceColor: '#f8fafc',
  textColor: '#1f2937',
  borderRadius: 6,
  fontSize: 14,
  spacing: 16,
  animations: true,
  compactMode: false,
  highContrast: false
}

const themePresets: ThemePreset[] = [
  {
    name: '默认主题',
    description: '经典的蓝色主题',
    config: {
      primaryColor: '#3b82f6',
      accentColor: '#10b981'
    }
  },
  {
    name: '暗夜模式',
    description: '深色护眼主题',
    config: {
      mode: 'dark',
      primaryColor: '#60a5fa',
      backgroundColor: '#111827',
      surfaceColor: '#1f2937',
      textColor: '#f9fafb'
    }
  },
  {
    name: '温暖橙色',
    description: '温暖的橙色调',
    config: {
      primaryColor: '#f97316',
      accentColor: '#eab308'
    }
  },
  {
    name: '清新绿色',
    description: '自然的绿色主题',
    config: {
      primaryColor: '#22c55e',
      accentColor: '#06b6d4'
    }
  },
  {
    name: '优雅紫色',
    description: '神秘的紫色调',
    config: {
      primaryColor: '#8b5cf6',
      accentColor: '#ec4899'
    }
  },
  {
    name: '高对比度',
    description: '适合视觉障碍用户',
    config: {
      primaryColor: '#000000',
      accentColor: '#ffffff',
      highContrast: true,
      borderRadius: 2
    }
  }
]

interface ThemeCustomizerProps {
  className?: string
}

export function ThemeCustomizer({ className }: ThemeCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(defaultTheme)
  const [previewMode, setPreviewMode] = useState(false)
  const { theme, setTheme } = useTheme()

  // 加载保存的主题配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('svg-editor-theme-config')
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        setThemeConfig({ ...defaultTheme, ...config })
      } catch (error) {
        console.error('Failed to load theme config:', error)
      }
    }
  }, [])

  // 应用主题配置
  const applyTheme = (config: ThemeConfig) => {
    const root = document.documentElement
    
    // 设置CSS变量
    root.style.setProperty('--primary', config.primaryColor)
    root.style.setProperty('--accent', config.accentColor)
    root.style.setProperty('--background', config.backgroundColor)
    root.style.setProperty('--surface', config.surfaceColor)
    root.style.setProperty('--text', config.textColor)
    root.style.setProperty('--border-radius', `${config.borderRadius}px`)
    root.style.setProperty('--font-size', `${config.fontSize}px`)
    root.style.setProperty('--spacing', `${config.spacing}px`)
    
    // 设置主题模式
    setTheme(config.mode)
    
    // 设置其他选项
    root.classList.toggle('compact-mode', config.compactMode)
    root.classList.toggle('high-contrast', config.highContrast)
    root.classList.toggle('no-animations', !config.animations)
  }

  // 保存主题配置
  const saveTheme = () => {
    localStorage.setItem('svg-editor-theme-config', JSON.stringify(themeConfig))
    applyTheme(themeConfig)
    setIsOpen(false)
  }

  // 重置主题
  const resetTheme = () => {
    setThemeConfig(defaultTheme)
    localStorage.removeItem('svg-editor-theme-config')
    applyTheme(defaultTheme)
  }

  // 应用预设主题
  const applyPreset = (preset: ThemePreset) => {
    const newConfig = { ...themeConfig, ...preset.config }
    setThemeConfig(newConfig)
    if (previewMode) {
      applyTheme(newConfig)
    }
  }

  // 导出主题
  const exportTheme = () => {
    const dataStr = JSON.stringify(themeConfig, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'svg-editor-theme.json'
    link.click()
    
    URL.revokeObjectURL(url)
  }

  // 导入主题
  const importTheme = () => {
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
            setThemeConfig({ ...defaultTheme, ...config })
          } catch (error) {
            alert('无法解析主题文件')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  // 更新配置
  const updateConfig = (key: keyof ThemeConfig, value: any) => {
    const newConfig = { ...themeConfig, [key]: value }
    setThemeConfig(newConfig)
    
    if (previewMode) {
      applyTheme(newConfig)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          <Palette className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            主题定制
          </DialogTitle>
          <DialogDescription>
            个性化您的SVG编辑器界面
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 预览模式开关 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={previewMode}
                onCheckedChange={setPreviewMode}
              />
              <Label>实时预览</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={importTheme}>
                <Upload className="h-4 w-4 mr-2" />
                导入
              </Button>
              <Button variant="outline" size="sm" onClick={exportTheme}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Button variant="outline" size="sm" onClick={resetTheme}>
                <RotateCcw className="h-4 w-4 mr-2" />
                重置
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="presets" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="presets">预设主题</TabsTrigger>
              <TabsTrigger value="colors">颜色</TabsTrigger>
              <TabsTrigger value="layout">布局</TabsTrigger>
              <TabsTrigger value="advanced">高级</TabsTrigger>
            </TabsList>
            
            {/* 预设主题 */}
            <TabsContent value="presets" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {themePresets.map((preset, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => applyPreset(preset)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{preset.name}</h3>
                        <div className="flex gap-1">
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: preset.config.primaryColor || defaultTheme.primaryColor }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: preset.config.accentColor || defaultTheme.accentColor }}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{preset.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {/* 颜色设置 */}
            <TabsContent value="colors" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>主色调</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={themeConfig.primaryColor}
                      onChange={(e) => updateConfig('primaryColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={themeConfig.primaryColor}
                      onChange={(e) => updateConfig('primaryColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>强调色</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={themeConfig.accentColor}
                      onChange={(e) => updateConfig('accentColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={themeConfig.accentColor}
                      onChange={(e) => updateConfig('accentColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>背景色</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={themeConfig.backgroundColor}
                      onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={themeConfig.backgroundColor}
                      onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>表面色</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={themeConfig.surfaceColor}
                      onChange={(e) => updateConfig('surfaceColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={themeConfig.surfaceColor}
                      onChange={(e) => updateConfig('surfaceColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* 布局设置 */}
            <TabsContent value="layout" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>圆角大小</Label>
                    <span className="text-sm text-muted-foreground">{themeConfig.borderRadius}px</span>
                  </div>
                  <Slider
                    min={0}
                    max={20}
                    step={1}
                    value={[themeConfig.borderRadius]}
                    onValueChange={(value) => updateConfig('borderRadius', value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>字体大小</Label>
                    <span className="text-sm text-muted-foreground">{themeConfig.fontSize}px</span>
                  </div>
                  <Slider
                    min={12}
                    max={18}
                    step={1}
                    value={[themeConfig.fontSize]}
                    onValueChange={(value) => updateConfig('fontSize', value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>间距大小</Label>
                    <span className="text-sm text-muted-foreground">{themeConfig.spacing}px</span>
                  </div>
                  <Slider
                    min={8}
                    max={24}
                    step={2}
                    value={[themeConfig.spacing]}
                    onValueChange={(value) => updateConfig('spacing', value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>主题模式</Label>
                  <Select 
                    value={themeConfig.mode} 
                    onValueChange={(value) => updateConfig('mode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          浅色模式
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          深色模式
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Laptop className="h-4 w-4" />
                          跟随系统
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            {/* 高级设置 */}
            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>紧凑模式</Label>
                    <p className="text-sm text-muted-foreground">减少界面间距，显示更多内容</p>
                  </div>
                  <Switch
                    checked={themeConfig.compactMode}
                    onCheckedChange={(checked) => updateConfig('compactMode', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>高对比度</Label>
                    <p className="text-sm text-muted-foreground">提高可访问性，适合视觉障碍用户</p>
                  </div>
                  <Switch
                    checked={themeConfig.highContrast}
                    onCheckedChange={(checked) => updateConfig('highContrast', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>动画效果</Label>
                    <p className="text-sm text-muted-foreground">启用界面过渡动画</p>
                  </div>
                  <Switch
                    checked={themeConfig.animations}
                    onCheckedChange={(checked) => updateConfig('animations', checked)}
                  />
                </div>
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
                <Button variant="outline" onClick={() => applyTheme(defaultTheme)}>
                  <Eye className="h-4 w-4 mr-2" />
                  预览默认
                </Button>
              )}
              <Button onClick={saveTheme}>
                <Save className="h-4 w-4 mr-2" />
                保存主题
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}