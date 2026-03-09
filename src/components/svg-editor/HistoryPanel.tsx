'use client'

import React from 'react'
import { useEditorStore } from '@/store/editor'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Undo2, 
  Redo2, 
  Clock, 
  Trash2,
  Plus,
  Edit,
  Move,
  Palette,
  Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'

const getActionIcon = (type: string) => {
  switch (type) {
    case 'create':
      return <Plus className="h-3 w-3" />
    case 'delete':
      return <Trash2 className="h-3 w-3" />
    case 'modify':
    case 'resize':
      return <Edit className="h-3 w-3" />
    case 'move':
      return <Move className="h-3 w-3" />
    case 'style':
      return <Palette className="h-3 w-3" />
    case 'import':
      return <Upload className="h-3 w-3" />
    default:
      return <Clock className="h-3 w-3" />
  }
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

export function HistoryPanel() {
  const { 
    history, 
    historyIndex, 
    undo, 
    redo, 
    jumpToHistory, 
    clearHistory 
  } = useEditorStore()

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  return (
    <div className="h-full flex flex-col">
      {/* 标题和操作按钮 */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">历史记录</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            disabled={history.length === 0}
            className="h-6 px-2 text-xs"
          >
            清空
          </Button>
        </div>
        
        {/* 撤销/重做按钮 */}
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={!canUndo}
            className="flex-1 h-8"
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 className="h-3 w-3 mr-1" />
            撤销
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={!canRedo}
            className="flex-1 h-8"
            title="重做 (Ctrl+Y)"
          >
            <Redo2 className="h-3 w-3 mr-1" />
            重做
          </Button>
        </div>
      </div>

      {/* 历史记录列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>暂无历史记录</p>
              <p className="text-xs mt-1">开始编辑以记录操作历史</p>
            </div>
          ) : (
            history.map((entry, index) => {
              const isActive = index === historyIndex
              const isFuture = index > historyIndex
              
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "p-2 rounded-md cursor-pointer transition-colors border",
                    isActive && "bg-primary/10 border-primary/20",
                    !isActive && !isFuture && "bg-muted/50 border-muted",
                    isFuture && "bg-background border-border opacity-50",
                    "hover:bg-muted/80"
                  )}
                  onClick={() => jumpToHistory(index)}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      "mt-0.5 p-1 rounded",
                      isActive && "bg-primary text-primary-foreground",
                      !isActive && "bg-muted text-muted-foreground"
                    )}>
                      {getActionIcon(entry.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          "text-xs font-medium truncate",
                          isActive && "text-primary",
                          isFuture && "text-muted-foreground"
                        )}>
                          {entry.description}
                        </p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatTime(entry.timestamp)}
                        </span>
                      </div>
                      
                      {entry.elementId && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          元素: {entry.elementId}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {isActive && (
                    <div className="mt-1 ml-6">
                      <div className="h-0.5 bg-primary rounded-full" />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
      
      {/* 底部信息 */}
      {history.length > 0 && (
        <div className="p-2 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            {historyIndex + 1} / {history.length} 步操作
          </p>
        </div>
      )}
    </div>
  )
}