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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Download, Share2, Sparkles, TrendingUp, Clock, Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from 'swr';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SVGPreviewModal } from "@/components/svg-preview-modal";
import { SVGExportModal } from "@/components/svg-export-modal";
import Image from 'next/image';
import Link from 'next/link';
import { UserNav } from "@/components/layout/UserNav";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "next-auth/react";

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

// 在文件开头的地方添加 Random 选项
const sortOptions = [
  { value: 'random', label: 'Random' },
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Most Viewed' },
  { value: 'likes', label: 'Most Liked' },
  { value: 'shares', label: 'Most Shared' }
];

export default function Templates() {
  const [sort, setSort] = useState<'random' | 'latest' | 'popular' | 'likes' | 'shares'>('random');
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
  const [searchInput, setSearchInput] = useState('');

  const { data, error, isLoading, mutate } = useSWR<CommunityData>(
    `/api/community?page=${page}&sort=${sort}${searchTerm ? `&search=${searchTerm}` : ''}${selectedTag ? `&tag=${selectedTag}` : ''}`,
    fetcher
  );

  const { data: session } = useSession();

  const handleLike = async (svgId: string) => {
    try {
      const response = await fetch(`/api/community/${svgId}/like`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to like SVG');
      }

      const result = await response.json();

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
    { name: 'Icons', icon: Sparkles },
    { name: 'Illustrations', icon: TrendingUp },
    { name: 'Animated', icon: Clock },
    { name: 'UI Elements', icon: Search },
  ];

  const handleHoverStart = (id: string) => {
    setIsHovered(id);
    if (!hoverColors[id]) {
      setHoverColors(prev => ({
        ...prev,
        [id]: getRandomColor()
      }));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed w-full bg-background/80 backdrop-blur-sm border-b z-50">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Logo" width={24} height={24} />
            <span className="text-lg font-medium">SVG Studio</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <ThemeToggle />
            {session ? (
              <UserNav />
            ) : (
              <Link 
                href="/login" 
                className="text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* 主要内容区域 - 添加 pt-20 来为固定定位的 header 留出空间 */}
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-7xl mx-auto p-6">
          {/* 搜索和过滤区域 */}
          <div className="mb-8">
            <div className="bg-card rounded-lg border shadow-sm p-4">
              {/* 搜索和排序区域 */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                {/* 搜索框 */}
                <form 
                  onSubmit={handleSearch}
                  className="flex-1"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search templates..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full pl-10 pr-20"
                    />
                    <Button 
                      type="submit" 
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    >
                      Search
                    </Button>
                  </div>
                </form>

                {/* 排序选择器 */}
                <div className="flex items-center gap-2 min-w-[200px]">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Sort by:
                  </span>
                  <Select 
                    value={sort} 
                    onValueChange={(value: 'random' | 'latest' | 'popular' | 'likes' | 'shares') => setSort(value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue>
                        {sortOptions.find(option => option.value === sort)?.label || 'Sort by'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 分割线 */}
              <div className="h-px bg-border mb-4" />

              {/* 标签过滤区域 */}
              {/*
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Filter:</span>
                  <div className="flex flex-wrap gap-2">
                    {trendingTags.map((tag) => (
                      <Button
                        key={tag.name}
                        variant={selectedTag === tag.name ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "rounded-full transition-all",
                          selectedTag === tag.name 
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "hover:bg-muted"
                        )}
                        onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
                      >
                        <tag.icon className="w-4 h-4 mr-2" />
                        {tag.name}
                        {selectedTag === tag.name && (
                          <X 
                            className="w-4 h-4 ml-2 hover:text-red-500" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTag(null);
                            }}
                          />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedTag && (
                  <>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedTag(null)}
                      >
                        Clear filter
                      </Button>
                    </div>
                  </>
                )}
              </div>
              */}
            </div>
          </div>

          {/* SVG网格域 */}
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
                <p className="text-red-500">Failed to load templates</p>
                <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                  Try Again
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
                        <div className="relative">
                          <SVGDisplay content={svg.svg_content} />
                          
                          <div className="py-2 px-4 border-t bg-gray-50 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900 truncate mr-4">
                              {svg.title}
                            </span>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">
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

                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">
                                  {svg.share_count || 0}
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShare(svg.id);
                                  }}
                                >
                                  <Share2 className="h-4 w-4" />
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

                        <div className="p-4 border-t bg-gray-50">
                          <div className="flex items-center justify-between">
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
                                {svg.is_official ? "SVG Official" : svg.creator_name}
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
                <p className="text-muted-foreground">No templates found</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 分页控件 */}
          {data && data.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 mb-6 flex justify-center gap-2"
            >
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page === data.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </motion.div>
          )}

          {/* 预览弹窗 */}
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
      </div>
    </div>
  );
} 