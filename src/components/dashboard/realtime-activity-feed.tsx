"use client";

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { 
  Palette, 
  Heart, 
  Share2, 
  MessageCircle, 
  Brain, 
  User,
  Zap
} from 'lucide-react';

interface RealtimeActivity {
  id: string;
  type: 'creation' | 'like' | 'share' | 'comment' | 'ai_generation';
  userId: string;
  userName: string;
  svgId?: string;
  svgTitle?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export function RealtimeActivityFeed() {
  const [activities, setActivities] = useState<RealtimeActivity[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // 模拟实时数据
  useEffect(() => {
    // 初始化一些活动数据
    const initialActivities: RealtimeActivity[] = [
      {
        id: '1',
        type: 'creation',
        userId: 'user1',
        userName: '张小明',
        svgId: 'svg1',
        svgTitle: '可爱的小猫图标',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        metadata: { category: 'icon' }
      },
      {
        id: '2',
        type: 'like',
        userId: 'user2',
        userName: '李小红',
        svgId: 'svg2',
        svgTitle: '现代化Logo设计',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        type: 'ai_generation',
        userId: 'user3',
        userName: '王小华',
        svgId: 'svg3',
        svgTitle: 'AI生成的抽象图案',
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        metadata: { model: 'GPT-4', prompt: '创建一个现代化的抽象图案' }
      },
      {
        id: '4',
        type: 'share',
        userId: 'user4',
        userName: '赵小刚',
        svgId: 'svg4',
        svgTitle: '商业插画设计',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        metadata: { platform: 'social' }
      },
      {
        id: '5',
        type: 'comment',
        userId: 'user5',
        userName: '陈小美',
        svgId: 'svg5',
        svgTitle: 'UI界面元素',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        metadata: { comment: '这个设计很棒！' }
      }
    ];

    setActivities(initialActivities);
    setIsConnected(true);

    // 模拟新活动的添加
    const interval = setInterval(() => {
      const newActivity: RealtimeActivity = {
        id: Date.now().toString(),
        type: ['creation', 'like', 'share', 'comment', 'ai_generation'][Math.floor(Math.random() * 5)] as any,
        userId: `user${Math.floor(Math.random() * 100)}`,
        userName: ['张三', '李四', '王五', '赵六', '陈七'][Math.floor(Math.random() * 5)],
        svgId: `svg${Math.floor(Math.random() * 1000)}`,
        svgTitle: ['创意图标', '现代Logo', 'UI元素', '插画设计', '抽象图案'][Math.floor(Math.random() * 5)],
        timestamp: new Date().toISOString(),
        metadata: {}
      };

      setActivities(prev => [newActivity, ...prev.slice(0, 19)]); // 保持最新20条
    }, 5000 + Math.random() * 10000); // 5-15秒随机间隔

    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'creation':
        return <Palette className="h-4 w-4 text-blue-500" />;
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'share':
        return <Share2 className="h-4 w-4 text-green-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      case 'ai_generation':
        return <Brain className="h-4 w-4 text-orange-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: RealtimeActivity) => {
    switch (activity.type) {
      case 'creation':
        return `创建了新作品 "${activity.svgTitle}"`;
      case 'like':
        return `点赞了 "${activity.svgTitle}"`;
      case 'share':
        return `分享了 "${activity.svgTitle}"`;
      case 'comment':
        return `评论了 "${activity.svgTitle}"`;
      case 'ai_generation':
        return `使用AI生成了 "${activity.svgTitle}"`;
      default:
        return '进行了某项操作';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'creation': return 'bg-blue-500/10 text-blue-500';
      case 'like': return 'bg-red-500/10 text-red-500';
      case 'share': return 'bg-green-500/10 text-green-500';
      case 'comment': return 'bg-purple-500/10 text-purple-500';
      case 'ai_generation': return 'bg-orange-500/10 text-orange-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 状态指示器 */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`} />
        <span className="text-sm text-muted-foreground">
          {isConnected ? '实时连接中' : '连接断开'}
        </span>
        <Zap className="h-4 w-4 text-yellow-500" />
      </div>

      {/* 活动列表 */}
      <ScrollArea className="flex-1">
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div 
              key={activity.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 hover:bg-muted/50 ${
                index === 0 ? 'bg-primary/5 border border-primary/20' : ''
              }`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={`https://avatar.vercel.sh/${activity.userId}`} />
                <AvatarFallback className="text-xs">
                  {activity.userName[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">
                    {activity.userName}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getActivityColor(activity.type)}`}
                  >
                    {getActivityIcon(activity.type)}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-1">
                  {getActivityText(activity)}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                  
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="flex gap-1">
                      {activity.metadata.model && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.model}
                        </Badge>
                      )}
                      {activity.metadata.category && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.category}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* 统计信息 */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="p-2 bg-muted/50 rounded">
          <div className="text-lg font-bold text-blue-500">{activities.length}</div>
          <div className="text-xs text-muted-foreground">今日活动</div>
        </div>
        <div className="p-2 bg-muted/50 rounded">
          <div className="text-lg font-bold text-green-500">
            {new Set(activities.map(a => a.userId)).size}
          </div>
          <div className="text-xs text-muted-foreground">活跃用户</div>
        </div>
      </div>
    </div>
  );
}