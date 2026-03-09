'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Keyboard, 
  Search,
  RotateCcw,
  Edit3,
  Save,
  Download,
  Upload,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface KeyboardShortcut {
  id: string
  category: string
  action: string
  description: string
  keys: string[]
  defaultKeys: string[]
  customizable: boolean
}

interface ShortcutCategory {
  name: string
  description: string
  shortcuts: KeyboardShortcut[]
}

const defaultShortcuts: ShortcutCategory[] = [
  {
    name: '基本操作',
    description: '常用的编辑操作',
    shortcuts: [
      {
        id: 'save',
        category: '基本操作',
        action: 'save',
        description: '保存文档',
        keys: ['Ctrl', 'S'],
        defaultKeys: ['Ctrl', 'S'],
        customizable: true
      },
      {
        id: 'undo',
        category: '基本操作',
        action: 'undo',
        description: '撤销操作',
        keys: ['Ctrl', 'Z'],
        defaultKeys: ['Ctrl', 'Z'],
        customizable: true
      },
      {
        id: 'redo',
        category: '基本操作',
        action: 'redo',
        description: '重做操作',
        keys: ['Ctrl', 'Y'],
        defaultKeys: ['Ctrl', 'Y'],
        customizable: true
      },
      {
        id: 'copy',
        category: '基本操作',
        action: 'copy',
        description: '复制选中元素',
        keys: ['Ctrl', 'C'],
        defaultKeys: ['Ctrl', 'C'],
        customizable: true
      },
      {
        id: 'paste',
        category: '基本操作',
        action: 'paste',
        description: '粘贴元素',
        keys: ['Ctrl', 'V'],
        defaultKeys: ['Ctrl', 'V'],
        customizable: true
      },
      {
        id: 'delete',
        category: '基本操作',
        action: 'delete',
        description: '删除选中元素',
        keys: ['Delete'],
        defaultKeys: ['Delete'],
        customizable: true
      },
      {
        id: 'selectAll',
        category: '基本操作',
        action: 'selectAll',
        description: '全选',
        keys: ['Ctrl', 'A'],
        defaultKeys: ['Ctrl', 'A'],
        customizable: true
      }
    ]
  },
  {
    name: '工具切换',
    description: '快速切换编辑工具',
    shortcuts: [
      {
        id: 'selectTool',
        category: '工具切换',
        action: 'selectTool',
        description: '选择工具',
        keys: ['V'],
        defaultKeys: ['V'],
        customizable: true
      },
      {
        id: 'rectangleTool',
        category: '工具切换',
        action: 'rectangleTool',
        description: '矩形工具',
        keys: ['R'],
        defaultKeys: ['R'],
        customizable: true
      },
      {
        id: 'circleTool',
        category: '工具切换',
        action: 'circleTool',
        description: '圆形工具',
        keys: ['C'],
        defaultKeys: ['C'],
        customizable: true
      },
      {
        id: 'lineTool',
        category: '工具切换',
        action: 'lineTool',
        description: '直线工具',
        keys: ['L'],
        defaultKeys: ['L'],
        customizable: true
      },
      {
        id: 'pathTool',
        category: '工具切换',
        action: 'pathTool',
        description: '路径工具',
        keys: ['P'],
        defaultKeys: ['P'],
        customizable: true
      },
      {
        id: 'textTool',
        category: '工具切换',
        action: 'textTool',
        description: '文本工具',
        keys: ['T'],
        defaultKeys: ['T'],
        customizable: true
      }
    ]
  },
  {
    name: '视图控制',
    description: '画布视图操作',
    shortcuts: [
      {
        id: 'zoomIn',
        category: '视图控制',
        action: 'zoomIn',
        description: '放大',
        keys: ['Ctrl', '+'],
        defaultKeys: ['Ctrl', '+'],
        customizable: true
      },
      {
        id: 'zoomOut',
        category: '视图控制',
        action: 'zoomOut',
        description: '缩小',
        keys: ['Ctrl', '-'],
        defaultKeys: ['Ctrl', '-'],
        customizable: true
      },
      {
        id: 'zoomFit',
        category: '视图控制',
        action: 'zoomFit',
        description: '适应画布',
        keys: ['Ctrl', '0'],
        defaultKeys: ['Ctrl', '0'],
        customizable: true
      },
      {
        id: 'zoomActual',
        category: '视图控制',
        action: 'zoomActual',
        description: '实际大小',
        keys: ['Ctrl', '1'],
        defaultKeys: ['Ctrl', '1'],
        customizable: true
      },
      {
        id: 'toggleGrid',
        category: '视图控制',
        action: 'toggleGrid',
        description: '切换网格',
        keys: ['Ctrl', 'G'],
        defaultKeys: ['Ctrl', 'G'],
        customizable: true
      },
      {
        id: 'toggleRulers',
        category: '视图控制',
        action: 'toggleRulers',
        description: '切换标尺',
        keys: ['Ctrl', 'R'],
        defaultKeys: ['Ctrl', 'R'],
        customizable: true
      }
    ]
  },
  {
    name: '对象操作',
    description: '选中对象的操作',
    shortcuts: [
      {
        id: 'group',
        category: '对象操作',
        action: 'group',
        description: '组合对象',
        keys: ['Ctrl', 'G'],
        defaultKeys: ['Ctrl', 'G'],
        customizable: true
      },
      {
        id: 'ungroup',
        category: '对象操作',
        action: 'ungroup',
        description: '取消组合',
        keys: ['Ctrl', 'Shift', 'G'],
        defaultKeys: ['Ctrl', 'Shift', 'G'],
        customizable: true
      },
      {
        id: 'duplicate',
        category: '对象操作',
        action: 'duplicate',
        description: '复制对象',
        keys: ['Ctrl', 'D'],
        defaultKeys: ['Ctrl', 'D'],
        customizable: true
      },
      {
        id: 'bringToFront',
        category: '对象操作',
        action: 'bringToFront',
        description: '置于顶层',
        keys: ['Ctrl', 'Shift', ']'],
        defaultKeys: ['Ctrl', 'Shift', ']'],
        customizable: true
      },
      {
        id: 'sendToBack',
        category: '对象操作',
        action: 'sendToBack',
        description: '置于底层',
        keys: ['Ctrl', 'Shift', '['],
        defaultKeys: ['Ctrl', 'Shift', '['],
        customizable: true
      }
    ]
  },
  {
    name: '界面控制',
    description: '界面和面板操作',
    shortcuts: [
      {
        id: 'toggleProperties',
        category: '界面控制',
        action: 'toggleProperties',
        description: '切换属性面板',
        keys: ['F4'],
        defaultKeys: ['F4'],
        customizable: true
      },
      {
        id: 'toggleLayers',
        category: '界面控制',
        action: 'toggleLayers',
        description: '切换图层面板',
        keys: ['F7'],
        defaultKeys: ['F7'],
        customizable: true
      },
      {
        id: 'toggleToolbar',
        category: '界面控制',
        action: 'toggleToolbar',
        description: '切换工具栏',
        keys: ['F1'],
        defaultKeys: ['F1'],
        customizable: true
      },
      {
        id: 'fullscreen',
        category: '界面控制',
        action: 'fullscreen',
        description: '全屏模式',
        keys: ['F11'],
        defaultKeys: ['F11'],
        customizable: false
      }
    ]
  }
]

interface KeyboardShortcutsProps {
  className?: string
  onShortcutChange?: (shortcut: KeyboardShortcut) => void
}

export function KeyboardShortcuts({ className, onShortcutChange }: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [shortcuts, setShortcuts] = useState<ShortcutCategory[]>(defaultShortcuts)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingShortcut, setEditingShortcut] = useState<KeyboardShortcut | null>(null)
  const [recordingKeys, setRecordingKeys] = useState(false)
  const [tempKeys, setTempKeys] = useState<string[]>([])
  const [showResetDialog, setShowResetDialog] = useState(false)

  // 加载保存的快捷键配置
  useEffect(() => {
    const savedShortcuts = localStorage.getItem('svg-editor-shortcuts')
    if (savedShortcuts) {
      try {
        const parsed = JSON.parse(savedShortcuts)
        setShortcuts(parsed)
      } catch (error) {
        console.error('Failed to load shortcuts:', error)
      }
    }
  }, [])

  // 保存快捷键配置
  const saveShortcuts = () => {
    localStorage.setItem('svg-editor-shortcuts', JSON.stringify(shortcuts))
  }

  // 重置所有快捷键
  const resetAllShortcuts = () => {
    setShortcuts(defaultShortcuts)
    localStorage.removeItem('svg-editor-shortcuts')
    setShowResetDialog(false)
  }

  // 过滤快捷键
  const filteredShortcuts = shortcuts.map(category => ({
    ...category,
    shortcuts: category.shortcuts.filter(shortcut =>
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.keys.join(' ').toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.shortcuts.length > 0)

  // 开始编辑快捷键
  const startEditingShortcut = (shortcut: KeyboardShortcut) => {
    if (!shortcut.customizable) return
    setEditingShortcut(shortcut)
    setTempKeys([])
    setRecordingKeys(true)
  }

  // 取消编辑
  const cancelEditing = () => {
    setEditingShortcut(null)
    setRecordingKeys(false)
    setTempKeys([])
  }

  // 保存快捷键编辑
  const saveShortcutEdit = () => {
    if (!editingShortcut || tempKeys.length === 0) return

    // 检查快捷键冲突
    const hasConflict = shortcuts.some(category =>
      category.shortcuts.some(shortcut =>
        shortcut.id !== editingShortcut.id &&
        JSON.stringify(shortcut.keys) === JSON.stringify(tempKeys)
      )
    )

    if (hasConflict) {
      alert('该快捷键已被其他功能使用，请选择其他组合键')
      return
    }

    // 更新快捷键
    const updatedShortcuts = shortcuts.map(category => ({
      ...category,
      shortcuts: category.shortcuts.map(shortcut =>
        shortcut.id === editingShortcut.id
          ? { ...shortcut, keys: tempKeys }
          : shortcut
      )
    }))

    setShortcuts(updatedShortcuts)
    onShortcutChange?.({
      ...editingShortcut,
      keys: tempKeys
    })
    
    cancelEditing()
  }

  // 重置单个快捷键
  const resetShortcut = (shortcut: KeyboardShortcut) => {
    const updatedShortcuts = shortcuts.map(category => ({
      ...category,
      shortcuts: category.shortcuts.map(s =>
        s.id === shortcut.id
          ? { ...s, keys: s.defaultKeys }
          : s
      )
    }))
    setShortcuts(updatedShortcuts)
  }

  // 键盘事件处理
  useEffect(() => {
    if (!recordingKeys) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const key = e.key
      const modifiers = []
      
      if (e.ctrlKey) modifiers.push('Ctrl')
      if (e.altKey) modifiers.push('Alt')
      if (e.shiftKey) modifiers.push('Shift')
      if (e.metaKey) modifiers.push('Meta')

      // 特殊键处理
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
        return
      }

      const keys = [...modifiers, key]
      setTempKeys(keys)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (tempKeys.length > 0) {
        setRecordingKeys(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [recordingKeys, tempKeys])

  // 导出快捷键配置
  const exportShortcuts = () => {
    const dataStr = JSON.stringify(shortcuts, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'svg-editor-shortcuts.json'
    link.click()
    
    URL.revokeObjectURL(url)
  }

  // 导入快捷键配置
  const importShortcuts = () => {
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
            setShortcuts(config)
          } catch (error) {
            alert('无法解析快捷键配置文件')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  // 格式化快捷键显示
  const formatKeys = (keys: string[]) => {
    return keys.map(key => {
      switch (key) {
        case 'Ctrl': return '⌃'
        case 'Alt': return '⌥'
        case 'Shift': return '⇧'
        case 'Meta': return '⌘'
        case 'ArrowUp': return '↑'
        case 'ArrowDown': return '↓'
        case 'ArrowLeft': return '←'
        case 'ArrowRight': return '→'
        case ' ': return 'Space'
        default: return key
      }
    }).join(' + ')
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className={className}>
            <Keyboard className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              快捷键设置
            </DialogTitle>
            <DialogDescription>
              查看和自定义编辑器快捷键
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 搜索和操作栏 */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索快捷键..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={importShortcuts}>
                  <Upload className="h-4 w-4 mr-2" />
                  导入
                </Button>
                <Button variant="outline" size="sm" onClick={exportShortcuts}>
                  <Download className="h-4 w-4 mr-2" />
                  导出
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowResetDialog(true)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重置全部
                </Button>
              </div>
            </div>
            
            {/* 快捷键列表 */}
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                {filteredShortcuts.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                    
                    <div className="space-y-2">
                      {category.shortcuts.map((shortcut) => (
                        <Card key={shortcut.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{shortcut.description}</div>
                              <div className="text-sm text-muted-foreground">
                                {shortcut.action}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {/* 快捷键显示 */}
                              <div className="flex items-center gap-1">
                                {editingShortcut?.id === shortcut.id ? (
                                  <Badge variant="outline" className="bg-blue-50">
                                    {recordingKeys ? (
                                      tempKeys.length > 0 ? formatKeys(tempKeys) : '按下快捷键...'
                                    ) : (
                                      formatKeys(tempKeys)
                                    )}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    {formatKeys(shortcut.keys)}
                                  </Badge>
                                )}
                              </div>
                              
                              {/* 操作按钮 */}
                              <div className="flex items-center gap-1">
                                {editingShortcut?.id === shortcut.id ? (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={cancelEditing}
                                    >
                                      取消
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      onClick={saveShortcutEdit}
                                      disabled={tempKeys.length === 0}
                                    >
                                      <Save className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    {shortcut.customizable && (
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => startEditingShortcut(shortcut)}
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </Button>
                                    )}
                                    
                                    {shortcut.customizable && 
                                     JSON.stringify(shortcut.keys) !== JSON.stringify(shortcut.defaultKeys) && (
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => resetShortcut(shortcut)}
                                        title="重置为默认"
                                      >
                                        <RotateCcw className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {/* 底部操作 */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                共 {shortcuts.reduce((total, cat) => total + cat.shortcuts.length, 0)} 个快捷键
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  取消
                </Button>
                <Button onClick={() => { saveShortcuts(); setIsOpen(false) }}>
                  保存设置
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 重置确认对话框 */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              重置所有快捷键
            </AlertDialogTitle>
            <AlertDialogDescription>
              这将重置所有快捷键为默认设置，您的自定义配置将丢失。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={resetAllShortcuts}>
              确认重置
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}