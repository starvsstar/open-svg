"use client";

import { ResponsiveContainer, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

interface RadarChartProps {
  data: string[];
  isDark?: boolean;
}

export function RadarChart({ data, isDark = false }: RadarChartProps) {
  // 转换数据格式
  const radarData = [
    { subject: 'Icons', A: 120, B: 110, fullMark: 150 },
    { subject: 'Illustrations', A: 98, B: 130, fullMark: 150 },
    { subject: 'Logos', A: 86, B: 130, fullMark: 150 },
    { subject: 'UI Elements', A: 99, B: 100, fullMark: 150 },
    { subject: 'Animations', A: 85, B: 90, fullMark: 150 },
    { subject: 'Patterns', A: 65, B: 85, fullMark: 150 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsRadarChart data={radarData}>
        <PolarGrid 
          stroke={isDark ? '#374151' : '#e5e7eb'}
        />
        <PolarAngleAxis 
          dataKey="subject" 
          tick={{ 
            fill: isDark ? '#e5e7eb' : '#374151',
            fontSize: 12
          }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 150]}
          tick={{ 
            fill: isDark ? '#9ca3af' : '#6b7280',
            fontSize: 10
          }}
        />
        <Radar
          name="当前能力"
          dataKey="A"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Radar
          name="目标能力"
          dataKey="B"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.2}
          strokeWidth={2}
          strokeDasharray="5 5"
        />
        <Legend 
          wrapperStyle={{
            color: isDark ? '#e5e7eb' : '#374151',
            fontSize: '12px'
          }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}