'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileIcon, 
  EditIcon, 
  ImageIcon, 
  SaveIcon,
  Download,
  Plus,
  FolderOpen,
  Image,
  Code,
  RefreshCw
} from "lucide-react"
import { Canvas as FabricCanvas } from "fabric"
import { Svg } from '@svgdotjs/svg.js'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import React from 'react'

interface EditorTabsProps {
  canvas: FabricCanvas | null;
  svgInstance?: Svg | null;
  onImportSVG?: (svgString: string) => boolean;
}

const EditorTabs = forwardRef<{ updateSvgInstance: (newInstance: Svg) => void }, EditorTabsProps>(({ canvas, svgInstance, onImportSVG }, ref) => {
  const [localSvgInstance, setLocalSvgInstance] = useState(svgInstance);
  
  // 暴露更新函数给父组件
  useImperativeHandle(ref, () => ({
    updateSvgInstance: (newInstance: Svg) => {
      setLocalSvgInstance(newInstance);
    },
    openSourceDialog: () => {
      openSourceDialog();
    }
  }));

  const [sourceDialogOpen, setSourceDialogOpen] = useState(false)
  const [svgSource, setSvgSource] = useState('')
  const [svgPreviewUrl, setSvgPreviewUrl] = useState('')

  // 打开源代码弹窗
  const openSourceDialog = () => {
    console.log('打开源代码对话框');
    
    // 优先使用SVG.js实例
    if (localSvgInstance) {
      console.log('使用SVG.js实例获取源代码');
      const svgData = localSvgInstance.svg(); // 获取SVG内容
      setSvgSource(svgData);
      
      // 创建预览
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      setSvgPreviewUrl(url);
      
      // 强制设置对话框打开
      setTimeout(() => {
        setSourceDialogOpen(true);
        console.log('对话框状态已设置为打开', sourceDialogOpen);
      }, 0);
    } 
    // 退回到Fabric.js (如果存在)
    else if (canvas) {
      console.log('使用Fabric.js获取源代码');
      const svgData = canvas.toSVG();
      setSvgSource(svgData);
      
      // 创建预览
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      setSvgPreviewUrl(url);
      
      // 强制设置对话框打开
      setTimeout(() => {
        setSourceDialogOpen(true);
        console.log('对话框状态已设置为打开', sourceDialogOpen);
      }, 0);
    } else {
      console.warn('没有可用的SVG实例，无法打开源代码');
      
      // 即使没有内容，也打开一个空的对话框
      setSvgSource('<!-- 没有可用的SVG内容 -->');
      setSourceDialogOpen(true);
    }
  }

  // 增加一个调试用的useEffect
  useEffect(() => {
    console.log('Dialog状态变化:', sourceDialogOpen);
  }, [sourceDialogOpen]);

  // 清理预览URL
  useEffect(() => {
    return () => {
      if (svgPreviewUrl) {
        URL.revokeObjectURL(svgPreviewUrl);
      }
    };
  }, [svgPreviewUrl]);

  // 应用修改后的源代码
  const applySourceChanges = () => {
    if (!svgSource) return
    
    try {
      // 清除现有预览URL
      if (svgPreviewUrl) {
        URL.revokeObjectURL(svgPreviewUrl);
      }
      
      // 创建新预览
      const blob = new Blob([svgSource], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      setSvgPreviewUrl(url);
      
      // 尝试导入SVG
      if (onImportSVG && onImportSVG(svgSource)) {
        console.log('SVG成功导入');
        setSourceDialogOpen(false);
        return;
      }
      
      // 如果没有导入函数或导入失败
      alert('无法将SVG应用到画布，请检查格式');
    } catch (error) {
      console.error("解析SVG时出错:", error);
      alert("无法解析SVG内容，请检查格式是否正确。");
    }
  }
  
  // 保存SVG
  const saveAsSVG = () => {
    let svgData = '';
    
    // 优先使用SVG.js
    if (localSvgInstance) {
      svgData = localSvgInstance.svg();
    } 
    // 退回到Fabric.js
    else if (canvas) {
      svgData = canvas.toSVG();
    }
    
    if (!svgData) return;
    
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'my-design.svg'
    link.click()
    
    URL.revokeObjectURL(url)
  }
  
  // 保存为PNG (需要单独实现)
  const saveAsPNG = () => {
    if (localSvgInstance) {
      // SVG.js 导出PNG方法
      const svgData = localSvgInstance.svg();
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml'});
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = localSvgInstance.width();
        canvas.height = localSvgInstance.height();
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = 'my-design.png';
          link.click();
          
          URL.revokeObjectURL(url);
        }
      };
      img.src = url;
    } 
    else if (canvas) {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1
      });
      
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'my-design.png';
      link.click();
    }
  }
  
  // 打开SVG文件
  const openSVG = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.svg'
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && canvas) {
        const reader = new FileReader()
        reader.onload = (f) => {
          const data = f.target?.result as string
          // 处理SVG数据...
          // 这里需要更多逻辑来将SVG转换为Fabric对象
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }
  
  // 导入图片
  const importImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && canvas) {
        const reader = new FileReader()
        reader.onload = (f) => {
          const data = f.target?.result as string
          // 处理图片...
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  return (
    <>
      <Tabs defaultValue="file" className="w-full bg-card text-card-foreground border-b border-border">
        <TabsList className="bg-muted border-b border-border w-full justify-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <TabsTrigger value="file" className="data-[state=active]:bg-background">
                <FileIcon className="h-4 w-4 mr-2" />
                文件
              </TabsTrigger>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => console.log('新建文档')}>
                <Plus className="h-4 w-4 mr-2" />
                新建文档
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                <FolderOpen className="h-4 w-4 mr-2" />
                打开 SVG...
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                <Image className="h-4 w-4 mr-2" />
                导入图片...
              </DropdownMenuItem>
              <DropdownMenuItem onClick={saveAsSVG}>
                <SaveIcon className="h-4 w-4 mr-2" />
                保存SVG
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+S</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={saveAsPNG}>
                <Download className="h-4 w-4 mr-2" />
                导出 PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                if (window.confirm('确定要重置画布吗？当前内容将丢失。')) {
                  window.location.reload();
                }
              }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重置画布
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <TabsTrigger value="edit" className="data-[state=active]:bg-background">
                <EditIcon className="h-4 w-4 mr-2" />
                编辑
              </TabsTrigger>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => {}}>
                取消选择
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                删除选中
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <TabsTrigger value="object" className="data-[state=active]:bg-background">
            <ImageIcon className="h-4 w-4 mr-2" />
            对象
          </TabsTrigger>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <TabsTrigger value="view" className="data-[state=active]:bg-background">
                视图
              </TabsTrigger>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem 
                className="icon-button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openSourceDialog();
                }}
              >
                <Code className="h-5 w-5 mr-2" />
                Source Code
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TabsList>
        
        {/* 添加空的TabsContent以符合Tabs组件的结构要求 */}
        <div style={{ height: 0, overflow: 'hidden' }}>
          <div id="file"></div>
          <div id="edit"></div>
          <div id="object"></div>
          <div id="view"></div>
        </div>
      </Tabs>

      {/* SVG源代码编辑弹窗 */}
      {sourceDialogOpen && (
        <Dialog open={true} onOpenChange={(open) => {
          console.log('Dialog onOpenChange:', open);
          setSourceDialogOpen(open);
        }}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>SVG 源代码</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Textarea 
                  className="min-h-[400px] font-mono text-sm" 
                  value={svgSource}
                  onChange={(e) => setSvgSource(e.target.value)}
                />
              </div>
              
              <div className="border rounded-md p-2 bg-white">
                <div className="text-sm mb-2 text-muted-foreground">预览:</div>
                {svgPreviewUrl && (
                  <div className="flex items-center justify-center h-[380px] overflow-auto bg-gray-100">
                    <img 
                      src={svgPreviewUrl} 
                      alt="SVG Preview" 
                      className="max-w-full max-h-full"
                      onError={() => alert('SVG预览失败，可能存在格式问题')} 
                    />
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSourceDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={applySourceChanges}>
                应用
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
})

export default EditorTabs 