'use client'

import React, { useState, useEffect } from 'react'
import { useEditorStore } from '@/store/editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Palette,
  Move,
  RotateCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ElementProperties {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  fill: string
  stroke: string
  strokeWidth: number
  visible: boolean
  locked: boolean
}

interface TextProperties {
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: string
  fontStyle: string
  textAlign: string
  textDecoration: string
}

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
  '#ffc0cb', '#a52a2a', '#808080', '#008000', '#000080'
]

const FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
  'Courier New', 'Impact', 'Comic Sans MS', 'Trebuchet MS', 'Palatino'
]

export function PropertyPanel() {
  const { selectedObject, addToHistory } = useEditorStore()
  const [properties, setProperties] = useState<ElementProperties>({
    x: 0, y: 0, width: 0, height: 0, rotation: 0, opacity: 1,
    fill: '#000000', stroke: '#000000', strokeWidth: 1,
    visible: true, locked: false
  })
  const [textProps, setTextProps] = useState<TextProperties>({
    text: '', fontFamily: 'Arial', fontSize: 16, fontWeight: 'normal',
    fontStyle: 'normal', textAlign: 'left', textDecoration: 'none'
  })

  // 更新属性当选中元素改变时
  useEffect(() => {
    if (!selectedObject) return

    const bbox = selectedObject.bbox()
    const transform = selectedObject.transform()
    
    setProperties({
      x: Math.round(bbox.x),
      y: Math.round(bbox.y),
      width: Math.round(bbox.width),
      height: Math.round(bbox.height),
      rotation: transform.rotate || 0,
      opacity: selectedObject.opacity() || 1,
      fill: selectedObject.fill() || '#000000',
      stroke: selectedObject.stroke() || '#000000',
      strokeWidth: selectedObject.attr('stroke-width') || 1,
      visible: selectedObject.opacity() > 0,
      locked: false // TODO: 从图层状态获取
    })

    // 如果是文本元素，更新文本属性
    if (selectedObject.type === 'text') {
      setTextProps({
        text: selectedObject.text(),
        fontFamily: selectedObject.attr('font-family') || 'Arial',
        fontSize: parseInt(selectedObject.attr('font-size')) || 16,
        fontWeight: selectedObject.attr('font-weight') || 'normal',
        fontStyle: selectedObject.attr('font-style') || 'normal',
        textAlign: selectedObject.attr('text-anchor') || 'left',
        textDecoration: selectedObject.attr('text-decoration') || 'none'
      })
    }
  }, [selectedObject])

  // 应用属性变化
  const applyPropertyChange = (property: keyof ElementProperties, value: any) => {
    if (!selectedObject) return

    const oldValue = properties[property]
    setProperties(prev => ({ ...prev, [property]: value }))

    switch (property) {
      case 'x':
      case 'y':
        selectedObject.move(property === 'x' ? value : properties.x, property === 'y' ? value : properties.y)
        addToHistory('move', `移动元素到 (${value}, ${property === 'x' ? properties.y : properties.x})`, selectedObject.attr('data-layer-id'))
        break
      case 'width':
      case 'height':
        selectedObject.size(property === 'width' ? value : properties.width, property === 'height' ? value : properties.height)
        addToHistory('resize', `调整大小到 ${value}px`, selectedObject.attr('data-layer-id'))
        break
      case 'rotation':
        selectedObject.rotate(value)
        addToHistory('modify', `旋转到 ${value}°`, selectedObject.attr('data-layer-id'))
        break
      case 'opacity':
        selectedObject.opacity(value)
        addToHistory('style', `设置透明度为 ${Math.round(value * 100)}%`, selectedObject.attr('data-layer-id'))
        break
      case 'fill':
        selectedObject.fill(value)
        addToHistory('style', `设置填充颜色`, selectedObject.attr('data-layer-id'))
        break
      case 'stroke':
        selectedObject.stroke(value)
        addToHistory('style', `设置描边颜色`, selectedObject.attr('data-layer-id'))
        break
      case 'strokeWidth':
        selectedObject.stroke({ width: value })
        addToHistory('style', `设置描边宽度为 ${value}px`, selectedObject.attr('data-layer-id'))
        break
    }
  }

  // 应用文本属性变化
  const applyTextChange = (property: keyof TextProperties, value: any) => {
    if (!selectedObject || selectedObject.type !== 'text') return

    setTextProps(prev => ({ ...prev, [property]: value }))

    switch (property) {
      case 'text':
        selectedObject.text(value)
        addToHistory('modify', `编辑文本内容`, selectedObject.attr('data-layer-id'))
        break
      case 'fontFamily':
        selectedObject.font('family', value)
        addToHistory('style', `设置字体为 ${value}`, selectedObject.attr('data-layer-id'))
        break
      case 'fontSize':
        selectedObject.font('size', value)
        addToHistory('style', `设置字号为 ${value}px`, selectedObject.attr('data-layer-id'))
        break
      case 'fontWeight':
        selectedObject.font('weight', value)
        addToHistory('style', `设置字重`, selectedObject.attr('data-layer-id'))
        break
      case 'fontStyle':
        selectedObject.font('style', value)
        addToHistory('style', `设置字体样式`, selectedObject.attr('data-layer-id'))
        break
      case 'textAlign':
        selectedObject.attr('text-anchor', value)
        addToHistory('style', `设置文本对齐`, selectedObject.attr('data-layer-id'))
        break
    }
  }

  // 复制元素
  const duplicateElement = () => {
    if (!selectedObject) return
    // TODO: 实现复制功能
    console.log('复制元素')
  }

  // 删除元素
  const deleteElement = () => {
    if (!selectedObject) return
    addToHistory('delete', `删除 ${selectedObject.type || '元素'}`, selectedObject.attr('data-layer-id'))
    selectedObject.remove()
  }

  if (!selectedObject) {
    return (
      <div className="p-4 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto mb-3 bg-muted rounded-lg flex items-center justify-center">
            <Palette className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium mb-2">属性面板</h3>
          <p className="text-xs text-muted-foreground">
            选择一个元素以编辑其属性
          </p>
        </div>
      </div>
    )
  }

  const isTextElement = selectedObject.type === 'text'

  return (
    <div className="h-full flex flex-col">
      {/* 元素信息 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">
            {selectedObject.type === 'rect' && '矩形'}
            {selectedObject.type === 'circle' && '圆形'}
            {selectedObject.type === 'polygon' && '多边形'}
            {selectedObject.type === 'text' && '文本'}
            {!['rect', 'circle', 'polygon', 'text'].includes(selectedObject.type) && '元素'}
          </h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={duplicateElement} className="h-6 w-6 p-0">
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={deleteElement} className="h-6 w-6 p-0">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* 属性标签页 */}
      <Tabs defaultValue="transform" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
          <TabsTrigger value="transform" className="text-xs">变换</TabsTrigger>
          <TabsTrigger value="style" className="text-xs">样式</TabsTrigger>
          {isTextElement && <TabsTrigger value="text" className="text-xs">文本</TabsTrigger>}
          {!isTextElement && <TabsTrigger value="effects" className="text-xs">效果</TabsTrigger>}
        </TabsList>

        {/* 变换属性 */}
        <TabsContent value="transform" className="flex-1 p-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <Move className="h-3 w-3" />
                位置和大小
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X</Label>
                  <Input
                    type="number"
                    value={properties.x}
                    onChange={(e) => applyPropertyChange('x', Number(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y</Label>
                  <Input
                    type="number"
                    value={properties.y}
                    onChange={(e) => applyPropertyChange('y', Number(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">宽度</Label>
                  <Input
                    type="number"
                    value={properties.width}
                    onChange={(e) => applyPropertyChange('width', Number(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">高度</Label>
                  <Input
                    type="number"
                    value={properties.height}
                    onChange={(e) => applyPropertyChange('height', Number(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <RotateCw className="h-3 w-3" />
                旋转
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>角度</span>
                  <span>{properties.rotation}°</span>
                </div>
                <Slider
                  value={[properties.rotation]}
                  onValueChange={([value]) => applyPropertyChange('rotation', value)}
                  min={-180}
                  max={180}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 样式属性 */}
        <TabsContent value="style" className="flex-1 p-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">填充</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={properties.fill}
                  onChange={(e) => applyPropertyChange('fill', e.target.value)}
                  className="w-12 h-8 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={properties.fill}
                  onChange={(e) => applyPropertyChange('fill', e.target.value)}
                  className="flex-1 h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-5 gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded border-2 transition-all",
                      properties.fill === color ? "border-primary" : "border-border"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => applyPropertyChange('fill', color)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">描边</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={properties.stroke}
                  onChange={(e) => applyPropertyChange('stroke', e.target.value)}
                  className="w-12 h-8 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={properties.stroke}
                  onChange={(e) => applyPropertyChange('stroke', e.target.value)}
                  className="flex-1 h-8 text-xs"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>宽度</span>
                  <span>{properties.strokeWidth}px</span>
                </div>
                <Slider
                  value={[properties.strokeWidth]}
                  onValueChange={([value]) => applyPropertyChange('strokeWidth', value)}
                  min={0}
                  max={20}
                  step={0.5}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">透明度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>不透明度</span>
                  <span>{Math.round(properties.opacity * 100)}%</span>
                </div>
                <Slider
                  value={[properties.opacity]}
                  onValueChange={([value]) => applyPropertyChange('opacity', value)}
                  min={0}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 文本属性 */}
        {isTextElement && (
          <TabsContent value="text" className="flex-1 p-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">文本内容</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={textProps.text}
                  onChange={(e) => applyTextChange('text', e.target.value)}
                  className="h-8 text-xs"
                  placeholder="输入文本..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">字体</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">字体族</Label>
                  <Select value={textProps.fontFamily} onValueChange={(value) => applyTextChange('fontFamily', value)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map((font) => (
                        <SelectItem key={font} value={font} className="text-xs">
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">字号</Label>
                  <Input
                    type="number"
                    value={textProps.fontSize}
                    onChange={(e) => applyTextChange('fontSize', Number(e.target.value))}
                    className="h-8 text-xs"
                    min={8}
                    max={200}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">样式</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-1">
                  <Button
                    variant={textProps.fontWeight === 'bold' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyTextChange('fontWeight', textProps.fontWeight === 'bold' ? 'normal' : 'bold')}
                    className="h-8 w-8 p-0"
                  >
                    <Bold className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={textProps.fontStyle === 'italic' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyTextChange('fontStyle', textProps.fontStyle === 'italic' ? 'normal' : 'italic')}
                    className="h-8 w-8 p-0"
                  >
                    <Italic className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={textProps.textDecoration === 'underline' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyTextChange('textDecoration', textProps.textDecoration === 'underline' ? 'none' : 'underline')}
                    className="h-8 w-8 p-0"
                  >
                    <Underline className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant={textProps.textAlign === 'start' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyTextChange('textAlign', 'start')}
                    className="h-8 w-8 p-0"
                  >
                    <AlignLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={textProps.textAlign === 'middle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyTextChange('textAlign', 'middle')}
                    className="h-8 w-8 p-0"
                  >
                    <AlignCenter className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={textProps.textAlign === 'end' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyTextChange('textAlign', 'end')}
                    className="h-8 w-8 p-0"
                  >
                    <AlignRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* 效果属性 */}
        {!isTextElement && (
          <TabsContent value="effects" className="flex-1 p-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">滤镜效果</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  滤镜效果功能即将推出...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}