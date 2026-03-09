'use client'

import { useEffect, useRef, useState } from 'react'
import { SVG, Svg, Element as SVGElement } from '@svgdotjs/svg.js'
import '@svgdotjs/svg.draggable.js'
import '@svgdotjs/svg.select.js'
import { useEditorStore } from '@/store/editor'
import { HistoryPanel } from '@/components/svg-editor/HistoryPanel'
import { LayerPanel } from '@/components/svg-editor/LayerPanel'
import { PropertyPanel } from '@/components/svg-editor/PropertyPanel'
import { ImportExportModal } from '@/components/svg-editor/ImportExportModal'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { Textarea } from "@/components/ui/textarea"
import { PathEditor } from '@/components/svg-editor/PathEditor'
import { GradientEditor } from '@/components/svg-editor/GradientEditor'
import { AlignmentTools } from '@/components/svg-editor/AlignmentTools'
import { AnimationEditor } from '@/components/svg-editor/AnimationEditor'
import { FilterEditor } from '@/components/svg-editor/FilterEditor'
import { SmartTooltip } from '@/components/ui/smart-tooltip'
import { UserGuide } from '@/components/ui/user-guide'
import { ThemeCustomizer } from '@/components/ui/theme-customizer'
import { KeyboardShortcuts } from '@/components/ui/keyboard-shortcuts'
import { LayoutManager } from '@/components/ui/layout-manager'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileIcon,
  FolderOpen,
  Save,
  Download,
  Upload,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Square,
  Circle,
  Triangle,
  Type,
  Palette,
  Layers,
  History,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Copy,
  Trash2,
  Text as TextIcon,
  Circle as CircleIcon,
  Square as SquareIcon,
  Triangle as TriangleIcon,
  Layers as LayersIcon,
  Image as ImageIcon,
  ArrowUpDown,
  ArrowLeftRight,
  Code,
  PenTool,
  Move3D,
  Zap,
  Filter,
  HelpCircle,
  Settings
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export default function SvgEditor() {
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState('properties')
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [showUserGuide, setShowUserGuide] = useState(false)
  
  const { 
    zoom, 
    setZoom, 
    activeTool,
    setActiveTool, 
    selectedObject,
    setSelectedObject,
    clearSelection,
    canvasSize,
    setCanvasSize,
    svgInstance,
    setSvgInstance,
    undo,
    redo,
    history,
    historyIndex,
    addToHistory,
    addLayer
  } = useEditorStore()
  
  // 启用键盘快捷键
  useKeyboardShortcuts()
  
  // 初始化SVG.js画布
  useEffect(() => {
    if (!svgContainerRef.current) return
    
    // 清除旧实例
    if (svgInstance) {
      svgInstance.remove()
    }
    
    // 创建新的SVG画布
    const svg = SVG().addTo(svgContainerRef.current).size(canvasSize.width, canvasSize.height)
    
    // 设置背景
    svg.rect(canvasSize.width, canvasSize.height)
      .fill('#ffffff')
      .stroke('none')
      .addClass('canvas-background')
    
    // 保存实例到store
    setSvgInstance(svg)
    
    // 添加初始历史记录
    addToHistory('create', '创建新画布')
    
    // 设置画布事件
    svg.on('click', (event) => {
      const target = event.target
      if (target && target !== svg.node && target.classList && !target.classList.contains('canvas-background')) {
        const svgElement = SVG(target) as SVGElement
        setSelectedObject(svgElement)
        
        // 应用选择效果
        if (typeof svgElement.selectize === 'function') {
          svgElement.selectize({
            rotationPoint: true,
            pointType: 'circle'
          })
        }
      } else {
        clearSelection()
      }
    })
    
    return () => {
      if (svg) {
        svg.remove()
      }
    }
  }, [canvasSize, setSvgInstance, addToHistory, setSelectedObject, clearSelection])

  // 绘图工具方法
  const addRectangle = () => {
    if (!svgInstance) return
    
    const rect = svgInstance.rect(100, 60)
      .fill('#3b82f6')
      .stroke({ color: '#1e40af', width: 2 })
      .move(100, 100)
      .draggable()
    
    addLayer(rect, '矩形')
    addToHistory('create', '添加矩形', rect.attr('data-layer-id'))
    setSelectedObject(rect)
  }
  
  const addCircle = () => {
    if (!svgInstance) return
    
    const circle = svgInstance.circle(80)
      .fill('#10b981')
      .stroke({ color: '#059669', width: 2 })
      .move(150, 150)
      .draggable()
    
    addLayer(circle, '圆形')
    addToHistory('create', '添加圆形', circle.attr('data-layer-id'))
    setSelectedObject(circle)
  }
  
  const addTriangle = () => {
    if (!svgInstance) return
    
    const triangle = svgInstance.polygon('50,0 100,50 0,50')
      .fill('#f59e0b')
      .stroke({ color: '#d97706', width: 2 })
      .move(200, 200)
      .draggable()
    
    addLayer(triangle, '三角形')
    addToHistory('create', '添加三角形', triangle.attr('data-layer-id'))
    setSelectedObject(triangle)
  }
  
  const addText = () => {
    if (!svgInstance) return
    
    const text = svgInstance.text('文本')
      .font({
        family: 'Arial',
        size: 24,
        fill: '#374151'
      })
      .move(250, 250)
      .draggable()
    
    // 双击编辑文本
    text.on('dblclick', () => {
      const newText = prompt('请输入文本:', text.text())
      if (newText !== null) {
        text.text(newText)
        addToHistory('modify', '编辑文本', text.attr('data-layer-id'))
      }
    })
    
    addLayer(text, '文本')
    addToHistory('create', '添加文本', text.attr('data-layer-id'))
    setSelectedObject(text)
  }

  // 文件操作函数
  const handleNewFile = () => {
    if (!svgInstance) return
    
    clearSelection()
    svgInstance.clear()
    
    // 重新添加背景
    svgInstance.rect(canvasSize.width, canvasSize.height)
      .fill('#ffffff')
      .stroke('none')
      .addClass('canvas-background')
    
    addToHistory('create', '新建文件')
  }

  const handleOpenFile = () => {
    setImportModalOpen(true)
  }

  const handleSaveFile = () => {
    if (!svgInstance) return
    
    const svgData = svgInstance.svg()
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'design.svg'
    link.click()
    
    URL.revokeObjectURL(url)
    addToHistory('export', '保存SVG文件')
  }

  const handleExportFile = () => {
    setExportModalOpen(true)
  }
  
  const handleImportFile = () => {
    setImportModalOpen(true)
  }

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 5)
    setZoom(newZoom)
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.1)
    setZoom(newZoom)
  }

  const handleResetZoom = () => {
    setZoom(1)
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        {/* 顶部工具栏 - 专注文件操作 */}
        <div className="h-12 border-b bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {/* 文件操作 */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleNewFile}
                    className="h-8 w-8 p-0"
                  >
                    <FileIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>新建文件 (Ctrl+N)</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleOpenFile}
                    className="h-8 w-8 p-0"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>打开文件 (Ctrl+O)</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSaveFile}
                    className="h-8 w-8 p-0"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>保存文件 (Ctrl+S)</p>
                </TooltipContent>
              </Tooltip>
              
              <Separator orientation="vertical" className="h-6 mx-2" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleExportFile}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>导出文件</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleImportFile}
                    className="h-8 w-8 p-0"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>导入文件</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <Separator orientation="vertical" className="h-6 mx-2" />
            
            {/* 编辑操作 */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="h-8 w-8 p-0"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>撤销 (Ctrl+Z)</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="h-8 w-8 p-0"
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>重做 (Ctrl+Y)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          {/* 视图控制 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleZoomOut}
                    className="h-8 w-8 p-0"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>缩小</p>
                </TooltipContent>
              </Tooltip>
              
              <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleZoomIn}
                    className="h-8 w-8 p-0"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>放大</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleResetZoom}
                    className="h-8 w-8 p-0"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>重置视图</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        
        {/* 主要内容区域 */}
        <div className="flex-1 flex">
          {/* 左侧工具面板 - 专注绘图工具 */}
          <div className="w-16 border-r bg-card flex flex-col items-center py-4 gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === 'select' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTool('select')}
                  className="h-10 w-10 p-0"
                >
                  <Move className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>选择工具</p>
              </TooltipContent>
            </Tooltip>
            
            <Separator className="w-8" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addRectangle}
                  className="h-10 w-10 p-0"
                >
                  <Square className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>矩形工具</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addCircle}
                  className="h-10 w-10 p-0"
                >
                  <Circle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>圆形工具</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addTriangle}
                  className="h-10 w-10 p-0"
                >
                  <Triangle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>三角形工具</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === 'path' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTool('path')}
                  className="h-10 w-10 p-0"
                >
                  <PenTool className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>路径工具</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === 'gradient' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTool('gradient')}
                  className="h-10 w-10 p-0"
                >
                  <Palette className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>渐变工具</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === 'align' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTool('align')}
                  className="h-10 w-10 p-0"
                >
                  <Move3D className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>对齐工具</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === 'animation' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTool('animation')}
                  className="h-10 w-10 p-0"
                >
                  <Zap className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>动画工具</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === 'filter' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTool('filter')}
                  className="h-10 w-10 p-0"
                >
                  <Filter className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>滤镜工具</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addText}
                  className="h-10 w-10 p-0"
                >
                  <Type className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>文本工具</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          {/* 中央画布区域 */}
          <div className="flex-1 bg-muted/30 p-4 flex items-center justify-center overflow-auto">
            <div 
              ref={svgContainerRef}
              className="bg-white shadow-lg rounded-lg border"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center'
              }}
            />
          </div>
          
          {/* 右侧属性面板 - 集成属性编辑、图层管理、历史记录 */}
          <div className="w-80 border-l bg-card">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="properties" className="text-xs">
                  <Palette className="h-3 w-3 mr-1" />
                  属性
                </TabsTrigger>
                <TabsTrigger value="layers" className="text-xs">
                  <Layers className="h-3 w-3 mr-1" />
                  图层
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs">
                  <History className="h-3 w-3 mr-1" />
                  历史
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="properties" className="flex-1 mt-0">
                {/* 路径编辑器 */}
                 {activeTool === 'path' && (
                   <div className="p-4 space-y-4">
                     <PathEditor 
                       onPathChange={(pathData) => {
                         // 处理路径数据变化
                         console.log('Path data changed:', pathData)
                       }}
                       initialPath={selectedObject?.type === 'path' ? selectedObject.attr('d') : ''}
                     />
                     <Separator />
                   </div>
                 )}
                 
                 {/* 渐变编辑器 */}
                  {activeTool === 'gradient' && (
                    <div className="p-4 space-y-4">
                      <GradientEditor 
                        onGradientChange={(gradient) => {
                          // 处理渐变数据变化
                          console.log('Gradient changed:', gradient)
                          // 应用渐变到选中元素
                          if (selectedObject) {
                            selectedObject.fill(`url(#${gradient.id})`)
                          }
                        }}
                      />
                      <Separator />
                    </div>
                  )}
                  
                  {/* 对齐工具 */}
                   {activeTool === 'align' && (
                     <div className="p-4 space-y-4">
                       <AlignmentTools 
                         selectedElements={selectedObject ? [selectedObject] : []}
                         onElementsChange={(elements) => {
                           // 处理元素变化
                           console.log('Elements aligned:', elements)
                         }}
                       />
                       <Separator />
                     </div>
                   )}
                   
                   {/* 动画编辑器 */}
                    {activeTool === 'animation' && (
                      <div className="p-4 space-y-4">
                        <AnimationEditor 
                          selectedElement={selectedObject}
                          onAnimationChange={(animation) => {
                            // 处理动画数据变化
                            console.log('Animation changed:', animation)
                          }}
                        />
                        <Separator />
                      </div>
                    )}
                    
                    {/* 滤镜编辑器 */}
                    {activeTool === 'filter' && (
                      <div className="p-4 space-y-4">
                        <FilterEditor 
                          selectedElement={selectedObject}
                          onFilterChange={(filterId, filterSVG) => {
                            // 处理滤镜数据变化
                            console.log('Filter changed:', filterId, filterSVG)
                          }}
                        />
                        <Separator />
                      </div>
                    )}
                <PropertyPanel />
              </TabsContent>
              
              <TabsContent value="layers" className="flex-1 mt-0">
                <LayerPanel />
              </TabsContent>
              
              <TabsContent value="history" className="flex-1 mt-0">
                <HistoryPanel />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* 底部状态栏 */}
        <div className="h-8 border-t bg-card flex items-center justify-between px-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>画布: {canvasSize.width} × {canvasSize.height}</span>
            <span>工具: {activeTool}</span>
            {selectedObject && (
              <span>已选择: {selectedObject.type || '元素'}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>缩放: {Math.round(zoom * 100)}%</span>
            <span>SVG编辑器 v2.0</span>
            
            {/* UX增强工具 */}
            <div className="flex items-center gap-1 ml-4">
              <UserGuide />
              <ThemeCustomizer />
              <KeyboardShortcuts />
              <LayoutManager />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowUserGuide(true)}
                    className="h-6 w-6 p-0"
                  >
                    <HelpCircle className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>帮助和指南</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        
        {/* 导入导出模态框 */}
        <ImportExportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          mode="import"
        />
        <ImportExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          mode="export"
        />
      </div>
    </TooltipProvider>
  )
}