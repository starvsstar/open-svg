"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CodeEditor } from "@/components/svg/editor/CodeEditor";
import { Separator } from "@/components/ui/separator";
import { Code, Eye, Columns, Wand2, Copy, Trash2, Save, Download, Maximize2, LayoutTemplate, Component, Palette, Shapes, Hash, MoreHorizontal, SplitSquareVertical, PanelLeft, Plus, Minus, Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { handleNetworkError, withRetry } from "@/components/error-boundary";
import { AIChat } from "@/components/chat/ai-chat";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useResizable } from "@/hooks/use-resizable";
import { useResizablePercent } from "@/hooks/use-resizable-percent";

import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SVGPreviewModal } from "@/components/svg-preview-modal";
import { SVGExportModal } from "@/components/svg-export-modal";
import { AI_MODELS, type ModelProvider } from "@/config/ai-models";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ViewMode = 'code' | 'preview' | 'split';
type ExportFormat = 'PNG' | 'JPEG' | 'WebP';
type ExportSize = '1x' | '2x' | '3x' | 'custom';

// 添加一个新的消息类型，包含加载状态
type Message = {
  role: 'user' | 'assistant';
  content: string;
  loading?: boolean;
};

// 在文件顶部添加类型定义
type RadioValue = 'public' | 'private';

// 在文件顶部添加分类常量
const CATEGORIES = [
  { value: 'cards', label: 'Cards' },
  { value: 'elements', label: 'Elements' },
  { value: 'icons', label: 'Icons' },
  { value: 'logos', label: 'Logos' },
  { value: 'symbols', label: 'Symbols' },
  { value: 'others', label: 'Others' }
] as const;

export default function Studio() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [svgCode, setSvgCode] = useState<string>(`<svg width="100" height="100">
  <!-- SVG code here -->
</svg>`);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [svgName, setSvgName] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('PNG');
  const [selectedSize, setSelectedSize] = useState<ExportSize>('1x');
  const [exportSvg, setExportSvg] = useState<{
    content: string;
    title: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSvgId, setCurrentSvgId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [prompt, setPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I can help you create SVG graphics. Just describe what you want to create, and I'll generate it for you."
    }
  ]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("gpt");
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4-mini");
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [scale, setScale] = useState(1);
  const [category, setCategory] = useState<string>('cards');
  
  // 拖拽调整chat区域宽度
  const {
    width: chatWidth,
    isDragging: isChatDragging,
    handleMouseDown: handleChatResize,
    resetWidth: resetChatWidth
  } = useResizable({
    initialWidth: 400,
    minWidth: 300,
    maxWidth: 800,
    storageKey: 'studio-chat-width'
  });
  
  // 拖拽调整split模式下的编辑器宽度（百分比）
  const {
    percent: editorWidth,
    isDragging: isEditorDragging,
    handleMouseDown: handleEditorResize,
    resetPercent: resetEditorWidth
  } = useResizablePercent({
    initialPercent: 50,
    minPercent: 30,
    maxPercent: 70,
    storageKey: 'studio-editor-width'
  });

  // 在组件加载时检查 URL 参数
  useEffect(() => {
    const fetchSVG = async () => {
      if (id) {
        try {
          const response = await fetch(`/api/svgs/${id}/get`);
          const data = await response.json();
          
          if (response.ok) {
            setIsEditMode(true);
            setCurrentSvgId(data.id);
            setSvgName(data.title);
            setSvgCode(data.svg_content);
            setIsPublic(data.is_public);
            
            // 更新预览
            const blob = new Blob([data.svg_content], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            if (previewSrc) {
              URL.revokeObjectURL(previewSrc);
            }
            setPreviewSrc(url);
          } else {
            throw new Error(data.error || 'Failed to load SVG');
          }
        } catch (error) {
          console.error('Failed to fetch SVG:', error);
          toast({
            variant: "destructive",
            description: "Failed to load SVG content",
          });
        }
      }
    };

    fetchSVG();
  }, [id]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCodeChange = (newCode: string) => {
    setSvgCode(newCode);
    // 更新预览
    const blob = new Blob([newCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    if (previewSrc) {
      URL.revokeObjectURL(previewSrc);
    }
    setPreviewSrc(url);
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(svgCode);
        toast({
          description: "Copied to clipboard",
          className: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
        });
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = svgCode;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          textArea.remove();
          toast({
            description: "Copied to clipboard",
            className: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
          });
        } catch (err) {
          console.error("Failed to copy using execCommand:", err);
          textArea.remove();
          throw new Error("Unable to copy to clipboard");
        }
      }
    } catch (err) {
      console.error("Copy failed:", err);
      toast({
        variant: "destructive",
        description: "Failed to copy. Please try selecting and copying manually.",
      });
    }
  };

  const handleClear = () => {
    setSvgCode(`<svg width="100" height="100">
  <!-- SVG code here -->
</svg>`);
    setPreviewSrc(null);
  };

  const handleSave = async () => {
    if (!svgName.trim()) {
      setNameError(true);
      toast({
        variant: "destructive",
        description: "Please enter a name for your SVG",
      });
      return;
    }

    setIsSaving(true);
    try {
      const endpoint = isEditMode ? `/api/svgs/${currentSvgId}/update` : '/api/svg/create';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const saveRequest = async () => {
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: svgName,
            svg_content: svgCode,
            is_public: isPublic,
            description: category
          }),
        });

        // 检查响应是否有内容
        const contentType = response.headers.get('content-type');
        let data = null;
        
        if (contentType && contentType.includes('application/json')) {
          const text = await response.text();
          if (text.trim()) {
            try {
              data = JSON.parse(text);
            } catch (parseError) {
              console.error('JSON parse error:', parseError);
              throw new Error('Invalid response format');
            }
          }
        }

        if (!response.ok) {
          const errorMessage = data?.error || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        return { response, data };
      };

      const { response, data } = await withRetry(saveRequest, 2, 1000);

      // 检查是否是降级模式
      const isFallbackMode = response.headers.get('X-Fallback-Mode') === 'true';
      const storageType = response.headers.get('X-Storage-Type');
      
      if (!isEditMode && data?.id) {
        setIsEditMode(true);
        setCurrentSvgId(data.id);
        
        // 如果不是降级模式，才更新URL
        if (!isFallbackMode) {
          router.push(`/studio/${data.id}`);
        }
      }
      
      // 根据模式显示不同的成功消息
      let successMessage = isEditMode ? "SVG updated successfully" : "SVG saved successfully";
      let toastClassName = "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      
      if (isFallbackMode) {
        successMessage += " (offline mode)";
        toastClassName = "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
        
        // 如果是本地存储，保存到localStorage
        if (storageType === 'local' && data?.id) {
          const localSvgs = JSON.parse(localStorage.getItem('localSvgs') || '[]');
          const svgData = {
            id: data.id,
            title: svgName,
            svg_content: svgCode,
            is_public: isPublic,
            description: category,
            created_at: new Date().toISOString(),
            fallback: true
          };
          
          const existingIndex = localSvgs.findIndex((svg: any) => svg.id === data.id);
          if (existingIndex >= 0) {
            localSvgs[existingIndex] = svgData;
          } else {
            localSvgs.push(svgData);
          }
          
          localStorage.setItem('localSvgs', JSON.stringify(localSvgs));
          console.log('SVG saved to local storage:', data.id);
        }
      }
      
      toast({
        description: successMessage,
        className: toastClassName,
      });
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = handleNetworkError(error);
      toast({
        variant: "destructive",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentSvgId) return;

    try {
      const response = await fetch(`/api/svgs/${currentSvgId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          description: "SVG deleted successfully",
          className: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
        });
        router.push('/studio');
      } else {
        // 安全地解析JSON响应
        let errorMessage = 'Failed to delete SVG';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const text = await response.text();
            if (text.trim()) {
              const data = JSON.parse(text);
              errorMessage = data.error || errorMessage;
            }
          }
        } catch (parseError) {
          console.error('Error parsing delete response:', parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to delete SVG",
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleNewSVG = () => {
    setIsEditMode(false);
    setCurrentSvgId(null);
    setSvgName("");
    setSvgCode(`<svg width="100" height="100">
  <!-- SVG code here -->
</svg>`);
    setPreviewSrc(null);
    setIsPublic(true);
    setCategory('cards');
    router.push('/studio');
  };

  useEffect(() => {
    setIsClient(true);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsChatVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleResetZoom = () => {
    setScale(1);
  };



  return (
    <div className={cn(
      "relative flex h-[calc(100vh-4rem)] overflow-hidden",
      (isChatDragging || isEditorDragging) && "select-none"
    )}>
      {/* 左侧面板 */}
      <div 
        className={cn(
          "absolute left-0 top-0 h-full border-r bg-background flex flex-col transition-all duration-300 z-10",
          isChatVisible 
            ? "translate-x-0" 
            : "-translate-x-full"
        )}
        style={{
          width: isClient ? (isChatVisible ? `${chatWidth}px` : `${chatWidth}px`) : '300px'
        }}
      >
        <div className="flex-1 flex flex-col">
          <div className="h-14 border-b flex items-center justify-between px-4 bg-background">
            <h2 className="text-sm font-medium">Generation</h2>
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <Select
                value={selectedProvider}
                onValueChange={(value) => {
                  setSelectedProvider(value);
                  const provider = AI_MODELS.find(p => p.id === value);
                  if (provider) {
                    setSelectedModel(provider.models[0].id);
                  }
                }}
              >
                <SelectTrigger className="w-16 sm:w-20 md:w-24 h-9 bg-background border-input hover:bg-accent hover:text-accent-foreground text-xs">
                  <SelectValue placeholder="GPT" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
              >
                <SelectTrigger className="flex-1 min-w-0 h-9 bg-background border-input hover:bg-accent hover:text-accent-foreground text-xs">
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.find(p => p.id === selectedProvider)?.models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{model.name}</span>
                        {model.tags?.includes('premium') && (
                          <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-medium flex-shrink-0">
                            PRO
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex-1">
            <AIChat />
          </div>
        </div>
        
        {/* Chat区域拖拽手柄 */}
        {isChatVisible && (
          <div 
            className={cn(
              "absolute right-0 top-0 w-1 h-full cursor-col-resize group hover:bg-primary/20 transition-colors",
              isChatDragging && "bg-primary/30"
            )}
            onMouseDown={handleChatResize}
          >
            <div className="absolute top-1/2 -translate-y-1/2 right-0 w-3 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-0.5 h-4 bg-primary/60 rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {/* 右侧区域 */}
      <div 
        className={cn(
          "flex flex-col transition-all duration-300",
          !isChatVisible && "ml-0 w-full"
        )}
        style={{
          marginLeft: isClient ? (isChatVisible ? `${chatWidth}px` : '0') : '0',
          width: isClient ? (isChatVisible ? `calc(100% - ${chatWidth}px)` : '100%') : '100%'
        }}
      >
        {/* 顶部工具栏 */}
        <div className="h-16 border-b bg-gradient-to-r from-background via-background to-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 lg:px-6 h-full">
            {/* 左侧区域 - 项目信息 */}
            <div className="flex items-center gap-2 lg:gap-4">
              <Button
                variant="default"
                size="sm"
                onClick={handleNewSVG}
                className="h-10 px-3 lg:px-4 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">New</span>
              </Button>
              <div className="relative hidden sm:block">
                <Input 
                  placeholder="Enter SVG name..." 
                  className={cn(
                    "h-10 w-[200px] lg:w-[280px] pl-4 pr-4 border-2 transition-all duration-200 bg-background/50 backdrop-blur-sm",
                    "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                    nameError && "border-red-500 ring-2 ring-red-500/20 bg-red-50/50 dark:bg-red-900/10"
                  )}
                  value={svgName}
                  onChange={(e) => {
                    setSvgName(e.target.value);
                    if (nameError) setNameError(false);
                  }}
                />
              </div>
            </div>

            {/* 右侧区域 - 操作按钮组 */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* 文件操作组 */}
                <div className="flex items-center gap-1 lg:gap-1.5 px-1.5 lg:px-2 py-1 rounded-lg bg-muted/30 backdrop-blur-sm border border-border/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 lg:px-3 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 transition-colors"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.svg';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            const content = e.target?.result as string;
                            setSvgCode(content);
                            setViewMode('split');
                          };
                          reader.readAsText(file);
                        }
                      };
                      input.click();
                    }}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 lg:px-3 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/50 dark:hover:text-green-400 transition-colors"
                    onClick={handleCopy}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 lg:px-3 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/50 dark:hover:text-orange-400 transition-colors"
                    onClick={handleClear}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

               {/* 保存操作组 */}
                <div className="flex items-center gap-1 lg:gap-1.5 px-1.5 lg:px-2 py-1 rounded-lg bg-muted/30 backdrop-blur-sm border border-border/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 lg:px-3 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 transition-colors"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4" />
                    <span className="ml-1 lg:ml-1.5 text-xs hidden md:inline">{isSaving ? "Saving..." : isEditMode ? "Update" : "Save"}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 lg:px-3 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/50 dark:hover:text-purple-400 transition-colors"
                    onClick={() => setExportSvg({
                      content: svgCode,
                      title: svgName || 'Untitled'
                    })}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 lg:px-3 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition-colors hidden sm:flex"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={!currentSvgId}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

               {/* 视图控制组 */}
                <div className="flex items-center gap-1 lg:gap-1.5 px-1.5 lg:px-2 py-1 rounded-lg bg-muted/30 backdrop-blur-sm border border-border/50">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 px-2 lg:px-3 transition-colors",
                            isChatVisible 
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" 
                              : "hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-950/50 dark:hover:text-slate-400"
                          )}
                          onClick={() => setIsChatVisible(!isChatVisible)}
                        >
                          {isChatVisible ? (
                            <SplitSquareVertical className="h-4 w-4" />
                          ) : (
                            <PanelLeft className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="flex items-center gap-2">
                        <span>{isChatVisible ? "Hide chat panel" : "Show chat panel"}</span>
                        <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium opacity-100">
                          <span className="text-xs">⌘</span>J
                        </kbd>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                    <SelectTrigger className="w-[100px] lg:w-[120px] h-8 px-2 lg:px-3 border-0 bg-transparent hover:bg-accent/50 transition-colors">
                      <SelectValue placeholder="Split" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          <span className="hidden sm:inline">Code</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="preview">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Preview</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="split">
                        <div className="flex items-center gap-2">
                          <Columns className="h-4 w-4" />
                          <span className="hidden sm:inline">Split</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>


             </div>
           </div>
         </div>

        {/* 编辑器和预览区 */}
        <div className="flex-1 flex pb-4">
          {/* 根据视图模式显示不同布局 */}
          {viewMode === 'code' && (
            <div className="w-full border-b">
              <CodeEditor value={svgCode} onChange={handleCodeChange} />
            </div>
          )}
          {viewMode === 'preview' && (
            <div className="w-full flex flex-col">
              {/* 预览区顶部控制栏 */}
              <div className="h-10 px-3 border-b flex items-center justify-between bg-muted/5">
                <div className="flex items-center gap-4">
                  <RadioGroup
                    value={isPublic ? 'public' : 'private'}
                    onValueChange={(value: RadioValue) => setIsPublic(value === 'public')}
                    className="flex items-center gap-1"
                  >
                    <div className="flex items-center">
                      <RadioGroupItem value="private" id="private" className="h-3.5 w-3.5" />
                      <Label htmlFor="private" className="text-xs font-medium ml-1.5 text-muted-foreground">
                        Personal
                      </Label>
                    </div>
                    <div className="flex items-center ml-3">
                      <RadioGroupItem value="public" id="public" className="h-3.5 w-3.5" />
                      <Label htmlFor="public" className="text-xs font-medium ml-1.5 text-muted-foreground">
                        Public
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="flex items-center gap-2 pl-3 border-l">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Select
                              value={category}
                              onValueChange={setCategory}
                            >
                              <SelectTrigger className="w-[120px] h-7 text-xs bg-transparent hover:bg-accent transition-colors">
                                <div className="flex items-center gap-2">
                                  {category === 'cards' && <LayoutTemplate className="h-3.5 w-3.5" />}
                                  {category === 'icons' && <Component className="h-3.5 w-3.5" />}
                                  {category === 'logos' && <Palette className="h-3.5 w-3.5" />}
                                  {category === 'elements' && <Shapes className="h-3.5 w-3.5" />}
                                  {category === 'symbols' && <Hash className="h-3.5 w-3.5" />}
                                  {category === 'others' && <MoreHorizontal className="h-3.5 w-3.5" />}
                                  <SelectValue placeholder="Select category" />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map((cat) => (
                                  <SelectItem 
                                    key={cat.value} 
                                    value={cat.value}
                                    className="text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      {cat.value === 'cards' && <LayoutTemplate className="h-3.5 w-3.5" />}
                                      {cat.value === 'icons' && <Component className="h-3.5 w-3.5" />}
                                      {cat.value === 'logos' && <Palette className="h-3.5 w-3.5" />}
                                      {cat.value === 'elements' && <Shapes className="h-3.5 w-3.5" />}
                                      {cat.value === 'symbols' && <Hash className="h-3.5 w-3.5" />}
                                      {cat.value === 'others' && <MoreHorizontal className="h-3.5 w-3.5" />}
                                      {cat.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          <p>Categorize your SVG for better organization</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleZoomOut}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={handleResetZoom}
                    >
                      {Math.round(scale * 100)}%
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleZoomIn}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7 rounded-md hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setIsPreviewModalOpen(true)}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 预览内容 */}
              <div className="flex-1 p-4">
                <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg border-muted bg-white dark:bg-white overflow-auto">
                  <div 
                    className="transform origin-center transition-transform duration-200"
                    style={{ transform: `scale(${scale})` }}
                  >
                    {previewSrc ? (
                      <img 
                        src={previewSrc} 
                        alt="SVG Preview" 
                        className="max-w-full max-h-full"
                      />
                    ) : (
                      <p className="text-muted-foreground">SVG Preview</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 使用 SVGPreviewModal 组件 */}
              <SVGPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                svg={{
                  title: svgName || 'Untitled',
                  svg_content: svgCode
                }}
              />
            </div>
          )}
          {viewMode === 'split' && (
            <>
              <div 
                className="border-r border-b"
                style={{ width: isClient ? `${editorWidth}%` : '50%' }}
              >
                <CodeEditor value={svgCode} onChange={handleCodeChange} />
              </div>
              
              {/* Interactive divider with resize handle */}
              <div 
                className={cn(
                  "relative cursor-col-resize group w-1 hover:bg-primary/20 transition-colors",
                  isEditorDragging && "bg-primary/30"
                )}
                onMouseDown={handleEditorResize}
              >
                <div className="absolute inset-y-0 -left-px w-[2px] bg-gradient-to-b from-primary/10 via-primary/30 to-primary/10 dark:from-primary/5 dark:via-primary/20 dark:to-primary/5 group-hover:from-primary/20 group-hover:via-primary/50 group-hover:to-primary/20 transition-all duration-200"></div>
                
                {/* Drag handle indicator */}
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-4 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="h-4 w-1 rounded-full bg-primary/50 dark:bg-primary/40"></div>
                </div>
              </div>
              
              <div 
                className="flex flex-col"
                style={{ width: isClient ? `${100 - editorWidth}%` : '50%' }}
              >
                {/* Split 模式下的预览区顶部控制栏 */}
                <div className="h-12 px-4 border-b flex items-center justify-between bg-gradient-to-r from-background via-muted/10 to-background backdrop-blur-sm">
                  <div className="flex items-center gap-6">
                    {/* Personal/Public 单选按钮组 */}
                    <RadioGroup
                      value={isPublic ? 'public' : 'private'}
                      onValueChange={(value: RadioValue) => setIsPublic(value === 'public')}
                      className="flex items-center gap-1"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="private" id="private" className="sr-only" />
                        <Label 
                          htmlFor="private" 
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-all duration-200",
                            !isPublic 
                              ? "bg-primary text-primary-foreground" 
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          Personal
                        </Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="public" id="public" className="sr-only" />
                        <Label 
                          htmlFor="public" 
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-all duration-200",
                            isPublic 
                              ? "bg-primary text-primary-foreground" 
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          Public
                        </Label>
                      </div>
                    </RadioGroup>

                    {/* Category 选择器 */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground">Category</span>
                      <Select
                        value={category}
                        onValueChange={setCategory}
                      >
                        <SelectTrigger className="w-[120px] h-7 text-xs border focus:ring-1 focus:ring-primary/50">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value} className="text-xs">
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* 缩放控制按钮组 */}
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none border-r hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={handleZoomOut}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs rounded-none border-r hover:bg-primary/10 hover:text-primary transition-colors font-medium min-w-[50px]"
                        onClick={handleResetZoom}
                      >
                        {Math.round(scale * 100)}%
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={handleZoomIn}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* 全屏按钮 */}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 rounded-lg border hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => setIsPreviewModalOpen(true)}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 预览内容 */}
                <div className="flex-1 p-4">
                  <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg border-muted bg-white dark:bg-white overflow-auto">
                    <div 
                      className="transform origin-center transition-transform duration-200"
                      style={{ transform: `scale(${scale})` }}
                    >
                      {previewSrc ? (
                        <img 
                          src={previewSrc} 
                          alt="SVG Preview" 
                          className="max-w-full max-h-full"
                        />
                      ) : (
                        <p className="text-muted-foreground">SVG Preview</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 使用 SVGPreviewModal 组件 */}
                <SVGPreviewModal
                  isOpen={isPreviewModalOpen}
                  onClose={() => setIsPreviewModalOpen(false)}
                  svg={{
                    title: svgName || 'Untitled',
                    svg_content: svgCode
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 拖拽时的全局覆盖层 */}
      {(isChatDragging || isEditorDragging) && (
        <div className="fixed inset-0 z-50 cursor-col-resize bg-black/5 backdrop-blur-[1px]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              {isChatDragging ? 'Resizing chat panel...' : 'Resizing editor...'}
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogTitle>Delete SVG</DialogTitle>
          <p>Are you sure you want to delete this SVG? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 在组件末尾添加 SVGExportModal */}
      {exportSvg && (
        <SVGExportModal
          isOpen={!!exportSvg}
          onClose={() => setExportSvg(null)}
          svg={exportSvg}
        />
      )}
    </div>
  );
}