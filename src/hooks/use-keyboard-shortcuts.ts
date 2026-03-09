'use client'

import { useEffect } from 'react'
import { useEditorStore } from '@/store/editor'

interface KeyboardShortcutsOptions {
  enableUndo?: boolean
  enableRedo?: boolean
  enableCopy?: boolean
  enablePaste?: boolean
  enableDelete?: boolean
  enableSelectAll?: boolean
  enableSave?: boolean
}

const defaultOptions: KeyboardShortcutsOptions = {
  enableUndo: true,
  enableRedo: true,
  enableCopy: true,
  enablePaste: true,
  enableDelete: true,
  enableSelectAll: true,
  enableSave: true
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const opts = { ...defaultOptions, ...options }
  
  const { 
    undo, 
    redo, 
    selectedObject, 
    clearSelection,
    addToHistory
  } = useEditorStore()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否在输入框中
      const target = event.target as HTMLElement
      const isInputElement = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.contentEditable === 'true'
      
      // 如果在输入框中，只处理特定快捷键
      if (isInputElement && !event.ctrlKey && !event.metaKey) {
        return
      }

      const isCtrlOrCmd = event.ctrlKey || event.metaKey
      
      // 撤销 (Ctrl/Cmd + Z)
      if (opts.enableUndo && isCtrlOrCmd && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
        return
      }
      
      // 重做 (Ctrl/Cmd + Y 或 Ctrl/Cmd + Shift + Z)
      if (opts.enableRedo && isCtrlOrCmd && 
          (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault()
        redo()
        return
      }
      
      // 复制 (Ctrl/Cmd + C)
      if (opts.enableCopy && isCtrlOrCmd && event.key === 'c' && selectedObject) {
        event.preventDefault()
        // TODO: 实现复制功能
        console.log('复制元素')
        return
      }
      
      // 粘贴 (Ctrl/Cmd + V)
      if (opts.enablePaste && isCtrlOrCmd && event.key === 'v') {
        event.preventDefault()
        // TODO: 实现粘贴功能
        console.log('粘贴元素')
        return
      }
      
      // 全选 (Ctrl/Cmd + A)
      if (opts.enableSelectAll && isCtrlOrCmd && event.key === 'a') {
        event.preventDefault()
        // TODO: 实现全选功能
        console.log('全选元素')
        return
      }
      
      // 保存 (Ctrl/Cmd + S)
      if (opts.enableSave && isCtrlOrCmd && event.key === 's') {
        event.preventDefault()
        // TODO: 实现保存功能
        console.log('保存文档')
        return
      }
      
      // 删除 (Delete 或 Backspace)
      if (opts.enableDelete && (event.key === 'Delete' || event.key === 'Backspace') && 
          selectedObject && !isInputElement) {
        event.preventDefault()
        // 记录删除操作到历史
        addToHistory('delete', `删除 ${selectedObject.type || '元素'}`, selectedObject.attr('data-layer-id'))
        selectedObject.remove()
        clearSelection()
        return
      }
      
      // ESC - 取消选择
      if (event.key === 'Escape') {
        event.preventDefault()
        clearSelection()
        return
      }
      
      // 方向键 - 移动选中元素
      if (selectedObject && !isInputElement && 
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault()
        
        const step = event.shiftKey ? 10 : 1
        const currentX = selectedObject.x() || 0
        const currentY = selectedObject.y() || 0
        
        let newX = currentX
        let newY = currentY
        
        switch (event.key) {
          case 'ArrowUp':
            newY = currentY - step
            break
          case 'ArrowDown':
            newY = currentY + step
            break
          case 'ArrowLeft':
            newX = currentX - step
            break
          case 'ArrowRight':
            newX = currentX + step
            break
        }
        
        selectedObject.move(newX, newY)
        addToHistory('move', `移动元素 ${step}px`, selectedObject.attr('data-layer-id'))
        return
      }
    }

    // 添加事件监听器
    document.addEventListener('keydown', handleKeyDown)
    
    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [opts, undo, redo, selectedObject, clearSelection, addToHistory])
}

// 快捷键提示信息
export const KEYBOARD_SHORTCUTS = {
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y',
  copy: 'Ctrl+C',
  paste: 'Ctrl+V',
  delete: 'Delete',
  selectAll: 'Ctrl+A',
  save: 'Ctrl+S',
  deselect: 'Esc',
  move: '方向键',
  moveFast: 'Shift+方向键'
} as const

// 获取快捷键描述
export function getShortcutDescription(action: keyof typeof KEYBOARD_SHORTCUTS): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const shortcut = KEYBOARD_SHORTCUTS[action]
  
  if (isMac) {
    return shortcut.replace('Ctrl', 'Cmd')
  }
  
  return shortcut
}