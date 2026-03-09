import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Element as SVGElement, Svg } from '@svgdotjs/svg.js'

type ToolType = 'select' | 'rectangle' | 'circle' | 'triangle' | 'text' | 'pen' | 'image'

interface HistoryEntry {
  id: string
  type: 'create' | 'delete' | 'modify' | 'move' | 'resize' | 'style' | 'import'
  description: string
  timestamp: number
  svgState: string // SVG内容的快照
  elementId?: string // 相关元素的ID
}

interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  element: SVGElement
  groupId?: string
}

interface LayerGroup {
  id: string
  name: string
  layers: string[] // layer IDs
  collapsed: boolean
}

interface EditorState {
  zoom: number
  pan: { x: number; y: number }
  activeTool: ToolType
  selectedObject: SVGElement | null
  history: HistoryEntry[]
  historyIndex: number
  canvasSize: { width: number; height: number }
  layers: Layer[]
  layerGroups: LayerGroup[]
  svgInstance: Svg | null
  
  setZoom: (zoom: number) => void
  setPan: (pan: { x: number; y: number }) => void
  setActiveTool: (tool: ToolType) => void
  setSelectedObject: (object: SVGElement | null) => void
  setCanvasSize: (size: { width: number; height: number }) => void
  setSvgInstance: (svg: Svg | null) => void
  
  // 历史记录管理
  addToHistory: (type: HistoryEntry['type'], description: string, elementId?: string) => void
  undo: () => void
  redo: () => void
  jumpToHistory: (index: number) => void
  clearHistory: () => void
  
  // 图层管理
  addLayer: (element: SVGElement, name?: string) => void
  removeLayer: (layerId: string) => void
  updateLayer: (layerId: string, updates: Partial<Layer>) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
  toggleLayerVisibility: (layerId: string) => void
  toggleLayerLock: (layerId: string) => void
  renameLayer: (layerId: string, name: string) => void
  
  // 图层分组
  createLayerGroup: (name: string, layerIds: string[]) => void
  removeLayerGroup: (groupId: string) => void
  addLayerToGroup: (layerId: string, groupId: string) => void
  removeLayerFromGroup: (layerId: string) => void
  
  clearSelection: () => void
}

export const useEditorStore = create<EditorState>()(
  devtools(
    (set, get) => ({
      zoom: 1,
      pan: { x: 0, y: 0 },
      activeTool: 'select',
      selectedObject: null,
      history: [],
      historyIndex: -1,
      canvasSize: { width: 800, height: 600 },
      layers: [],
      layerGroups: [],
      svgInstance: null,

      setZoom: (zoom) => set({ zoom }),
      setPan: (pan) => set({ pan }),
      setActiveTool: (tool) => set({ activeTool: tool }),
      setSelectedObject: (object) => set({ selectedObject: object }),
      setCanvasSize: (size) => set({ canvasSize: size }),
      setSvgInstance: (svg) => set({ svgInstance: svg }),
      
      clearSelection: () => {
        const { selectedObject } = get()
        if (selectedObject && typeof selectedObject.selectize === 'function') {
          selectedObject.selectize(false)
        }
        set({ selectedObject: null })
      },
      
      // 历史记录管理
      addToHistory: (type, description, elementId) => {
        const { svgInstance, history, historyIndex } = get()
        if (!svgInstance) return
        
        const entry: HistoryEntry = {
          id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type,
          description,
          timestamp: Date.now(),
          svgState: svgInstance.svg(),
          elementId
        }
        
        set({
          history: [...history.slice(0, historyIndex + 1), entry],
          historyIndex: historyIndex + 1
        })
      },
      
      undo: () => {
        const { history, historyIndex, svgInstance } = get()
        if (historyIndex > 0 && svgInstance) {
          const prevEntry = history[historyIndex - 1]
          // 恢复SVG状态
          svgInstance.clear()
          svgInstance.svg(prevEntry.svgState)
          set({ historyIndex: historyIndex - 1 })
        }
      },
      
      redo: () => {
        const { history, historyIndex, svgInstance } = get()
        if (historyIndex < history.length - 1 && svgInstance) {
          const nextEntry = history[historyIndex + 1]
          // 恢复SVG状态
          svgInstance.clear()
          svgInstance.svg(nextEntry.svgState)
          set({ historyIndex: historyIndex + 1 })
        }
      },
      
      jumpToHistory: (index) => {
        const { history, svgInstance } = get()
        if (index >= 0 && index < history.length && svgInstance) {
          const entry = history[index]
          svgInstance.clear()
          svgInstance.svg(entry.svgState)
          set({ historyIndex: index })
        }
      },
      
      clearHistory: () => set({ history: [], historyIndex: -1 }),
       
       // 图层管理
       addLayer: (element, name) => {
         const layerId = `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
         element.attr('data-layer-id', layerId)
         
         const layer: Layer = {
           id: layerId,
           name: name || `图层 ${get().layers.length + 1}`,
           visible: true,
           locked: false,
           element
         }
         
         set((prev) => ({ layers: [...prev.layers, layer] }))
       },
       
       removeLayer: (layerId) => {
         const { layers } = get()
         const layer = layers.find(l => l.id === layerId)
         if (layer) {
           layer.element.remove()
           set((prev) => ({ layers: prev.layers.filter(l => l.id !== layerId) }))
         }
       },
       
       updateLayer: (layerId, updates) => {
         set((prev) => ({
           layers: prev.layers.map(layer => 
             layer.id === layerId ? { ...layer, ...updates } : layer
           )
         }))
       },
       
       reorderLayers: (fromIndex, toIndex) => {
         set((prev) => {
           const newLayers = [...prev.layers]
           const [movedLayer] = newLayers.splice(fromIndex, 1)
           newLayers.splice(toIndex, 0, movedLayer)
           return { layers: newLayers }
         })
       },
       
       toggleLayerVisibility: (layerId) => {
         const { layers } = get()
         const layer = layers.find(l => l.id === layerId)
         if (layer) {
           const newVisible = !layer.visible
           layer.element.opacity(newVisible ? 1 : 0)
           set((prev) => ({
             layers: prev.layers.map(l => 
               l.id === layerId ? { ...l, visible: newVisible } : l
             )
           }))
         }
       },
       
       toggleLayerLock: (layerId) => {
         const { layers } = get()
         const layer = layers.find(l => l.id === layerId)
         if (layer) {
           const newLocked = !layer.locked
           // 禁用/启用拖拽和选择
           if (newLocked) {
             layer.element.draggable(false)
             if (typeof layer.element.selectize === 'function') {
               layer.element.selectize(false)
             }
           } else {
             layer.element.draggable(true)
           }
           
           set((prev) => ({
             layers: prev.layers.map(l => 
               l.id === layerId ? { ...l, locked: newLocked } : l
             )
           }))
         }
       },
       
       renameLayer: (layerId, name) => {
         set((prev) => ({
           layers: prev.layers.map(layer => 
             layer.id === layerId ? { ...layer, name } : layer
           )
         }))
       },
       
       // 图层分组
       createLayerGroup: (name, layerIds) => {
         const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
         const group: LayerGroup = {
           id: groupId,
           name,
           layers: layerIds,
           collapsed: false
         }
         
         set((prev) => ({
           layerGroups: [...prev.layerGroups, group],
           layers: prev.layers.map(layer => 
             layerIds.includes(layer.id) ? { ...layer, groupId } : layer
           )
         }))
       },
       
       removeLayerGroup: (groupId) => {
         set((prev) => ({
           layerGroups: prev.layerGroups.filter(g => g.id !== groupId),
           layers: prev.layers.map(layer => 
             layer.groupId === groupId ? { ...layer, groupId: undefined } : layer
           )
         }))
       },
       
       addLayerToGroup: (layerId, groupId) => {
         set((prev) => ({
           layers: prev.layers.map(layer => 
             layer.id === layerId ? { ...layer, groupId } : layer
           ),
           layerGroups: prev.layerGroups.map(group => 
             group.id === groupId ? { ...group, layers: [...group.layers, layerId] } : group
           )
         }))
       },
       
       removeLayerFromGroup: (layerId) => {
         const { layers, layerGroups } = get()
         const layer = layers.find(l => l.id === layerId)
         if (layer && layer.groupId) {
           set((prev) => ({
             layers: prev.layers.map(l => 
               l.id === layerId ? { ...l, groupId: undefined } : l
             ),
             layerGroups: prev.layerGroups.map(group => 
               group.id === layer.groupId ? 
                 { ...group, layers: group.layers.filter(id => id !== layerId) } : 
                 group
             )
           }))
         }
       }
     }),
     { name: 'editor-store' }
   )
 )