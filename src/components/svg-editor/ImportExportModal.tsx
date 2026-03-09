'use client'

import React, { useState } from 'react'
import { useEditorStore } from '@/store/editor'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  Download,
  FileImage,
  FileText,
  Image,
  Settings,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportExportModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'import' | 'export'
}

type ExportFormat = 'svg' | 'png' | 'jpg' | 'webp' | 'pdf'
type ExportQuality = 'low' | 'medium' | 'high' | 'ultra'

interface ExportSettings {
  format: ExportFormat
  quality: ExportQuality
  width: number
  height: number
  scale: number
  backgroundColor: string
  transparent: boolean
}

const EXPORT_FORMATS = [
  { value: 'svg', label: 'SVG', description: '矢量图形，无损缩放' },
  { value: 'png', label: 'PNG', description: '支持透明背景的位图' },
  { value: 'jpg', label: 'JPEG', description: '压缩位图，文件较小' },
  { value: 'webp', label: 'WebP', description: '现代图片格式，高压缩比' },
  { value: 'pdf', label: 'PDF', description: '便携式文档格式' }
] as const

const QUALITY_SETTINGS = {
  low: { scale: 1, quality: 0.6 },
  medium: { scale: 1.5, quality: 0.8 },
  high: { scale: 2, quality: 0.9 },
  ultra: { scale: 3, quality: 1.0 }
}

export function ImportExportModal({ isOpen, onClose, mode }: ImportExportModalProps) {
  const { svgInstance, canvasSize, addToHistory } = useEditorStore()
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'png',
    quality: 'high',
    width: canvasSize.width,
    height: canvasSize.height,
    scale: 2,
    backgroundColor: '#ffffff',
    transparent: true
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [importFiles, setImportFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)

  // 处理文件拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type === 'image/svg+xml' || file.name.endsWith('.svg')
    )
    setImportFiles(files)
  }

  // 选择文件
  const handleFileSelect = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.svg,image/svg+xml'
    input.multiple = true
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      setImportFiles(files)
    }
    input.click()
  }

  // 导入SVG文件
  const handleImport = async () => {
    if (!svgInstance || importFiles.length === 0) return

    setIsProcessing(true)
    setProgress(0)

    try {
      for (let i = 0; i < importFiles.length; i++) {
        const file = importFiles[i]
        const content = await file.text()
        
        if (i === 0) {
          // 第一个文件替换当前内容
          svgInstance.clear()
          svgInstance.svg(content)
        } else {
          // 后续文件作为新图层添加
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = content
          const svgElement = tempDiv.querySelector('svg')
          
          if (svgElement) {
            // 将SVG内容添加为组
            const group = svgInstance.group()
            group.svg(svgElement.innerHTML)
            group.move(i * 20, i * 20) // 错开位置
          }
        }
        
        setProgress(((i + 1) / importFiles.length) * 100)
        await new Promise(resolve => setTimeout(resolve, 100)) // 模拟处理时间
      }
      
      addToHistory('import', `导入 ${importFiles.length} 个SVG文件`)
      onClose()
    } catch (error) {
      console.error('导入失败:', error)
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  // 导出文件
  const handleExport = async () => {
    if (!svgInstance) return

    setIsProcessing(true)
    setProgress(0)

    try {
      const svgData = svgInstance.svg()
      
      if (exportSettings.format === 'svg') {
        // 直接导出SVG
        const blob = new Blob([svgData], { type: 'image/svg+xml' })
        downloadFile(blob, 'design.svg')
        setProgress(100)
      } else {
        // 转换为位图格式
        await exportToBitmap(svgData)
      }
      
      addToHistory('export', `导出为 ${exportSettings.format.toUpperCase()} 格式`)
      onClose()
    } catch (error) {
      console.error('导出失败:', error)
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  // 导出为位图
  const exportToBitmap = async (svgData: string) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        setProgress(30)
        
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'))
          return
        }
        
        canvas.width = exportSettings.width * exportSettings.scale
        canvas.height = exportSettings.height * exportSettings.scale
        
        // 设置背景
        if (!exportSettings.transparent) {
          ctx.fillStyle = exportSettings.backgroundColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        
        setProgress(60)
        
        // 绘制SVG
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        setProgress(80)
        
        // 导出
        const quality = QUALITY_SETTINGS[exportSettings.quality].quality
        const mimeType = exportSettings.format === 'jpg' ? 'image/jpeg' : `image/${exportSettings.format}`
        
        canvas.toBlob((blob) => {
          if (blob) {
            const extension = exportSettings.format === 'jpg' ? 'jpg' : exportSettings.format
            downloadFile(blob, `design.${extension}`)
            setProgress(100)
            resolve()
          } else {
            reject(new Error('导出失败'))
          }
        }, mimeType, quality)
      }
      
      img.onerror = () => reject(new Error('图片加载失败'))
      
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' })
      img.src = URL.createObjectURL(svgBlob)
    })
  }

  // 下载文件
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // 移除导入文件
  const removeImportFile = (index: number) => {
    setImportFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'import' ? (
              <><Upload className="h-5 w-5" />导入文件</>
            ) : (
              <><Download className="h-5 w-5" />导出文件</>
            )}
          </DialogTitle>
        </DialogHeader>

        {mode === 'import' ? (
          <div className="space-y-4">
            {/* 文件拖拽区域 */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                "hover:border-primary/50 hover:bg-muted/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">拖拽SVG文件到这里</h3>
              <p className="text-sm text-muted-foreground mb-4">
                支持多个文件同时导入，或者点击下方按钮选择文件
              </p>
              <Button onClick={handleFileSelect} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                选择文件
              </Button>
            </div>

            {/* 已选择的文件列表 */}
            {importFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">已选择的文件 ({importFiles.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {importFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImportFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* 导入选项 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  导入选项
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span>第一个文件将替换当前画布内容，其他文件将作为新图层添加</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Tabs defaultValue="settings" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">导出设置</TabsTrigger>
              <TabsTrigger value="preview">预览</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-4">
              {/* 格式选择 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">输出格式</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    {EXPORT_FORMATS.map((format) => (
                      <div
                        key={format.value}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer transition-colors",
                          exportSettings.format === format.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        )}
                        onClick={() => setExportSettings(prev => ({ ...prev, format: format.value }))}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{format.label}</div>
                            <div className="text-xs text-muted-foreground">{format.description}</div>
                          </div>
                          {exportSettings.format === format.value && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 尺寸设置 */}
              {exportSettings.format !== 'svg' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">尺寸设置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">宽度 (px)</Label>
                        <Input
                          type="number"
                          value={exportSettings.width}
                          onChange={(e) => setExportSettings(prev => ({ ...prev, width: Number(e.target.value) }))}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">高度 (px)</Label>
                        <Input
                          type="number"
                          value={exportSettings.height}
                          onChange={(e) => setExportSettings(prev => ({ ...prev, height: Number(e.target.value) }))}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">质量</Label>
                      <Select
                        value={exportSettings.quality}
                        onValueChange={(value: ExportQuality) => setExportSettings(prev => ({ ...prev, quality: value }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">低质量 (1x)</SelectItem>
                          <SelectItem value="medium">中等质量 (1.5x)</SelectItem>
                          <SelectItem value="high">高质量 (2x)</SelectItem>
                          <SelectItem value="ultra">超高质量 (3x)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 背景设置 */}
              {exportSettings.format !== 'svg' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">背景设置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="transparent"
                        checked={exportSettings.transparent}
                        onChange={(e) => setExportSettings(prev => ({ ...prev, transparent: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="transparent" className="text-xs">透明背景</Label>
                    </div>
                    {!exportSettings.transparent && (
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={exportSettings.backgroundColor}
                          onChange={(e) => setExportSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          type="text"
                          value={exportSettings.backgroundColor}
                          onChange={(e) => setExportSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                          className="flex-1 h-8 text-xs"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">导出预览</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-8 bg-muted/30 rounded border-2 border-dashed">
                    <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      预览功能即将推出...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* 进度条 */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>处理中...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            取消
          </Button>
          {mode === 'import' ? (
            <Button 
              onClick={handleImport} 
              disabled={importFiles.length === 0 || isProcessing}
            >
              {isProcessing ? '导入中...' : `导入 ${importFiles.length} 个文件`}
            </Button>
          ) : (
            <Button 
              onClick={handleExport} 
              disabled={!svgInstance || isProcessing}
            >
              {isProcessing ? '导出中...' : '导出文件'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}