"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, RotateCcw, Code, Eye, Copy, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SVGPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  svg: {
    title: string;
    svg_content: string;
  };
}

export function SVGPreviewModal({ isOpen, onClose, svg }: SVGPreviewModalProps) {
  const [zoomLevel, setZoomLevel] = React.useState(100);
  const [dimensions, setDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const [view, setView] = React.useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // 计算SVG原始尺寸
  React.useEffect(() => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svg.svg_content, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    let width = 24;
    let height = 24;
    
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const [, , w, h] = viewBox.split(' ').map(Number);
      if (!isNaN(w) && !isNaN(h)) {
        width = w;
        height = h;
      }
    } else {
      const w = svgElement.getAttribute('width');
      const h = svgElement.getAttribute('height');
      if (w && h) {
        width = parseFloat(w);
        height = parseFloat(h);
      }
    }

    setDimensions({ width, height });
  }, [svg.svg_content]);

  // 自动计算初始缩放比例
  React.useEffect(() => {
    if (dimensions && containerRef.current) {
      const container = containerRef.current;
      const containerWidth = container.clientWidth - 64; // 考虑内边距
      const containerHeight = container.clientHeight - 64;

      // 计算最佳缩放比例
      const scaleX = containerWidth / dimensions.width;
      const scaleY = containerHeight / dimensions.height;
      const scale = Math.min(scaleX, scaleY) * 100;

      setZoomLevel(Math.floor(scale));
    }
  }, [dimensions]);

  // 处理复制代码
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(svg.svg_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2秒后重置复制状态
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] h-[90vh] w-[800px]">
        <DialogTitle className="sr-only">{svg.title}</DialogTitle>
        
        {/* 缩放控制栏 */}
        <div className="flex items-center justify-between border-b pb-2 pr-8">
          <span className="text-sm font-medium">{svg.title}</span>
          <div className="flex items-center gap-2">
            {/* 只在预览模式显示缩放控制 */}
            {view === 'preview' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.max(25, prev - 25))}
                  className="h-7 w-7 px-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(Number(e.target.value))}
                    className="w-16 h-7 text-center"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.min(400, prev + 25))}
                  className="h-7 w-7 px-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(100)}
                  className="h-7 px-3 ml-2"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  重置
                </Button>
              </>
            )}
            
            {/* 视图切换和复制按钮组 */}
            <div className="border-l pl-2 ml-2 flex items-center gap-2">
              {/* 复制按钮 */}
              {view === 'code' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className={cn(
                    "h-7 px-3 transition-all",
                    copied && "bg-green-500 text-white hover:bg-green-600"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      复制SVG
                    </>
                  )}
                </Button>
              )}

              {/* 视图切换按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView(view === 'preview' ? 'code' : 'preview')}
                className="h-7 px-3"
              >
                {view === 'preview' ? (
                  <>
                    <Code className="h-4 w-4 mr-1" />
                    代码
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    预览
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        {view === 'preview' ? (
          // SVG 预览区域
          <div 
            ref={containerRef}
            className="flex-1 overflow-auto scrollbar-thin relative h-[calc(90vh-6rem)] bg-gray-100/50 dark:bg-gray-800/50"
          >
            <div className="absolute inset-0 flex items-center justify-center p-8">
              {dimensions && (
                <div
                  className="bg-white shadow-sm rounded-lg"
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.2s ease',
                    width: dimensions.width,
                    height: dimensions.height,
                  }}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: svg.svg_content.replace(
                        /<svg([^>]*)>/,
                        `<svg$1 width="${dimensions.width}" height="${dimensions.height}" preserveAspectRatio="xMidYMid meet">`
                      ),
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          // 代码视图区域
          <div className="flex-1 overflow-hidden h-[calc(90vh-6rem)] bg-gray-100/50 dark:bg-gray-800/50 rounded-lg relative">
            <div className="h-full overflow-auto scrollbar-thin">
              <pre className="p-4 bg-white dark:bg-gray-900 m-4 rounded-lg shadow-sm">
                <code className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">
                  {svg.svg_content}
                </code>
              </pre>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}