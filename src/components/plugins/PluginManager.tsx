'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
  Puzzle, 
  Download, 
  Trash2, 
  Settings, 
  Search,
  Plus,
  AlertCircle,
  CheckCircle,
  Info,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Plugin, pluginManager } from '@/lib/plugins/plugin-manager'
import { useToast } from '@/components/ui/use-toast'

interface PluginManagerProps {
  className?: string
}

export function PluginManager({ className }: PluginManagerProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [showUninstallDialog, setShowUninstallDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // 加载插件列表
  const loadPlugins = () => {
    setPlugins(pluginManager.getAllPlugins())
  }

  useEffect(() => {
    loadPlugins()
    
    // 监听插件事件
    const handlePluginChange = () => {
      loadPlugins()
    }
    
    pluginManager.on('plugin:installed', handlePluginChange)
    pluginManager.on('plugin:uninstalled', handlePluginChange)
    pluginManager.on('plugin:enabled', handlePluginChange)
    pluginManager.on('plugin:disabled', handlePluginChange)
    
    return () => {
      pluginManager.off('plugin:installed', handlePluginChange)
      pluginManager.off('plugin:uninstalled', handlePluginChange)
      pluginManager.off('plugin:enabled', handlePluginChange)
      pluginManager.off('plugin:disabled', handlePluginChange)
    }
  }, [])

  // 过滤插件
  const filteredPlugins = plugins.filter(plugin =>
    plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plugin.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 启用/禁用插件
  const togglePlugin = async (plugin: Plugin) => {
    setIsLoading(true)
    try {
      if (plugin.enabled) {
        await pluginManager.disablePlugin(plugin.id)
        toast({
          title: '插件已禁用',
          description: `${plugin.name} 已成功禁用`,
        })
      } else {
        await pluginManager.enablePlugin(plugin.id)
        toast({
          title: '插件已启用',
          description: `${plugin.name} 已成功启用`,
        })
      }
    } catch (error) {
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 卸载插件
  const uninstallPlugin = async (plugin: Plugin) => {
    setIsLoading(true)
    try {
      await pluginManager.uninstallPlugin(plugin.id)
      toast({
        title: '插件已卸载',
        description: `${plugin.name} 已成功卸载`,
      })
      setShowUninstallDialog(false)
      setSelectedPlugin(null)
    } catch (error) {
      toast({
        title: '卸载失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 安装插件（从文件）
  const installPluginFromFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.js,.ts'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const content = await file.text()
          // 这里需要实现插件代码的动态加载和验证
          // 为了安全起见，实际项目中应该有严格的插件验证机制
          toast({
            title: '功能开发中',
            description: '插件文件安装功能正在开发中',
          })
        } catch (error) {
          toast({
            title: '安装失败',
            description: '无法读取插件文件',
            variant: 'destructive',
          })
        }
      }
    }
    input.click()
  }

  // 获取插件状态图标
  const getStatusIcon = (plugin: Plugin) => {
    if (plugin.enabled) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <AlertCircle className="h-4 w-4 text-gray-400" />
  }

  // 获取插件状态文本
  const getStatusText = (plugin: Plugin) => {
    return plugin.enabled ? '已启用' : '已禁用'
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Puzzle className="h-5 w-5" />
          插件管理器
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="installed" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="installed">已安装插件</TabsTrigger>
            <TabsTrigger value="store">插件商店</TabsTrigger>
          </TabsList>
          
          <TabsContent value="installed" className="space-y-4">
            {/* 搜索和操作栏 */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索插件..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={installPluginFromFile}
              >
                <Plus className="h-4 w-4 mr-2" />
                安装插件
              </Button>
            </div>

            {/* 插件列表 */}
            <ScrollArea className="h-[400px]">
              {filteredPlugins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? '未找到匹配的插件' : '暂无已安装的插件'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPlugins.map((plugin) => (
                    <Card key={plugin.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {plugin.icon ? (
                            <img 
                              src={plugin.icon} 
                              alt={plugin.name}
                              className="w-10 h-10 rounded-md"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                              <Puzzle className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium truncate">{plugin.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                v{plugin.version}
                              </Badge>
                              {getStatusIcon(plugin)}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {plugin.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>作者: {plugin.author}</span>
                              <span>状态: {getStatusText(plugin)}</span>
                              {plugin.dependencies && plugin.dependencies.length > 0 && (
                                <span>依赖: {plugin.dependencies.length}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Switch
                            checked={plugin.enabled}
                            onCheckedChange={() => togglePlugin(plugin)}
                            disabled={isLoading}
                          />
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Info className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  {plugin.icon ? (
                                    <img 
                                      src={plugin.icon} 
                                      alt={plugin.name}
                                      className="w-6 h-6 rounded"
                                    />
                                  ) : (
                                    <Puzzle className="h-6 w-6" />
                                  )}
                                  {plugin.name}
                                </DialogTitle>
                                <DialogDescription>
                                  {plugin.description}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">版本:</span>
                                    <span className="ml-2">{plugin.version}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">作者:</span>
                                    <span className="ml-2">{plugin.author}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">状态:</span>
                                    <span className="ml-2">{getStatusText(plugin)}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">ID:</span>
                                    <span className="ml-2 font-mono text-xs">{plugin.id}</span>
                                  </div>
                                </div>
                                
                                {plugin.dependencies && plugin.dependencies.length > 0 && (
                                  <div>
                                    <span className="font-medium text-sm">依赖插件:</span>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {plugin.dependencies.map((dep) => (
                                        <Badge key={dep} variant="secondary" className="text-xs">
                                          {dep}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPlugin(plugin)
                              setShowUninstallDialog(true)
                            }}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="store" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <Puzzle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">插件商店</h3>
              <p className="text-sm">插件商店功能正在开发中...</p>
              <p className="text-xs mt-2">敬请期待更多精彩插件！</p>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* 卸载确认对话框 */}
        <AlertDialog open={showUninstallDialog} onOpenChange={setShowUninstallDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认卸载插件</AlertDialogTitle>
              <AlertDialogDescription>
                您确定要卸载插件 "{selectedPlugin?.name}" 吗？此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedPlugin && uninstallPlugin(selectedPlugin)}
                disabled={isLoading}
              >
                确认卸载
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}