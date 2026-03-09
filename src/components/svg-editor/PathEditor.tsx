'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Pen, 
  Move, 
  Plus, 
  Minus, 
  RotateCcw, 
  Square, 
  Circle,
  Triangle,
  PenTool,
  MousePointer
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/store/editor'

interface PathNode {
  id: string
  x: number
  y: number
  type: 'move' | 'line' | 'curve' | 'close'
  controlPoint1?: { x: number; y: number }
  controlPoint2?: { x: number; y: number }
  selected?: boolean
}

interface PathEditorProps {
  onPathChange?: (pathData: string) => void
  initialPath?: string
  className?: string
}

export function PathEditor({ onPathChange, initialPath = '', className }: PathEditorProps) {
  const [nodes, setNodes] = useState<PathNode[]>([])
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [editMode, setEditMode] = useState<'select' | 'add' | 'delete' | 'convert'>('select')
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)
  const { activeElement } = useEditorStore()

  // 解析路径字符串为节点数组
  const parsePathData = (pathData: string): PathNode[] => {
    const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || []
    const parsedNodes: PathNode[] = []
    let currentX = 0
    let currentY = 0
    let nodeId = 0

    commands.forEach(command => {
      const type = command[0]
      const coords = command.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n))
      
      switch (type.toLowerCase()) {
        case 'm': // Move to
          if (coords.length >= 2) {
            currentX = type === 'M' ? coords[0] : currentX + coords[0]
            currentY = type === 'M' ? coords[1] : currentY + coords[1]
            parsedNodes.push({
              id: `node-${nodeId++}`,
              x: currentX,
              y: currentY,
              type: 'move'
            })
          }
          break
        case 'l': // Line to
          for (let i = 0; i < coords.length; i += 2) {
            if (coords[i + 1] !== undefined) {
              currentX = type === 'L' ? coords[i] : currentX + coords[i]
              currentY = type === 'L' ? coords[i + 1] : currentY + coords[i + 1]
              parsedNodes.push({
                id: `node-${nodeId++}`,
                x: currentX,
                y: currentY,
                type: 'line'
              })
            }
          }
          break
        case 'c': // Cubic Bezier curve
          for (let i = 0; i < coords.length; i += 6) {
            if (coords[i + 5] !== undefined) {
              const cp1x = type === 'C' ? coords[i] : currentX + coords[i]
              const cp1y = type === 'C' ? coords[i + 1] : currentY + coords[i + 1]
              const cp2x = type === 'C' ? coords[i + 2] : currentX + coords[i + 2]
              const cp2y = type === 'C' ? coords[i + 3] : currentY + coords[i + 3]
              currentX = type === 'C' ? coords[i + 4] : currentX + coords[i + 4]
              currentY = type === 'C' ? coords[i + 5] : currentY + coords[i + 5]
              
              parsedNodes.push({
                id: `node-${nodeId++}`,
                x: currentX,
                y: currentY,
                type: 'curve',
                controlPoint1: { x: cp1x, y: cp1y },
                controlPoint2: { x: cp2x, y: cp2y }
              })
            }
          }
          break
        case 'z': // Close path
          parsedNodes.push({
            id: `node-${nodeId++}`,
            x: currentX,
            y: currentY,
            type: 'close'
          })
          break
      }
    })

    return parsedNodes
  }

  // 将节点数组转换为路径字符串
  const generatePathData = (nodeList: PathNode[]): string => {
    if (nodeList.length === 0) return ''
    
    let pathData = ''
    
    nodeList.forEach((node, index) => {
      switch (node.type) {
        case 'move':
          pathData += `M ${node.x} ${node.y} `
          break
        case 'line':
          pathData += `L ${node.x} ${node.y} `
          break
        case 'curve':
          if (node.controlPoint1 && node.controlPoint2) {
            pathData += `C ${node.controlPoint1.x} ${node.controlPoint1.y} ${node.controlPoint2.x} ${node.controlPoint2.y} ${node.x} ${node.y} `
          }
          break
        case 'close':
          pathData += 'Z '
          break
      }
    })
    
    return pathData.trim()
  }

  // 初始化路径数据
  useEffect(() => {
    if (initialPath) {
      const parsedNodes = parsePathData(initialPath)
      setNodes(parsedNodes)
    }
  }, [initialPath])

  // 当节点变化时更新路径
  useEffect(() => {
    const pathData = generatePathData(nodes)
    onPathChange?.(pathData)
  }, [nodes, onPathChange])

  // 处理SVG点击事件
  const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || editMode !== 'add') return
    
    const rect = svgRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    const newNode: PathNode = {
      id: `node-${Date.now()}`,
      x,
      y,
      type: nodes.length === 0 ? 'move' : 'line'
    }
    
    setNodes(prev => [...prev, newNode])
  }

  // 处理节点拖拽
  const handleNodeMouseDown = (event: React.MouseEvent, nodeId: string) => {
    event.stopPropagation()
    if (editMode !== 'select') return
    
    setIsDragging(true)
    setDragStart({ x: event.clientX, y: event.clientY })
    
    if (!selectedNodes.includes(nodeId)) {
      setSelectedNodes([nodeId])
    }
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || selectedNodes.length === 0) return
    
    const deltaX = event.clientX - dragStart.x
    const deltaY = event.clientY - dragStart.y
    
    setNodes(prev => prev.map(node => {
      if (selectedNodes.includes(node.id)) {
        return {
          ...node,
          x: node.x + deltaX,
          y: node.y + deltaY
        }
      }
      return node
    }))
    
    setDragStart({ x: event.clientX, y: event.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 删除选中的节点
  const deleteSelectedNodes = () => {
    setNodes(prev => prev.filter(node => !selectedNodes.includes(node.id)))
    setSelectedNodes([])
  }

  // 转换节点类型
  const convertNodeType = (nodeId: string, newType: 'line' | 'curve') => {
    setNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        const updatedNode = { ...node, type: newType }
        if (newType === 'curve' && !node.controlPoint1) {
          updatedNode.controlPoint1 = { x: node.x - 50, y: node.y - 50 }
          updatedNode.controlPoint2 = { x: node.x + 50, y: node.y - 50 }
        }
        return updatedNode
      }
      return node
    }))
  }

  // 添加新节点到路径中间
  const addNodeBetween = (index: number) => {
    if (index >= nodes.length - 1) return
    
    const currentNode = nodes[index]
    const nextNode = nodes[index + 1]
    const midX = (currentNode.x + nextNode.x) / 2
    const midY = (currentNode.y + nextNode.y) / 2
    
    const newNode: PathNode = {
      id: `node-${Date.now()}`,
      x: midX,
      y: midY,
      type: 'line'
    }
    
    setNodes(prev => [
      ...prev.slice(0, index + 1),
      newNode,
      ...prev.slice(index + 1)
    ])
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          路径编辑器
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 工具栏 */}
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <Button
            variant={editMode === 'select' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setEditMode('select')}
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            variant={editMode === 'add' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setEditMode('add')}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant={editMode === 'delete' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setEditMode('delete')}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={deleteSelectedNodes}
            disabled={selectedNodes.length === 0}
          >
            删除选中
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setNodes([])
              setSelectedNodes([])
            }}
          >
            清空路径
          </Button>
        </div>

        {/* SVG 编辑区域 */}
        <div className="border rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
          <svg
            ref={svgRef}
            width="100%"
            height="300"
            viewBox="0 0 400 300"
            className="cursor-crosshair"
            onClick={handleSvgClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* 网格背景 */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e5e5" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* 路径预览 */}
            {nodes.length > 0 && (
              <path
                d={generatePathData(nodes)}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            
            {/* 控制点连线 */}
            {nodes.map((node, index) => {
              if (node.type === 'curve' && node.controlPoint1 && node.controlPoint2) {
                return (
                  <g key={`control-${node.id}`}>
                    <line
                      x1={node.x}
                      y1={node.y}
                      x2={node.controlPoint1.x}
                      y2={node.controlPoint1.y}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                    <line
                      x1={node.x}
                      y1={node.y}
                      x2={node.controlPoint2.x}
                      y2={node.controlPoint2.y}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                  </g>
                )
              }
              return null
            })}
            
            {/* 节点 */}
            {nodes.map((node, index) => (
              <g key={node.id}>
                {/* 主节点 */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={selectedNodes.includes(node.id) ? 6 : 4}
                  fill={selectedNodes.includes(node.id) ? '#2563eb' : '#ffffff'}
                  stroke="#2563eb"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-6"
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (editMode === 'select') {
                      setSelectedNodes(prev => 
                        prev.includes(node.id) 
                          ? prev.filter(id => id !== node.id)
                          : [...prev, node.id]
                      )
                    } else if (editMode === 'delete') {
                      setNodes(prev => prev.filter(n => n.id !== node.id))
                    }
                  }}
                />
                
                {/* 控制点 */}
                {node.type === 'curve' && node.controlPoint1 && node.controlPoint2 && (
                  <>
                    <circle
                      cx={node.controlPoint1.x}
                      cy={node.controlPoint1.y}
                      r={3}
                      fill="#94a3b8"
                      className="cursor-pointer"
                    />
                    <circle
                      cx={node.controlPoint2.x}
                      cy={node.controlPoint2.y}
                      r={3}
                      fill="#94a3b8"
                      className="cursor-pointer"
                    />
                  </>
                )}
                
                {/* 中间点添加按钮 */}
                {index < nodes.length - 1 && editMode === 'add' && (
                  <circle
                    cx={(node.x + nodes[index + 1].x) / 2}
                    cy={(node.y + nodes[index + 1].y) / 2}
                    r={3}
                    fill="#10b981"
                    className="cursor-pointer opacity-60 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      addNodeBetween(index)
                    }}
                  />
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* 节点属性面板 */}
        {selectedNodes.length > 0 && (
          <div className="space-y-3 p-3 bg-muted rounded-lg">
            <h4 className="text-sm font-medium">节点属性</h4>
            {selectedNodes.map(nodeId => {
              const node = nodes.find(n => n.id === nodeId)
              if (!node) return null
              
              return (
                <div key={nodeId} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16">类型:</span>
                    <div className="flex gap-1">
                      <Button
                        variant={node.type === 'line' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => convertNodeType(nodeId, 'line')}
                      >
                        直线
                      </Button>
                      <Button
                        variant={node.type === 'curve' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => convertNodeType(nodeId, 'curve')}
                      >
                        曲线
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">X: </span>
                      <span>{Math.round(node.x)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Y: </span>
                      <span>{Math.round(node.y)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 路径信息 */}
        <div className="text-xs text-muted-foreground">
          <div>节点数量: {nodes.length}</div>
          <div className="mt-1 p-2 bg-muted rounded font-mono text-xs break-all">
            {generatePathData(nodes) || '空路径'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}