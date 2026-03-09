'use client';

import { useEffect, useState, memo } from 'react';
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, Download, MoreHorizontal, Plus, Edit, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from 'swr';
import { cn } from "@/lib/utils";
import { SVGPreviewModal } from "@/components/svg-preview-modal";
import { SVGPreview } from "@/components/svg-preview";
import { useRouter } from "next/navigation";
import { SVGExportModal } from "@/components/svg-export-modal";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import dynamic from 'next/dynamic';

interface MySVGsData {
  items: Array<{
    id: string;
    title: string;
    description: string | null;
    svg_content: string;
    created_at: string;
    is_public: boolean;
    is_official: boolean;
    view_count: number;
    like_count: number;
    creator_name: string;
    creator_avatar: string | null;
  }>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

const fetcher = (url: string) => fetch(url, {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache'
  }
}).then(res => res.json());

// 添加随机颜色成函数
const getRandomColor = () => {
  const colors = [
    'shadow-blue-500/30 border-blue-500/50',
    'shadow-purple-500/30 border-purple-500/50',
    'shadow-pink-500/30 border-pink-500/50',
    'shadow-orange-500/30 border-orange-500/50',
    'shadow-green-500/30 border-green-500/50',
    'shadow-cyan-500/30 border-cyan-500/50',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// 计算每页显示的项目数（网格视图为15项 + 1个新增按钮 = 4行x4列，列表视图为10项）
const getPageSize = () => 15;

// Define prop types for SvgCard component
interface SvgCardProps {
  svg: {
    id: string;
    title: string;
    description: string | null;
    svg_content: string;
    created_at: string;
    is_public: boolean;
    is_official: boolean;
    view_count: number;
    like_count: number;
    creator_name: string;
    creator_avatar: string | null;
  };
  index: number;
  onCardClick: () => void;
  onEdit: () => void;
  onExport: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}

// 将SVG卡片封装为记忆化组件
const SvgCard = memo(({ svg, index, onCardClick, onEdit, onExport, onDelete, onToggleVisibility }: SvgCardProps) => {
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const [hoverColors, setHoverColors] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);

  // 处理悬浮状态，为每个卡片分配随机颜色
  const handleHoverStart = (id: string) => {
    setIsHovered(id);
    if (!hoverColors[id]) {
      setHoverColors(prev => ({
        ...prev,
        [id]: getRandomColor()
      }));
    }
  };

  // Replace direct window access with useEffect
  useEffect(() => {
    // This code only runs on the client
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <motion.div
      key={svg.id}
      initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: isMobile ? 0 : index * 0.02, // 移动设备上减少或删除延迟
        duration: isMobile ? 0.2 : 0.3 
      }}
      whileHover={isMobile ? undefined : { y: -5 }} // 移动设备上不使用悬停动画
      onHoverStart={() => handleHoverStart(svg.id)}
      onHoverEnd={() => setIsHovered(null)}
    >
      <Card 
        className={cn(
          "overflow-hidden h-[360px] transition-all duration-300 cursor-pointer",
          isHovered === svg.id && `shadow-2xl ${hoverColors[svg.id]}`
        )}
        onClick={onCardClick}
      >
        <CardContent className="p-0 h-full flex flex-col">
          {/* SVG 预览 */}
          <div className="relative h-[265px] bg-white">
            <div className="absolute inset-0">
              <SVGPreview content={svg.svg_content} className="p-4" />
            </div>
          </div>

          {/* 信息区域 */}
          <div className="p-4 border-t h-[95px]">
            <div className="flex flex-col justify-between h-full">
              {/* 标题和开关按钮区域 */}
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium truncate">{svg.title}</h3>
                  {svg.is_official && (
                    <div className="flex items-center px-1.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm">
                      <div className="flex items-center justify-center w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-2 h-2 text-white"
                        >
                          <path d="M9 12l2 2 4-4" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent ml-0.5">Official</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={svg.is_public}
                    onCheckedChange={onToggleVisibility}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span 
                    className={cn(
                      "text-xs font-medium transition-colors duration-300",
                      svg.is_public 
                        ? "text-green-600" 
                        : "text-gray-600"
                    )}
                  >
                    {svg.is_public ? "公开" : "个人"}
                  </span>
                </div>
              </div>

              {/* 日期和操作按钮区域 */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(svg.created_at).toLocaleDateString()}
                </span>
                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      // 处理点赞
                    }}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExport();
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

// Add display name
SvgCard.displayName = 'SvgCard';

// Define interfaces for the modal components
interface SVGPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  svg: {
    title: string;
    svg_content: string;
  };
}

interface SVGExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  svg: {
    content: string;
    title: string;
  };
}

// Fix dynamic imports
const SVGPreviewModalDynamic = dynamic<SVGPreviewModalProps>(
  () => import('@/components/svg-preview-modal').then(mod => mod.SVGPreviewModal), 
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  }
);

const SVGExportModalDynamic = dynamic<SVGExportModalProps>(
  () => import('@/components/svg-export-modal').then(mod => mod.SVGExportModal), 
  {
    ssr: false
  }
);

// 在组件外部定义一个 key 常量，用于一致性
const SVG_LIST_KEY = '/api/my-svgs';

export default function MySvgs() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedSvg, setSelectedSvg] = useState<{
    title: string;
    svg_content: string;
  } | null>(null);
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const [hoverColors, setHoverColors] = useState<Record<string, string>>({});
  const [exportSvg, setExportSvg] = useState<{
    content: string;
    title: string;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pageInput, setPageInput] = useState('');
  
  // 每页显示的项目数
  const pageSize = getPageSize();

  // 处理悬浮状态，为每个卡片分配随机颜色
  const handleHoverStart = (id: string) => {
    setIsHovered(id);
    if (!hoverColors[id]) {
      setHoverColors(prev => ({
        ...prev,
        [id]: getRandomColor()
      }));
    }
  };

  // 修改 SWR 的使用，添加分页参数和搜索参数
  const { data, error, isLoading, mutate } = useSWR<MySVGsData>(
    session?.user ? `${SVG_LIST_KEY}?filter=${filter}&sort=${sort}&search=${encodeURIComponent(searchQuery)}&page=${page}&pageSize=${pageSize}` : null,
    fetcher,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false
    }
  );

  // 当视图切换时重置为第一页
  useEffect(() => {
    setPage(1);
  }, [filter, sort]);

  // 分开处理不同类型的日志
  useEffect(() => {
    if (session) {
      console.log('Session:', session);
    }
  }, [session]);

  useEffect(() => {
    if (data) {
      console.log('Data:', data);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      console.error('Error:', error);
    }
  }, [error]);

  useEffect(() => {
    console.log('Loading:', isLoading);
  }, [isLoading]);

  // 添加认证检查
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // 处理数据加载错误
  if (error) {
    console.error('Error loading SVGs:', error);
  }

  // 如果正在加载或未认证，显示加载状态
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 处理页面变化
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && (!data?.pagination.totalPages || newPage <= data.pagination.totalPages)) {
      setPage(newPage);
      setPageInput(''); // 清空输入框
      // 页面滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 处理页码输入
  const handlePageInputChange = (value: string) => {
    // 只允许数字输入
    if (value === '' || /^\d+$/.test(value)) {
      setPageInput(value);
    }
  };

  // 处理页码输入提交
  const handlePageInputSubmit = () => {
    const inputPage = parseInt(pageInput);
    if (inputPage && inputPage >= 1 && inputPage <= (data?.pagination.totalPages || 1)) {
      handlePageChange(inputPage);
    } else {
      setPageInput(''); // 清空无效输入
      toast.error(`请输入1到${data?.pagination.totalPages || 1}之间的页码`);
    }
  };

  // 处理回车键提交
  const handlePageInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
    }
  };

  // 在渲染部分添加调试信息
  console.log('Render state:', { isLoading, error, hasData: !!data });

  // 修改删除处理函数
  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/my-svgs/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // 修复 toast.custom 的类型问题
        toast.custom((t) => (
          <div className={`rounded-md px-6 py-3 shadow-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm animate-enter`}>
            SVG 删除成功
          </div>
        ));
        
        // 强制重新获取数据，确保页面刷新
        await mutate(); 
        
        // 如果上面的mutate()不工作，可以尝试这种方式：
        // mutate(`${SVG_LIST_KEY}?filter=${filter}&sort=${sort}&page=${page}&pageSize=${pageSize}`);
        
        setDeleteId(null);
      } else {
        const error = await response.json();
        toast.error(error.error || '删除 SVG 失败');
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
      toast.error('删除时发生错误');
    } finally {
      setIsDeleting(false);
    }
  };

  // 添加切换可见性的处理函数
  const toggleVisibility = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/my-svgs/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_public: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('更新可见性失败');
      }

      await mutate(); // 刷新数据
      toast.success('可见性更新成功');
    } catch (error) {
      toast.error('更新可见性失败');
    }
  };

  // 生成分页组件
  const renderPagination = () => {
    if (!data?.pagination || data.pagination.totalPages <= 1) return null;
    
    const { page: currentPage, totalPages } = data.pagination;
    
    // 计算需要显示的页码范围
    let pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      // 如果总页数不多，显示所有页码
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      // 显示当前页附近的页码和首尾页码
      pages = [1];
      
      if (currentPage > 3) {
        pages.push('ellipsis');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      
      pages.push(totalPages);
    }
    
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {/* 主分页控件 */}
        <Pagination className="my-4">
          <PaginationContent>
            {/* 首页按钮 */}
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="h-9 w-9 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>
            
            {/* 上一页按钮 */}
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(currentPage - 1)}
                className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            
            {/* 页码按钮 */}
            {pages.map((p, idx) => 
              p === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === currentPage}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            
            {/* 下一页按钮 */}
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(currentPage + 1)}
                className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            
            {/* 末页按钮 */}
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="h-9 w-9 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        
        {/* 页码输入框 - 移到同一行 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
          <span>跳转到</span>
          <Input
            type="text"
            value={pageInput}
            onChange={(e) => handlePageInputChange(e.target.value)}
            onKeyPress={handlePageInputKeyPress}
            placeholder={currentPage.toString()}
            className="w-16 h-8 text-center"
          />
          <span>/ {totalPages} 页</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePageInputSubmit}
            disabled={!pageInput}
            className="h-8 px-3"
          >
            跳转
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        {/* 工具栏 */}
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b">
          <div className="px-4 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* 搜索框 */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索 SVG..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1); // 重置到第一页
                  }}
                  className="pl-10 h-9 bg-background/50 border-border/50 focus:bg-background focus:border-border"
                />
              </div>
              
              {/* 筛选器和排序器 */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                {/* 过滤器 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden md:inline whitespace-nowrap">筛选:</span>
                  <Select value={filter} onValueChange={(value) => {
                    setFilter(value);
                    setPage(1); // 重置到第一页
                  }}>
                    <SelectTrigger className="h-9 w-full sm:w-[130px] text-sm bg-background/50 border-border/50 hover:bg-background hover:border-border">
                      <SelectValue placeholder="所有 SVG" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有 SVG</SelectItem>
                      <SelectItem value="published">已发布</SelectItem>
                      <SelectItem value="private">私有</SelectItem>
                      <SelectItem value="shared">共享</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 排序选项 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden md:inline whitespace-nowrap">排序:</span>
                  <Select value={sort} onValueChange={(value) => {
                    setSort(value);
                    setPage(1); // 重置到第一页
                  }}>
                    <SelectTrigger className="h-9 w-full sm:w-[130px] text-sm bg-background/50 border-border/50 hover:bg-background hover:border-border">
                      <SelectValue placeholder="最近" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">最近</SelectItem>
                      <SelectItem value="name">名称 (A-Z)</SelectItem>
                      <SelectItem value="created">创建日期</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-4">
          {/* Always use grid view */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 新建文件夹卡片 */}
            <div 
              className="border-2 border-dashed rounded-lg hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => router.push('/studio')}
            >
              <div className="w-full h-full p-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="h-6 w-6" />
                  </div>
                  <span className="font-medium">新建 SVG</span>
                </div>
              </div>
            </div>

            {/* SVG 卡片 */}
            <AnimatePresence>
              {isLoading ? (
                // 网格加载状态
                Array(8).fill(0).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="overflow-hidden h-[300px]">
                      <CardContent className="p-0 h-full">
                        <Skeleton className="h-[225px]" />
                        <div className="p-4">
                          <Skeleton className="h-4 w-2/3 mb-2" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : error ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-red-500">
                    {error instanceof Error ? error.message : '加载 SVG 失败'}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()} 
                    className="mt-4"
                  >
                    重试
                  </Button>
                </div>
              ) : !data?.items ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">暂无数据</p>
                </div>
              ) : data.items.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">未找到 SVG</p>
                </div>
              ) : (
                data.items.map((svg, index) => (
                  <SvgCard 
                    key={svg.id}
                    svg={svg}
                    index={index}
                    onCardClick={() => setSelectedSvg({
                      title: svg.title,
                      svg_content: svg.svg_content,
                    })}
                    onEdit={() => router.push(`/studio/${svg.id}`)}
                    onExport={() => setExportSvg({ 
                      content: svg.svg_content,
                      title: svg.title
                    })}
                    onDelete={() => setDeleteId(svg.id)}
                    onToggleVisibility={() => toggleVisibility(svg.id, svg.is_public)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
          
          {/* 分页控件 */}
          {!isLoading && !error && data?.items && data.items.length > 0 && (
            <div className="flex justify-center mt-8">
              {renderPagination()}
            </div>
          )}
        </div>
      </div>

      {/* SVG 预览弹窗 */}
      {selectedSvg && (
        <SVGPreviewModalDynamic
          isOpen={!!selectedSvg}
          onClose={() => setSelectedSvg(null)}
          svg={selectedSvg}
        />
      )}

      {/* 导出弹窗 */}
      {exportSvg && (
        <SVGExportModalDynamic
          isOpen={!!exportSvg}
          onClose={() => setExportSvg(null)}
          svg={exportSvg}
        />
      )}

      {/* 添加确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除吗？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。这将永久删除您的 SVG。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) handleDelete(deleteId);
              }}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="mr-2">删除中</span>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </>
              ) : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}