"use client";

import { ResponsiveContainer } from 'recharts';

interface FunnelData {
  name: string;
  value: number;
  percentage: number;
}

interface FunnelChartProps {
  data: FunnelData[];
  isDark?: boolean;
}

export function FunnelChart({ data, isDark = false }: FunnelChartProps) {
  // 默认数据
  const defaultData = [
    { name: 'Icons', value: 450, percentage: 45 },
    { name: 'Illustrations', value: 250, percentage: 25 },
    { name: 'Logos', value: 150, percentage: 15 },
    { name: 'UI Elements', value: 100, percentage: 10 },
    { name: 'Animations', value: 50, percentage: 5 },
  ];

  const chartData = data.length > 0 ? data : defaultData;
  const maxValue = Math.max(...chartData.map(item => item.value));

  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
  ];

  const funnelData = chartData.map((item, index) => ({
    ...item,
    color: colors[index % colors.length]
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <div className="w-full h-full flex flex-col justify-center items-center p-2">
        <div className="flex-1 flex flex-col justify-center space-y-1 w-full max-w-sm">
          {funnelData.map((item, index) => (
            <div key={index} className="w-full flex flex-col items-center">
              <div
                className="relative flex items-center justify-center text-white font-medium text-xs transition-all hover:scale-105 cursor-pointer"
                style={{
                  width: `${Math.max(item.percentage, 25)}%`,
                  height: '32px',
                  backgroundColor: item.color,
                  clipPath: index === funnelData.length - 1 
                    ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' 
                    : 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)',
                  minWidth: '100px'
                }}
                title={`${item.name}: ${item.value} (${item.percentage}%)`}
              >
                <span className="z-10 truncate px-2">{item.name}: {item.value}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {item.percentage}%
              </div>
            </div>
          ))}
        </div>
        
        {/* 图例 */}
        <div className="mt-3 grid grid-cols-3 gap-1 w-full text-center">
          {funnelData.map((item, index) => (
            <div key={index} className="flex items-center gap-1 justify-center">
              <div 
                className="w-2 h-2 rounded-sm flex-shrink-0" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground truncate">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </ResponsiveContainer>
  );
}