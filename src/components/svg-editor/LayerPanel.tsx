'use client'

import React, { useState } from 'react'
import { useEditorStore } from '@/store/editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  Edit3,
  Trash2,
  Plus,
  Folder,
  FolderOpen,
  GripVertical,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface LayerItemProps {
  layer: any
  isSelected: boolean
  onSelect: () => void
  onRename: (name: string) => void
  onDelete: () => void
  onToggleVisibility: () => void
  onToggleLock: () => void
}

function LayerItem({ 
  layer, 
  isSelected, 
  onSelect, 
  onRename, 
  onDelete, 
  onToggleVisibility, 
  onToggleLock 
}: LayerItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(layer.name)

  const handleRename = () => {
    if (editName.trim() && editName !== layer.name) {
      onRename(editName.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setEditName(layer.name)
      setIsEditing(false)
    }
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
        isSelected && "bg-primary/10 border border-primary/20",
        !isSelected && "hover:bg-muted/50"
      )}
      onClick={onSelect}
    >
      {/* 拖拽手柄 */}
      <div className="cursor-grab hover:cursor-grabbing text-muted-foreground">
        <GripVertical className="h-3 w-3" />
      </div>

      {/* 图层名称 */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="h-6 text-xs"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={cn(
            "text-xs truncate block",
            !layer.visible && "opacity-50",
            layer.locked && "italic"
          )}>
            {layer.name}
          </span>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* 可见性切换 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility()
          }}
          title={layer.visible ? "隐藏图层" : "显示图层"}
        >
          {layer.visible ? (
            <Eye className="h-3 w-3" />
          ) : (
            <EyeOff className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>

        {/* 锁定切换 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation()
            onToggleLock()
          }}
          title={layer.locked ? "解锁图层" : "锁定图层"}
        >
          {layer.locked ? (
            <Lock className="h-3 w-3 text-orange-500" />
          ) : (
            <Unlock className="h-3 w-3" />
          )}
        </Button>

        {/* 更多操作 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
            >
              <Edit3 className="h-3 w-3 mr-2" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

interface LayerGroupProps {
  group: any
  layers: any[]
  onToggleCollapse: () => void
  onRenameGroup: (name: string) => void
  onDeleteGroup: () => void
}

function LayerGroup({ group, layers, onToggleCollapse, onRenameGroup, onDeleteGroup }: LayerGroupProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(group.name)

  const handleRename = () => {
    if (editName.trim() && editName !== group.name) {
      onRenameGroup(editName.trim())
    }
    setIsEditing(false)
  }

  return (
    <div className="mb-2">
      {/* 分组标题 */}
      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0"
          onClick={onToggleCollapse}
        >
          {group.collapsed ? (
            <Folder className="h-3 w-3" />
          ) : (
            <FolderOpen className="h-3 w-3" />
          )}
        </Button>

        <div className="flex-1">
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') {
                  setEditName(group.name)
                  setIsEditing(false)
                }
              }}
              className="h-5 text-xs"
              autoFocus
            />
          ) : (
            <span 
              className="text-xs font-medium cursor-pointer"
              onDoubleClick={() => setIsEditing(true)}
            >
              {group.name} ({group.layers.length})
            </span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit3 className="h-3 w-3 mr-2" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDeleteGroup} className="text-destructive">
              <Trash2 className="h-3 w-3 mr-2" />
              删除分组
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 分组内的图层 */}
      {!group.collapsed && (
        <div className="ml-4 mt-1 space-y-1">
          {layers.map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              isSelected={false} // TODO: 实现选中状态
              onSelect={() => {}} // TODO: 实现选中逻辑
              onRename={(name) => {}} // TODO: 实现重命名
              onDelete={() => {}} // TODO: 实现删除
              onToggleVisibility={() => {}} // TODO: 实现可见性切换
              onToggleLock={() => {}} // TODO: 实现锁定切换
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function LayerPanel() {
  const { 
    layers, 
    layerGroups,
    selectedObject,
    removeLayer,
    renameLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    createLayerGroup,
    removeLayerGroup
  } = useEditorStore()

  const [selectedLayers, setSelectedLayers] = useState<string[]>([])

  // 获取未分组的图层
  const ungroupedLayers = layers.filter(layer => !layer.groupId)

  // 获取分组及其图层
  const groupsWithLayers = layerGroups.map(group => ({
    ...group,
    layers: layers.filter(layer => layer.groupId === group.id)
  }))

  const handleCreateGroup = () => {
    if (selectedLayers.length > 1) {
      const groupName = `分组 ${layerGroups.length + 1}`
      createLayerGroup(groupName, selectedLayers)
      setSelectedLayers([])
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 标题和操作 */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">图层</h3>
          <div className="flex gap-1">
            {selectedLayers.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateGroup}
                className="h-6 px-2 text-xs"
              >
                <Folder className="h-3 w-3 mr-1" />
                分组
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              title="添加图层"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {selectedLayers.length > 0 && (
          <p className="text-xs text-muted-foreground">
            已选择 {selectedLayers.length} 个图层
          </p>
        )}
      </div>

      {/* 图层列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {layers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <div className="h-8 w-8 mx-auto mb-2 opacity-50 bg-muted rounded" />
              <p>暂无图层</p>
              <p className="text-xs mt-1">添加元素以创建图层</p>
            </div>
          ) : (
            <>
              {/* 分组 */}
              {groupsWithLayers.map((group) => (
                <LayerGroup
                  key={group.id}
                  group={group}
                  layers={group.layers}
                  onToggleCollapse={() => {
                    // TODO: 实现折叠切换
                  }}
                  onRenameGroup={(name) => {
                    // TODO: 实现分组重命名
                  }}
                  onDeleteGroup={() => removeLayerGroup(group.id)}
                />
              ))}

              {/* 未分组的图层 */}
              {ungroupedLayers.map((layer) => {
                const isSelected = selectedObject === layer.element
                
                return (
                  <LayerItem
                    key={layer.id}
                    layer={layer}
                    isSelected={isSelected}
                    onSelect={() => {
                      // TODO: 实现图层选中
                    }}
                    onRename={(name) => renameLayer(layer.id, name)}
                    onDelete={() => removeLayer(layer.id)}
                    onToggleVisibility={() => toggleLayerVisibility(layer.id)}
                    onToggleLock={() => toggleLayerLock(layer.id)}
                  />
                )
              })}
            </>
          )}
        </div>
      </ScrollArea>
      
      {/* 底部信息 */}
      {layers.length > 0 && (
        <div className="p-2 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            共 {layers.length} 个图层
            {layerGroups.length > 0 && ` · ${layerGroups.length} 个分组`}
          </p>
        </div>
      )}
    </div>
  )
}