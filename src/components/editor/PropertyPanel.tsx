'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEditorStore } from '@/store/editor'
import { cn } from '@/lib/utils'
import { 
  ChevronDown, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Layers, 
  History, 
  Undo, 
  Redo, 
  MousePointer2 
} from 'lucide-react'
import { Element as SVGElement } from '@svgdotjs/svg.js'

interface Layer {
  id: string
  name: string
  type: string
  visible: boolean
  locked: boolean
}

interface HistoryItem {
  action: string
  timestamp: number
}

export function PropertyPanel() {
  const { selectedObject, history, undo, redo } = useEditorStore()
  const [layers, setLayers] = useState<Layer[]>([])
  const [historyIndex, setHistoryIndex] = useState(0)

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="properties" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="properties">属性</TabsTrigger>
          <TabsTrigger value="layers">图层</TabsTrigger>
          <TabsTrigger value="history">历史</TabsTrigger>
        </TabsList>
        
        <TabsContent value="properties" className="flex-1 p-4 space-y-4 overflow-auto">
          {!selectedObject ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <MousePointer2 className="h-8 w-8" />
              </div>
              <p className="text-sm">选择一个元素</p>
              <p className="text-xs">来编辑其属性</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <div className="w-4 h-4 rounded bg-primary" />
                <span className="text-sm font-medium">
                  元素属性
                </span>
              </div>
              
              <Card className="p-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">位置</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Input
                        type="number" 
                        placeholder="X"
                        className="h-8"
                      />
                      <Input
                        type="number" 
                        placeholder="Y"
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">大小</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Input
                        type="number" 
                        placeholder="宽"
                        className="h-8"
                      />
                      <Input
                        type="number" 
                        placeholder="高"
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">填充颜色</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        type="text"
                        placeholder="#000000"
                        className="flex-1 h-8"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="layers" className="flex-1 p-4 space-y-4 overflow-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">图层管理</h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Plus className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="text-center py-8 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Layers className="h-8 w-8" />
            </div>
            <p className="text-sm">暂无图层</p>
            <p className="text-xs">添加元素后将自动创建图层</p>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="flex-1 p-4 space-y-4 overflow-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">操作历史</h3>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2"
                onClick={undo}
              >
                <Undo className="h-3 w-3 mr-1" />
                撤销
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2"
                onClick={redo}
              >
                <Redo className="h-3 w-3 mr-1" />
                重做
              </Button>
            </div>
          </div>
          
          <div className="text-center py-8 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <History className="h-8 w-8" />
            </div>
            <p className="text-sm">暂无历史记录</p>
            <p className="text-xs">开始编辑后将显示操作历史</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}