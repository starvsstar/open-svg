'use client'

import { Plugin, ToolbarItem, MenuItem, PropertyPanel } from './plugin-manager'
import { Element as SVGElement } from '@svgdotjs/svg.js'
import React from 'react'

// 示例插件1：网格对齐插件
export const gridSnapPlugin: Plugin = {
  id: 'grid-snap',
  name: '网格对齐',
  version: '1.0.0',
  description: '自动将元素对齐到网格，提高设计精度',
  author: 'SVG Editor Team',
  icon: '🔲',
  enabled: false,
  
  async onEnable() {
    console.log('Grid snap plugin enabled')
  },
  
  async onDisable() {
    console.log('Grid snap plugin disabled')
  },
  
  onElementCreate(element: SVGElement) {
    // 自动对齐新创建的元素到网格
    this.snapToGrid(element)
  },
  
  onElementUpdate(element: SVGElement) {
    // 移动时自动对齐到网格
    this.snapToGrid(element)
  },
  
  snapToGrid(element: SVGElement) {
    const gridSize = 20
    const bbox = element.bbox()
    
    const snappedX = Math.round(bbox.x / gridSize) * gridSize
    const snappedY = Math.round(bbox.y / gridSize) * gridSize
    
    element.move(snappedX, snappedY)
  },
  
  getToolbarItems(): ToolbarItem[] {
    return [
      {
        id: 'toggle-grid',
        label: '显示网格',
        icon: '🔲',
        tooltip: '显示/隐藏对齐网格',
        onClick: () => {
          // 切换网格显示
          console.log('Toggle grid visibility')
        },
        isActive: () => false
      }
    ]
  },
  
  getMenuItems(): MenuItem[] {
    return [
      {
        id: 'grid-settings',
        label: '网格设置',
        icon: '⚙️',
        onClick: () => {
          console.log('Open grid settings')
        }
      }
    ]
  }
}

// 示例插件2：颜色主题插件
export const colorThemePlugin: Plugin = {
  id: 'color-theme',
  name: '颜色主题',
  version: '1.2.0',
  description: '提供预设的颜色主题，快速应用配色方案',
  author: 'Design Team',
  icon: '🎨',
  enabled: false,
  
  colorThemes: [
    {
      name: '海洋蓝',
      colors: ['#0077be', '#00a8cc', '#40e0d0', '#87ceeb', '#b0e0e6']
    },
    {
      name: '日落橙',
      colors: ['#ff6b35', '#f7931e', '#ffd700', '#ffb347', '#ffa500']
    },
    {
      name: '森林绿',
      colors: ['#228b22', '#32cd32', '#90ee90', '#98fb98', '#f0fff0']
    }
  ],
  
  async onEnable() {
    console.log('Color theme plugin enabled')
  },
  
  onElementSelect(element: SVGElement) {
    // 记录当前选中元素，用于应用主题
    this.selectedElement = element
  },
  
  applyTheme(themeName: string) {
    const theme = this.colorThemes.find(t => t.name === themeName)
    if (!theme || !this.selectedElement) return
    
    // 应用主题的第一个颜色作为填充色
    this.selectedElement.fill(theme.colors[0])
    
    // 应用主题的第二个颜色作为描边色
    if (theme.colors[1]) {
      this.selectedElement.stroke(theme.colors[1])
    }
  },
  
  getToolbarItems(): ToolbarItem[] {
    return [
      {
        id: 'apply-ocean-theme',
        label: '海洋主题',
        icon: '🌊',
        tooltip: '应用海洋蓝主题',
        onClick: () => this.applyTheme('海洋蓝'),
        isDisabled: () => !this.selectedElement
      },
      {
        id: 'apply-sunset-theme',
        label: '日落主题',
        icon: '🌅',
        tooltip: '应用日落橙主题',
        onClick: () => this.applyTheme('日落橙'),
        isDisabled: () => !this.selectedElement
      },
      {
        id: 'apply-forest-theme',
        label: '森林主题',
        icon: '🌲',
        tooltip: '应用森林绿主题',
        onClick: () => this.applyTheme('森林绿'),
        isDisabled: () => !this.selectedElement
      }
    ]
  }
}

// 示例插件3：导出增强插件
export const exportEnhancerPlugin: Plugin = {
  id: 'export-enhancer',
  name: '导出增强',
  version: '2.0.0',
  description: '提供更多导出格式和优化选项',
  author: 'Export Team',
  icon: '📤',
  enabled: false,
  
  async onEnable() {
    console.log('Export enhancer plugin enabled')
  },
  
  exportAsPDF() {
    console.log('Exporting as PDF...')
    // 实现PDF导出逻辑
  },
  
  exportAsEPS() {
    console.log('Exporting as EPS...')
    // 实现EPS导出逻辑
  },
  
  exportOptimizedSVG() {
    console.log('Exporting optimized SVG...')
    // 实现SVG优化导出逻辑
  },
  
  getMenuItems(): MenuItem[] {
    return [
      {
        id: 'export-menu',
        label: '高级导出',
        icon: '📤',
        submenu: [
          {
            id: 'export-pdf',
            label: '导出为PDF',
            onClick: () => this.exportAsPDF()
          },
          {
            id: 'export-eps',
            label: '导出为EPS',
            onClick: () => this.exportAsEPS()
          },
          {
            id: 'export-optimized',
            label: '导出优化SVG',
            onClick: () => this.exportOptimizedSVG()
          }
        ]
      }
    ]
  }
}

// 示例插件4：快捷操作插件
export const quickActionsPlugin: Plugin = {
  id: 'quick-actions',
  name: '快捷操作',
  version: '1.1.0',
  description: '提供常用的快捷操作和批量处理功能',
  author: 'Productivity Team',
  icon: '⚡',
  enabled: false,
  
  async onEnable() {
    console.log('Quick actions plugin enabled')
  },
  
  duplicateElement() {
    if (this.selectedElement) {
      const clone = this.selectedElement.clone()
      clone.move(
        this.selectedElement.x() + 20,
        this.selectedElement.y() + 20
      )
      console.log('Element duplicated')
    }
  },
  
  alignToCenter() {
    if (this.selectedElement && this.svgInstance) {
      const svgBBox = this.svgInstance.bbox()
      const elementBBox = this.selectedElement.bbox()
      
      this.selectedElement.move(
        (svgBBox.width - elementBBox.width) / 2,
        (svgBBox.height - elementBBox.height) / 2
      )
      console.log('Element centered')
    }
  },
  
  randomizeColors() {
    if (this.selectedElement) {
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      this.selectedElement.fill(randomColor)
      console.log('Color randomized')
    }
  },
  
  onElementSelect(element: SVGElement) {
    this.selectedElement = element
  },
  
  getToolbarItems(): ToolbarItem[] {
    return [
      {
        id: 'duplicate',
        label: '复制',
        icon: '📋',
        tooltip: '复制选中元素',
        onClick: () => this.duplicateElement(),
        isDisabled: () => !this.selectedElement
      },
      {
        id: 'center',
        label: '居中',
        icon: '🎯',
        tooltip: '将元素居中对齐',
        onClick: () => this.alignToCenter(),
        isDisabled: () => !this.selectedElement
      },
      {
        id: 'randomize',
        label: '随机色',
        icon: '🎲',
        tooltip: '随机更改颜色',
        onClick: () => this.randomizeColors(),
        isDisabled: () => !this.selectedElement
      }
    ]
  }
}

// 示例插件5：统计信息插件
export const statisticsPlugin: Plugin = {
  id: 'statistics',
  name: '统计信息',
  version: '1.0.0',
  description: '显示SVG文档的统计信息和分析数据',
  author: 'Analytics Team',
  icon: '📊',
  enabled: false,
  
  statistics: {
    elementCount: 0,
    totalArea: 0,
    colorCount: 0,
    layerCount: 0
  },
  
  async onEnable() {
    console.log('Statistics plugin enabled')
    this.updateStatistics()
  },
  
  onElementCreate() {
    this.updateStatistics()
  },
  
  onElementDelete() {
    this.updateStatistics()
  },
  
  updateStatistics() {
    // 更新统计信息
    if (this.svgInstance) {
      const elements = this.svgInstance.find('*')
      this.statistics.elementCount = elements.length
      
      // 计算总面积
      let totalArea = 0
      elements.forEach(element => {
        const bbox = element.bbox()
        totalArea += bbox.width * bbox.height
      })
      this.statistics.totalArea = totalArea
      
      // 统计颜色数量
      const colors = new Set()
      elements.forEach(element => {
        const fill = element.attr('fill')
        const stroke = element.attr('stroke')
        if (fill && fill !== 'none') colors.add(fill)
        if (stroke && stroke !== 'none') colors.add(stroke)
      })
      this.statistics.colorCount = colors.size
    }
  },
  
  showStatistics() {
    const stats = this.statistics
    alert(`SVG统计信息:\n元素数量: ${stats.elementCount}\n总面积: ${stats.totalArea.toFixed(2)}px²\n颜色数量: ${stats.colorCount}\n图层数量: ${stats.layerCount}`)
  },
  
  getMenuItems(): MenuItem[] {
    return [
      {
        id: 'show-stats',
        label: '显示统计',
        icon: '📊',
        onClick: () => this.showStatistics()
      }
    ]
  }
}

// 导出所有示例插件
export const examplePlugins = [
  gridSnapPlugin,
  colorThemePlugin,
  exportEnhancerPlugin,
  quickActionsPlugin,
  statisticsPlugin
]