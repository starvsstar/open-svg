'use client'

import { EventEmitter } from 'events'
import { Element as SVGElement } from '@svgdotjs/svg.js'

// 插件接口定义
export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  icon?: string
  enabled: boolean
  dependencies?: string[]
  
  // 插件生命周期方法
  onInstall?(): Promise<void>
  onUninstall?(): Promise<void>
  onEnable?(): Promise<void>
  onDisable?(): Promise<void>
  
  // 插件功能方法
  onElementSelect?(element: SVGElement): void
  onElementCreate?(element: SVGElement): void
  onElementUpdate?(element: SVGElement): void
  onElementDelete?(element: SVGElement): void
  
  // 工具栏扩展
  getToolbarItems?(): ToolbarItem[]
  
  // 菜单扩展
  getMenuItems?(): MenuItem[]
  
  // 属性面板扩展
  getPropertyPanels?(): PropertyPanel[]
}

// 工具栏项目接口
export interface ToolbarItem {
  id: string
  label: string
  icon: string
  tooltip?: string
  onClick: () => void
  isActive?: () => boolean
  isDisabled?: () => boolean
}

// 菜单项接口
export interface MenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  onClick: () => void
  submenu?: MenuItem[]
  separator?: boolean
}

// 属性面板接口
export interface PropertyPanel {
  id: string
  title: string
  icon?: string
  component: React.ComponentType<any>
  shouldShow?: (element: SVGElement) => boolean
}

// 插件事件类型
export type PluginEvent = 
  | 'plugin:installed'
  | 'plugin:uninstalled'
  | 'plugin:enabled'
  | 'plugin:disabled'
  | 'element:select'
  | 'element:create'
  | 'element:update'
  | 'element:delete'

// 插件管理器类
export class PluginManager extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map()
  private enabledPlugins: Set<string> = new Set()
  
  constructor() {
    super()
  }
  
  // 安装插件
  async installPlugin(plugin: Plugin): Promise<void> {
    try {
      // 检查依赖
      if (plugin.dependencies) {
        for (const dep of plugin.dependencies) {
          if (!this.plugins.has(dep)) {
            throw new Error(`Missing dependency: ${dep}`)
          }
        }
      }
      
      // 执行安装钩子
      if (plugin.onInstall) {
        await plugin.onInstall()
      }
      
      // 注册插件
      this.plugins.set(plugin.id, plugin)
      
      // 如果插件默认启用，则启用它
      if (plugin.enabled) {
        await this.enablePlugin(plugin.id)
      }
      
      this.emit('plugin:installed', plugin)
      console.log(`Plugin ${plugin.name} installed successfully`)
    } catch (error) {
      console.error(`Failed to install plugin ${plugin.name}:`, error)
      throw error
    }
  }
  
  // 卸载插件
  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }
    
    try {
      // 先禁用插件
      if (this.enabledPlugins.has(pluginId)) {
        await this.disablePlugin(pluginId)
      }
      
      // 执行卸载钩子
      if (plugin.onUninstall) {
        await plugin.onUninstall()
      }
      
      // 移除插件
      this.plugins.delete(pluginId)
      
      this.emit('plugin:uninstalled', plugin)
      console.log(`Plugin ${plugin.name} uninstalled successfully`)
    } catch (error) {
      console.error(`Failed to uninstall plugin ${plugin.name}:`, error)
      throw error
    }
  }
  
  // 启用插件
  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }
    
    if (this.enabledPlugins.has(pluginId)) {
      return // 已经启用
    }
    
    try {
      // 执行启用钩子
      if (plugin.onEnable) {
        await plugin.onEnable()
      }
      
      this.enabledPlugins.add(pluginId)
      plugin.enabled = true
      
      this.emit('plugin:enabled', plugin)
      console.log(`Plugin ${plugin.name} enabled successfully`)
    } catch (error) {
      console.error(`Failed to enable plugin ${plugin.name}:`, error)
      throw error
    }
  }
  
  // 禁用插件
  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }
    
    if (!this.enabledPlugins.has(pluginId)) {
      return // 已经禁用
    }
    
    try {
      // 执行禁用钩子
      if (plugin.onDisable) {
        await plugin.onDisable()
      }
      
      this.enabledPlugins.delete(pluginId)
      plugin.enabled = false
      
      this.emit('plugin:disabled', plugin)
      console.log(`Plugin ${plugin.name} disabled successfully`)
    } catch (error) {
      console.error(`Failed to disable plugin ${plugin.name}:`, error)
      throw error
    }
  }
  
  // 获取所有插件
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }
  
  // 获取启用的插件
  getEnabledPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(plugin => 
      this.enabledPlugins.has(plugin.id)
    )
  }
  
  // 获取插件
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)
  }
  
  // 检查插件是否启用
  isPluginEnabled(pluginId: string): boolean {
    return this.enabledPlugins.has(pluginId)
  }
  
  // 获取所有工具栏项目
  getAllToolbarItems(): ToolbarItem[] {
    const items: ToolbarItem[] = []
    
    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.getToolbarItems) {
        items.push(...plugin.getToolbarItems())
      }
    }
    
    return items
  }
  
  // 获取所有菜单项目
  getAllMenuItems(): MenuItem[] {
    const items: MenuItem[] = []
    
    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.getMenuItems) {
        items.push(...plugin.getMenuItems())
      }
    }
    
    return items
  }
  
  // 获取所有属性面板
  getAllPropertyPanels(): PropertyPanel[] {
    const panels: PropertyPanel[] = []
    
    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.getPropertyPanels) {
        panels.push(...plugin.getPropertyPanels())
      }
    }
    
    return panels
  }
  
  // 触发元素选择事件
  triggerElementSelect(element: SVGElement): void {
    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.onElementSelect) {
        try {
          plugin.onElementSelect(element)
        } catch (error) {
          console.error(`Plugin ${plugin.name} element select error:`, error)
        }
      }
    }
    
    this.emit('element:select', element)
  }
  
  // 触发元素创建事件
  triggerElementCreate(element: SVGElement): void {
    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.onElementCreate) {
        try {
          plugin.onElementCreate(element)
        } catch (error) {
          console.error(`Plugin ${plugin.name} element create error:`, error)
        }
      }
    }
    
    this.emit('element:create', element)
  }
  
  // 触发元素更新事件
  triggerElementUpdate(element: SVGElement): void {
    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.onElementUpdate) {
        try {
          plugin.onElementUpdate(element)
        } catch (error) {
          console.error(`Plugin ${plugin.name} element update error:`, error)
        }
      }
    }
    
    this.emit('element:update', element)
  }
  
  // 触发元素删除事件
  triggerElementDelete(element: SVGElement): void {
    for (const plugin of this.getEnabledPlugins()) {
      if (plugin.onElementDelete) {
        try {
          plugin.onElementDelete(element)
        } catch (error) {
          console.error(`Plugin ${plugin.name} element delete error:`, error)
        }
      }
    }
    
    this.emit('element:delete', element)
  }
  
  // 保存插件配置到本地存储
  saveConfig(): void {
    const config = {
      enabledPlugins: Array.from(this.enabledPlugins),
      pluginSettings: {}
    }
    
    localStorage.setItem('svg-editor-plugins', JSON.stringify(config))
  }
  
  // 从本地存储加载插件配置
  loadConfig(): void {
    try {
      const configStr = localStorage.getItem('svg-editor-plugins')
      if (configStr) {
        const config = JSON.parse(configStr)
        
        // 恢复启用状态
        if (config.enabledPlugins) {
          for (const pluginId of config.enabledPlugins) {
            if (this.plugins.has(pluginId)) {
              this.enabledPlugins.add(pluginId)
              const plugin = this.plugins.get(pluginId)!
              plugin.enabled = true
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load plugin config:', error)
    }
  }
}

// 全局插件管理器实例
export const pluginManager = new PluginManager()