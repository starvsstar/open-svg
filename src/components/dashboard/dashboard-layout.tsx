"use client"

import React, { useState, useCallback } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, GripVertical, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

// 组件类型定义
export interface DashboardWidget {
  id: string
  title: string
  component: React.ComponentType<any>
  props?: any
  defaultSize: { w: number; h: number }
  minSize?: { w: number; h: number }
  maxSize?: { w: number; h: number }
  category: 'analytics' | 'charts' | 'activity' | 'system'
}

// 布局配置
export interface DashboardLayoutConfig {
  layouts: { [key: string]: Layout[] }
  widgets: DashboardWidget[]
  breakpoints: { [key: string]: number }
  cols: { [key: string]: number }
}

// 默认断点配置
const defaultBreakpoints = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0
}

const defaultCols = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2
}

interface DashboardLayoutProps {
  widgets: DashboardWidget[]
  initialLayouts?: { [key: string]: Layout[] }
  onLayoutChange?: (layouts: { [key: string]: Layout[] }) => void
  editable?: boolean
  className?: string
}

export function DashboardLayout({
  widgets,
  initialLayouts = {},
  onLayoutChange,
  editable = false,
  className
}: DashboardLayoutProps) {
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>(initialLayouts)
  const [isEditing, setIsEditing] = useState(false)
  const [activeWidgets, setActiveWidgets] = useState<string[]>(
    widgets.map(w => w.id)
  )

  // 生成默认布局
  const generateDefaultLayout = useCallback((breakpoint: string) => {
    const cols = defaultCols[breakpoint] || 12
    let x = 0
    let y = 0

    return widgets.map((widget, index) => {
      const layout: Layout = {
        i: widget.id,
        x: x,
        y: y,
        w: Math.min(widget.defaultSize.w, cols),
        h: widget.defaultSize.h,
        minW: widget.minSize?.w || 1,
        minH: widget.minSize?.h || 1,
        maxW: widget.maxSize?.w || cols,
        maxH: widget.maxSize?.h || 20
      }

      x += layout.w
      if (x >= cols) {
        x = 0
        y += layout.h
      }

      return layout
    })
  }, [widgets])

  // 处理布局变化
  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    setLayouts(allLayouts)
    onLayoutChange?.(allLayouts)
  }, [onLayoutChange])

  // 添加组件
  const addWidget = useCallback((widget: DashboardWidget) => {
    if (!activeWidgets.includes(widget.id)) {
      setActiveWidgets(prev => [...prev, widget.id])
    }
  }, [activeWidgets])

  // 移除组件
  const removeWidget = useCallback((widgetId: string) => {
    setActiveWidgets(prev => prev.filter(id => id !== widgetId))
  }, [])

  // 重置布局
  const resetLayout = useCallback(() => {
    const newLayouts: { [key: string]: Layout[] } = {}
    Object.keys(defaultBreakpoints).forEach(breakpoint => {
      newLayouts[breakpoint] = generateDefaultLayout(breakpoint)
    })
    setLayouts(newLayouts)
    onLayoutChange?.(newLayouts)
  }, [generateDefaultLayout, onLayoutChange])

  // 获取当前活跃的组件
  const activeWidgetComponents = widgets.filter(widget => 
    activeWidgets.includes(widget.id)
  )

  return (
    <div className={cn('dashboard-layout', className)}>
      {/* 工具栏 */}
      {editable && (
        <div className="flex items-center justify-between mb-6 p-4 bg-background border rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {isEditing ? '完成编辑' : '编辑布局'}
            </Button>
            
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetLayout}
              >
                重置布局
              </Button>
            )}
          </div>

          {isEditing && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                拖拽组件来重新排列，调整大小来改变尺寸
              </span>
            </div>
          )}
        </div>
      )}

      {/* 组件选择器 */}
      {isEditing && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">可用组件</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {widgets.map(widget => (
              <Button
                key={widget.id}
                variant={activeWidgets.includes(widget.id) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (activeWidgets.includes(widget.id)) {
                    removeWidget(widget.id)
                  } else {
                    addWidget(widget)
                  }
                }}
                className="justify-start"
              >
                <Plus className="h-4 w-4 mr-2" />
                {widget.title}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 响应式网格布局 */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={defaultBreakpoints}
        cols={defaultCols}
        rowHeight={60}
        isDraggable={isEditing}
        isResizable={isEditing}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        preventCollision={false}
        compactType="vertical"
      >
        {activeWidgetComponents.map(widget => {
          const WidgetComponent = widget.component
          
          return (
            <div key={widget.id} className="dashboard-widget">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {widget.title}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {isEditing && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 cursor-move"
                        >
                          <GripVertical className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => removeWidget(widget.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-4">
                  <div className="h-full">
                    <WidgetComponent {...(widget.props || {})} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </ResponsiveGridLayout>

      {/* 自定义样式 */}
      <style jsx global>{`
        .react-grid-layout {
          position: relative;
        }
        
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top;
        }
        
        .react-grid-item.cssTransforms {
          transition-property: transform;
        }
        
        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZG90cyBmaWxsPSIjOTk5IiBjeD0iMSIgY3k9IjEiIHI9IjEiLz4KPGRvdHMgZmlsbD0iIzk5OSIgY3g9IjEiIGN5PSI1IiByPSIxIi8+CjxkdXRzIGZpbGw9IiM5OTkiIGN4PSI1IiBjeT0iMSIgcj0iMSIvPgo8ZG90cyBmaWxsPSIjOTk5IiBjeD0iNSIgY3k9IjUiIHI9IjEiLz4KPC9zdmc+Cg==') no-repeat;
          background-position: bottom right;
          padding: 0 3px 3px 0;
          background-repeat: no-repeat;
          background-origin: content-box;
          box-sizing: border-box;
          cursor: se-resize;
        }
        
        .react-grid-item.react-grid-placeholder {
          background: rgb(59 130 246 / 0.15);
          opacity: 0.2;
          transition-duration: 100ms;
          z-index: 2;
          user-select: none;
          border-radius: 6px;
          border: 2px dashed rgb(59 130 246 / 0.5);
        }
        
        .dashboard-widget {
          height: 100%;
        }
        
        .dashboard-widget .card {
          height: 100%;
          overflow: hidden;
        }
        
        .dashboard-widget .card-content {
          overflow: auto;
        }
      `}</style>
    </div>
  )
}

// 预设布局配置
export const createDefaultLayouts = (widgets: DashboardWidget[]): { [key: string]: Layout[] } => {
  const layouts: { [key: string]: Layout[] } = {}
  
  Object.keys(defaultBreakpoints).forEach(breakpoint => {
    const cols = defaultCols[breakpoint] || 12
    let x = 0
    let y = 0

    layouts[breakpoint] = widgets.map((widget) => {
      const layout: Layout = {
        i: widget.id,
        x: x,
        y: y,
        w: Math.min(widget.defaultSize.w, cols),
        h: widget.defaultSize.h,
        minW: widget.minSize?.w || 1,
        minH: widget.minSize?.h || 1,
        maxW: widget.maxSize?.w || cols,
        maxH: widget.maxSize?.h || 20
      }

      x += layout.w
      if (x >= cols) {
        x = 0
        y += layout.h
      }

      return layout
    })
  })

  return layouts
}

// 布局持久化工具
export const saveLayoutToStorage = (layouts: { [key: string]: Layout[] }, key: string = 'dashboard-layout') => {
  try {
    localStorage.setItem(key, JSON.stringify(layouts))
  } catch (error) {
    console.error('Failed to save layout to storage:', error)
  }
}

export const loadLayoutFromStorage = (key: string = 'dashboard-layout'): { [key: string]: Layout[] } | null => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.error('Failed to load layout from storage:', error)
    return null
  }
}