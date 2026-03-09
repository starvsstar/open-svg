"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Lightbulb, 
  Star, 
  TrendingUp, 
  BookOpen, 
  Zap, 
  Target,
  Award,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface Recommendation {
  id: string;
  type: 'template' | 'feature' | 'tutorial' | 'inspiration' | 'community';
  title: string;
  description: string;
  relevanceScore: number;
  reason: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export function PersonalizedRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    // 模拟获取个性化推荐数据
    const fetchRecommendations = async () => {
      setIsLoading(true);
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockRecommendations: Recommendation[] = [
        {
          id: '1',
          type: 'template',
          title: '现代化图标模板',
          description: '基于您的创作风格，推荐这套现代化图标模板',
          relevanceScore: 95,
          reason: '与您最近的创作风格匹配度高',
          actionUrl: '/templates/modern-icons',
          metadata: { category: 'icons', style: 'modern' }
        },
        {
          id: '2',
          type: 'feature',
          title: 'AI智能配色',
          description: '尝试使用AI智能配色功能，提升作品视觉效果',
          relevanceScore: 88,
          reason: '您还未使用过此功能',
          actionUrl: '/studio?feature=ai-color',
          metadata: { feature: 'ai-color', difficulty: 'easy' }
        },
        {
          id: '3',
          type: 'tutorial',
          title: 'SVG动画制作教程',
          description: '学习如何为SVG添加动画效果，让作品更生动',
          relevanceScore: 82,
          reason: '基于您的技能水平推荐',
          actionUrl: '/tutorials/svg-animation',
          metadata: { duration: '15分钟', level: 'intermediate' }
        },
        {
          id: '4',
          type: 'inspiration',
          title: '热门设计趋势',
          description: '2024年最新的设计趋势和灵感收集',
          relevanceScore: 78,
          reason: '帮助您跟上设计潮流',
          actionUrl: '/inspiration/trends-2024',
          metadata: { trending: true, views: 1250 }
        },
        {
          id: '5',
          type: 'community',
          title: '设计师交流群',
          description: '加入活跃的设计师社区，分享经验和获得反馈',
          relevanceScore: 75,
          reason: '扩展您的设计师网络',
          actionUrl: '/community/groups',
          metadata: { members: 1580, activity: 'high' }
        },
        {
          id: '6',
          type: 'template',
          title: 'Logo设计套件',
          description: '专业的Logo设计模板和工具集合',
          relevanceScore: 72,
          reason: '您经常创作Logo类作品',
          actionUrl: '/templates/logo-kit',
          metadata: { category: 'logo', templates: 50 }
        },
        {
          id: '7',
          type: 'feature',
          title: '批量导出功能',
          description: '一键导出多种格式和尺寸，提高工作效率',
          relevanceScore: 70,
          reason: '适合您的工作流程',
          actionUrl: '/studio?feature=batch-export',
          metadata: { feature: 'batch-export', timeSaving: true }
        },
        {
          id: '8',
          type: 'tutorial',
          title: '色彩理论基础',
          description: '掌握色彩搭配的基本原理，提升设计水平',
          relevanceScore: 68,
          reason: '完善您的设计基础',
          actionUrl: '/tutorials/color-theory',
          metadata: { duration: '20分钟', level: 'beginner' }
        }
      ];
      
      setRecommendations(mockRecommendations);
      setIsLoading(false);
    };

    fetchRecommendations();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'template': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'feature': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'tutorial': return <BookOpen className="h-4 w-4 text-green-500" />;
      case 'inspiration': return <Lightbulb className="h-4 w-4 text-purple-500" />;
      case 'community': return <Target className="h-4 w-4 text-orange-500" />;
      default: return <Sparkles className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'template': return '模板';
      case 'feature': return '功能';
      case 'tutorial': return '教程';
      case 'inspiration': return '灵感';
      case 'community': return '社区';
      default: return '其他';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const categories = [
    { key: 'all', label: '全部' },
    { key: 'template', label: '模板' },
    { key: 'feature', label: '功能' },
    { key: 'tutorial', label: '教程' },
    { key: 'inspiration', label: '灵感' },
    { key: 'community', label: '社区' }
  ];

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.type === selectedCategory);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">正在生成个性化推荐...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 标题和筛选 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold">为您推荐</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {filteredRecommendations.length} 项推荐
        </Badge>
      </div>

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(category => (
          <Button
            key={category.key}
            variant={selectedCategory === category.key ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
            onClick={() => setSelectedCategory(category.key)}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* 推荐列表 */}
      <ScrollArea className="flex-1">
        <div className="space-y-3">
          {filteredRecommendations.map((recommendation, index) => (
            <Card 
              key={recommendation.id} 
              className={`transition-all hover:shadow-md cursor-pointer ${
                index === 0 ? 'border-primary/50 bg-primary/5' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(recommendation.type)}
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(recommendation.type)}
                    </Badge>
                  </div>
                  <div className={`text-sm font-bold ${getScoreColor(recommendation.relevanceScore)}`}>
                    {recommendation.relevanceScore}%
                  </div>
                </div>
                
                <h4 className="font-medium text-sm mb-1">
                  {recommendation.title}
                </h4>
                
                <p className="text-xs text-muted-foreground mb-2">
                  {recommendation.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {recommendation.reason}
                    </span>
                  </div>
                  
                  {recommendation.actionUrl && (
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                      查看
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
                
                {/* 元数据标签 */}
                {recommendation.metadata && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {recommendation.metadata.trending && (
                      <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-500">
                        热门
                      </Badge>
                    )}
                    {recommendation.metadata.level && (
                      <Badge variant="secondary" className="text-xs">
                        {recommendation.metadata.level === 'beginner' ? '初级' : 
                         recommendation.metadata.level === 'intermediate' ? '中级' : '高级'}
                      </Badge>
                    )}
                    {recommendation.metadata.duration && (
                      <Badge variant="secondary" className="text-xs">
                        {recommendation.metadata.duration}
                      </Badge>
                    )}
                    {recommendation.metadata.timeSaving && (
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">
                        省时
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
      
      {/* 底部统计 */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-muted/50 rounded">
          <div className="text-sm font-bold text-purple-500">
            {Math.round(filteredRecommendations.reduce((acc, rec) => acc + rec.relevanceScore, 0) / filteredRecommendations.length)}%
          </div>
          <div className="text-xs text-muted-foreground">平均匹配度</div>
        </div>
        <div className="p-2 bg-muted/50 rounded">
          <div className="text-sm font-bold text-blue-500">
            {filteredRecommendations.filter(rec => rec.relevanceScore >= 80).length}
          </div>
          <div className="text-xs text-muted-foreground">高匹配推荐</div>
        </div>
        <div className="p-2 bg-muted/50 rounded">
          <div className="text-sm font-bold text-green-500">
            {new Set(filteredRecommendations.map(rec => rec.type)).size}
          </div>
          <div className="text-xs text-muted-foreground">推荐类型</div>
        </div>
      </div>
    </div>
  );
}