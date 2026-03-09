"use client";

import { useMemo } from 'react';
import { ResponsiveContainer } from 'recharts';

interface HeatmapData {
  hour: number;
  activity: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  isDark?: boolean;
}

export function HeatmapChart({ data, isDark = false }: HeatmapChartProps) {
  const heatmapData = useMemo(() => {
    // 创建7天x24小时的热力图数据
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return days.map((day, dayIndex) => ({
      day,
      data: hours.map(hour => {
        // 生成更密集的活动数据，确保每天都有较高的活跃度
        const baseActivity = 30 + Math.random() * 70; // 30-100之间
        // 在工作时间(9-18)和晚上(19-23)增加活跃度
        const timeBonus = (hour >= 9 && hour <= 18) || (hour >= 19 && hour <= 23) ? 20 : 0;
        const activity = Math.min(100, baseActivity + timeBonus + (Math.random() * 20 - 10));
        return {
          hour,
          activity,
          value: activity
        };
      })
    }));
  }, [data]);

  const getColor = (value: number) => {
    const intensity = value / 100;
    if (isDark) {
      return `rgba(59, 130, 246, ${intensity})`; // blue in dark mode
    }
    return `rgba(37, 99, 235, ${intensity})`; // blue in light mode
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <div className="w-full h-full flex flex-col">
        {/* 时间标签 */}
        <div className="flex mb-2">
          <div className="w-12 flex-shrink-0"></div>
          <div className="flex-1 flex">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="flex-1 text-xs text-center text-muted-foreground">
                {i % 4 === 0 ? `${i}:00` : ''}
              </div>
            ))}
          </div>
        </div>
        
        {/* 热力图数据 */}
        <div className="flex-1 space-y-1">
          {heatmapData.map((dayData, dayIndex) => (
            <div key={dayIndex} className="flex items-center">
              <div className="w-12 flex-shrink-0 text-xs text-muted-foreground pr-2">
                {dayData.day}
              </div>
              <div className="flex-1 flex gap-1">
                {dayData.data.map((hourData, hourIndex) => (
                  <div
                    key={`${dayIndex}-${hourIndex}`}
                    className="flex-1 aspect-square rounded-sm border border-border/20 flex items-center justify-center text-xs font-medium transition-all hover:scale-110 cursor-pointer min-w-0"
                    style={{
                      backgroundColor: getColor(hourData.activity),
                      color: hourData.activity > 50 ? 'white' : isDark ? '#e5e7eb' : '#374151'
                    }}
                    title={`${dayData.day} ${hourData.hour}:00 - 活跃度: ${Math.round(hourData.activity)}`}
                  >
                    {hourData.activity > 15 ? Math.round(hourData.activity) : ''}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* 图例 */}
        <div className="flex items-center justify-center mt-4 gap-2">
          <span className="text-xs text-muted-foreground">低</span>
          <div className="flex gap-1">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity, index) => (
              <div
                key={index}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: getColor(intensity * 100) }}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">高</span>
        </div>
      </div>
    </ResponsiveContainer>
  );
}

// 使用 flexbox 布局，不再需要 grid-cols-25