"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart } from 'recharts';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TrendData {
  date: string;
  svgs: number;
  views: number;
  likes: number;
  shares: number;
}

interface MultiMetricChartProps {
  data: TrendData[];
  isDark?: boolean;
}

export function MultiMetricChart({ data, isDark = false }: MultiMetricChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['svgs', 'views']);
  const [chartType, setChartType] = useState<'line' | 'area'>('line');

  // 默认数据
  const defaultData = [
    { date: '2024-01-01', svgs: 12, views: 120, likes: 45, shares: 8 },
    { date: '2024-01-02', svgs: 15, views: 180, likes: 62, shares: 12 },
    { date: '2024-01-03', svgs: 8, views: 95, likes: 28, shares: 5 },
    { date: '2024-01-04', svgs: 22, views: 250, likes: 89, shares: 18 },
    { date: '2024-01-05', svgs: 18, views: 200, likes: 75, shares: 15 },
    { date: '2024-01-06', svgs: 25, views: 300, likes: 110, shares: 22 },
    { date: '2024-01-07', svgs: 20, views: 220, likes: 85, shares: 16 },
  ];

  const chartData = data.length > 0 ? data : defaultData;

  const metrics = [
    { key: 'svgs', label: 'SVG创作', color: '#3b82f6' },
    { key: 'views', label: '浏览量', color: '#10b981' },
    { key: 'likes', label: '点赞数', color: '#f59e0b' },
    { key: 'shares', label: '分享数', color: '#ef4444' },
  ];

  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricKey)
        ? prev.filter(m => m !== metricKey)
        : [...prev, metricKey]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg border shadow-lg ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <p className="font-medium mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {metrics.find(m => m.key === entry.dataKey)?.label}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* 控制面板 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap gap-2">
          {metrics.map(metric => (
            <Badge
              key={metric.key}
              variant={selectedMetrics.includes(metric.key) ? 'default' : 'outline'}
              className="cursor-pointer transition-all hover:scale-105"
              style={{
                backgroundColor: selectedMetrics.includes(metric.key) ? metric.color : 'transparent',
                borderColor: metric.color,
                color: selectedMetrics.includes(metric.key) ? 'white' : metric.color
              }}
              onClick={() => toggleMetric(metric.key)}
            >
              {metric.label}
            </Badge>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
          >
            线图
          </Button>
          <Button
            variant={chartType === 'area' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('area')}
          >
            面积图
          </Button>
        </div>
      </div>

      {/* 图表 */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? '#374151' : '#e5e7eb'} 
              />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke={isDark ? '#9ca3af' : '#6b7280'}
                tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                stroke={isDark ? '#9ca3af' : '#6b7280'}
                tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{
                  color: isDark ? '#e5e7eb' : '#374151',
                  fontSize: '12px'
                }}
              />
              {selectedMetrics.map(metricKey => {
                const metric = metrics.find(m => m.key === metricKey);
                return (
                  <Line
                    key={metricKey}
                    type="monotone"
                    dataKey={metricKey}
                    stroke={metric?.color}
                    strokeWidth={2}
                    dot={{ fill: metric?.color, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: metric?.color, strokeWidth: 2 }}
                    name={metric?.label}
                  />
                );
              })}
            </LineChart>
          ) : (
            <AreaChart data={chartData}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? '#374151' : '#e5e7eb'} 
              />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke={isDark ? '#9ca3af' : '#6b7280'}
                tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                stroke={isDark ? '#9ca3af' : '#6b7280'}
                tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{
                  color: isDark ? '#e5e7eb' : '#374151',
                  fontSize: '12px'
                }}
              />
              {selectedMetrics.map((metricKey, index) => {
                const metric = metrics.find(m => m.key === metricKey);
                return (
                  <Area
                    key={metricKey}
                    type="monotone"
                    dataKey={metricKey}
                    stackId={1}
                    stroke={metric?.color}
                    fill={metric?.color}
                    fillOpacity={0.6}
                    name={metric?.label}
                  />
                );
              })}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}