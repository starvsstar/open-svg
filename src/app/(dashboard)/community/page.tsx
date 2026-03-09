'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Download, Share2, Sparkles, TrendingUp, Clock, Search, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from 'swr';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SVGPreviewModal } from "@/components/svg-preview-modal";
import { SVGExportModal } from "@/components/svg-export-modal";

interface CommunityData {
  items: Array<{
    id: string;
    title: string;
    description: string | null;
    svg_content: string;
    view_count: number;
    like_count: number;
    share_count: number;
    created_at: string;
    creator_name: string;
    creator_avatar: string | null;
    isLiked: boolean;
    is_official: boolean;
  }>;
  total: number;
  page: number;
  totalPages: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface SVGDisplayProps {
  content: string;
}

function SVGDisplay({ content }: SVGDisplayProps) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(content, 'image/svg+xml');
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
  }, [content]);

  if (!dimensions) {
    return <div className="w-full h-[330px] bg-white animate-pulse" />;
  }

  const cleanedSvg = content
    .replace(/<svg([^>]*)>/, (match, attributes) => {
      const preservedAttributes = attributes
        .replace(/width="[^"]*"/, '')
        .replace(/height="[^"]*"/, '')
        .replace(/style="[^"]*"/, '');
      return `<svg${preservedAttributes}>`;
    });

  return (
    <div className="relative w-full h-[330px] bg-white">
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          dangerouslySetInnerHTML={{ 
            __html: cleanedSvg.replace(
              /<svg/, 
              `<svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 ${dimensions.width} ${dimensions.height}" style="max-width: 100%; max-height: 100%; width: auto; height: auto;"`
            )
          }}
          className="w-full h-full flex items-center justify-center"
        />
      </div>
    </div>
  );
}

// 添加随机颜色生成函数
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

export default function Community() {
  const [sort, setSort] = useState<'latest' | 'popular' | 'likes' | 'shares'>('latest');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const [hoverColors, setHoverColors] = useState<Record<string, string>>({});
  const [selectedSvg, setSelectedSvg] = useState<{
    title: string;
    svg_content: string;
  } | null>(null);
  const [exportSvg, setExportSvg] = useState<{
    content: string;
    title: string;
  } | null>(null);
  const [isOfficialOnly, setIsOfficialOnly] = useState(false);
  const [pageInput, setPageInput] = useState('');

  const { data, error, isLoading, mutate } = useSWR<CommunityData>(
    `/api/community?page=${page}&sort=${sort}${searchTerm ? `&search=${searchTerm}` : ''}${selectedTag ? `&tag=${selectedTag}` : ''}${isOfficialOnly ? '&official=true' : ''}`,
    fetcher
  );

  const handleLike = async (svgId: string) => {
    try {
      const response = await fetch(`/api/community/${svgId}/like`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to like SVG');
      }

      const result = await response.json();

      // 立即更新本地数据
      mutate(async (currentData) => {
        if (!currentData) return currentData;
        
        const updatedItems = currentData.items.map(item => {
          if (item.id === svgId) {
            return {
              ...item,
              like_count: result.like_count,
              isLiked: result.isLiked
            };
          }
          return item;
        });

        return {
          ...currentData,
          items: updatedItems
        };
      }, false);

    } catch (error) {
      console.error('Error liking SVG:', error);
    }
  };

  const handleShare = async (svgId: string) => {
    try {
      const response = await fetch(`/api/community/${svgId}/share`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to share SVG');
      }

      const result = await response.json();

      // 更新本地数据
      mutate(async (currentData) => {
        if (!currentData) return currentData;
        
        const updatedItems = currentData.items.map(item => {
          if (item.id === svgId) {
            return {
              ...item,
              share_count: result.share_count,
            };
          }
          return item;
        });

        return {
          ...currentData,
          items: updatedItems
        };
      }, false);

    } catch (error) {
      console.error('Error sharing SVG:', error);
    }
  };

  const trendingTags = [
    { name: '图标', value: 'Icons', icon: Sparkles },
    { name: '插图', value: 'Illustrations', icon: TrendingUp },
    { name: '动画', value: 'Animated', icon: Clock },
    { name: 'UI元素', value: 'UI Elements', icon: Search },
  ];

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

  // 处理页面变化
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && (!data?.totalPages || newPage <= data.totalPages)) {
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
    if (inputPage && inputPage >= 1 && inputPage <= (data?.totalPages || 1)) {
      handlePageChange(inputPage);
    } else {
      setPageInput(''); // 清空无效输入
    }
  };

  // 处理回车键提交
  const handlePageInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 可滚动的内容区域 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-7xl mx-auto p-6">
          {/* 标题区域 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">社区作品</h1>
            <p className="text-muted-foreground text-sm">
              发现并从我们社区的精彩SVG中获得灵感
            </p>
          </motion.div>

          {/* 搜索和过滤区域 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* 左侧：搜索框 */}
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="搜索SVG..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* 右侧：筛选控件 */}
              <div className="flex flex-wrap gap-3 items-center">
                <Button
                  variant={isOfficialOnly ? "default" : "outline"}
                  size="sm"
                  className="h-9 px-4 rounded-md transition-all hover:scale-105"
                  onClick={() => setIsOfficialOnly(!isOfficialOnly)}
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  官方
                </Button>

                <Select 
                  value={selectedTag || 'all'} 
                  onValueChange={(value) => {
                    if (value === 'all' || value === selectedTag) {
                      setSelectedTag(null);
                    } else {
                      setSelectedTag(value);
                    }
                  }}
                >
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <span>全部分类</span>
                      </div>
                    </SelectItem>
                    {trendingTags.map((tag) => (
                      <SelectItem key={tag.value} value={tag.value}>
                        <div className="flex items-center gap-2">
                          <tag.icon className="w-4 h-4" />
                          {tag.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={sort} 
                  onValueChange={(value: 'latest' | 'popular' | 'likes' | 'shares') => setSort(value)}
                >
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="排序" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">最新</SelectItem>
                    <SelectItem value="popular">最多浏览</SelectItem>
                    <SelectItem value="likes">最多点赞</SelectItem>
                    <SelectItem value="shares">最多分享</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* SVG网格区域 */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {Array(6).fill(0).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        <Skeleton className="aspect-square" />
                        <div className="p-4">
                          <Skeleton className="h-6 w-2/3 mb-3" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <p className="text-red-500">加载SVG失败</p>
                <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                  重试
                </Button>
              </motion.div>
            ) : data?.items.length ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {data.items.map((svg, index) => (
                  <motion.div
                    key={svg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    onHoverStart={() => handleHoverStart(svg.id)}
                    onHoverEnd={() => setIsHovered(null)}
                  >
                    <Card 
                      className={cn(
                        "overflow-hidden transition-all duration-300 cursor-pointer",
                        isHovered === svg.id && `shadow-2xl ${hoverColors[svg.id]}`
                      )}
                      onClick={() => setSelectedSvg({
                        title: svg.title,
                        svg_content: svg.svg_content,
                      })}
                    >
                      <CardContent className="p-0">
                        {/* SVG标题在顶部 */}
                        <div className="px-4 py-3 border-b bg-white">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {svg.title}
                          </h3>
                        </div>
                        
                        {/* SVG预览区域 */}
                        <div className="relative">
                          <SVGDisplay content={svg.svg_content} />
                        </div>

                        {/* 底部信息区域 */}
                        <div className="p-4 border-t bg-gray-50">
                          <div className="flex items-center justify-between">
                            {/* 左侧：创建人信息和时间 */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  {svg.is_official ? (
                                    <AvatarImage src="/logo.svg" alt="Official" />
                                  ) : (
                                    <AvatarImage src={svg.creator_avatar || undefined} />
                                  )}
                                  <AvatarFallback>
                                    {svg.is_official ? "O" : svg.creator_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className={cn(
                                  "text-sm line-clamp-1",
                                  svg.is_official 
                                    ? "text-primary font-medium" 
                                    : "text-muted-foreground"
                                )}>
                                  {svg.is_official ? "SVG官方" : svg.creator_name}
                                </span>
                                {svg.is_official && (
                                  <svg
                                    className="h-4 w-4 text-blue-500"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(svg.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {/* 右侧：下载和收藏按钮 */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-600">
                                  {svg.like_count || 0}
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className={cn(
                                    "h-7 w-7",
                                    "transition-colors",
                                    svg.isLiked && "text-red-500"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLike(svg.id);
                                  }}
                                >
                                  <Heart className={cn(
                                    "h-4 w-4",
                                    svg.isLiked && "fill-current"
                                  )} />
                                </Button>
                              </div>
                              
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExportSvg({ 
                                    content: svg.svg_content,
                                    title: svg.title
                                  });
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <p className="text-muted-foreground">No SVGs found</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 分页控件 */}
          {data && data.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mt-8"
            >
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
                        disabled={page === 1}
                        className="h-9 w-9 p-0"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
                    
                    {/* 上一页按钮 */}
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(page - 1)}
                        className={cn(page === 1 && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>
                    
                    {/* 页码按钮 */}
                    {(() => {
                      const currentPage = page;
                      const totalPages = data.totalPages;
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
                      
                      return pages.map((p, idx) => 
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
                      );
                    })()}
                    
                    {/* 下一页按钮 */}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(page + 1)}
                        className={cn(page === data.totalPages && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>
                    
                    {/* 末页按钮 */}
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(data.totalPages)}
                        disabled={page === data.totalPages}
                        className="h-9 w-9 p-0"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                
                {/* 页码输入框 */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                  <span>跳转到</span>
                  <Input
                    type="text"
                    value={pageInput}
                    onChange={(e) => handlePageInputChange(e.target.value)}
                    onKeyPress={handlePageInputKeyPress}
                    placeholder={page.toString()}
                    className="w-16 h-8 text-center"
                  />
                  <span>/ {data.totalPages} 页</span>
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
            </motion.div>
          )}
        </div>
      </div>

      {/* 添加预览弹窗 */}
      {selectedSvg && (
        <SVGPreviewModal
          isOpen={!!selectedSvg}
          onClose={() => setSelectedSvg(null)}
          svg={selectedSvg}
        />
      )}

      {/* 导出弹窗 */}
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