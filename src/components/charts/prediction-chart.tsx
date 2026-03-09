"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart, ReferenceLine } from 'recharts';

interface PredictionData {
  date: string;
  predicted: number;
  confidence: number;
}

interface PredictionChartProps {
  data: PredictionData[];
  isDark?: boolean;
}

export function PredictionChart({ data, isDark = false }: PredictionChartProps) {
  // 默认数据 - 包含历史数据和预测数据
  const defaultData = [
    // 历史数据
    { date: '2024-01-01', actual: 12, predicted: null, confidence: null, upper: null, lower: null },
    { date: '2024-01-02', actual: 15, predicted: null, confidence: null, upper: null, lower: null },
    { date: '2024-01-03', actual: 8, predicted: null, confidence: null, upper: null, lower: null },
    { date: '2024-01-04', actual: 22, predicted: null, confidence: null, upper: null, lower: null },
    { date: '2024-01-05', actual: 18, predicted: null, confidence: null, upper: null, lower: null },
    { date: '2024-01-06', actual: 25, predicted: null, confidence: null, upper: null, lower: null },
    { date: '2024-01-07', actual: 20, predicted: null, confidence: null, upper: null, lower: null },
    // 预测数据
    { date: '2024-01-08', actual: null, predicted: 23, confidence: 85, upper: 28, lower: 18 },
    { date: '2024-01-09', actual: null, predicted: 26, confidence: 82, upper: 32, lower: 20 },
    { date: '2024-01-10', actual: null, predicted: 24, confidence: 78, upper: 31, lower: 17 },
    { date: '2024-01-11', actual: null, predicted: 28, confidence: 75, upper: 36, lower: 20 },
    { date: '2024-01-12', actual: null, predicted: 30, confidence: 72, upper: 39, lower: 21 },
    { date: '2024-01-13', actual: null, predicted: 27, confidence: 70, upper: 36, lower: 18 },
    { date: '2024-01-14', actual: null, predicted: 32, confidence: 68, upper: 42, lower: 22 },
  ];

  const chartData = data.length > 0 ? data.map((item, index) => ({
    ...item,
    actual: index < 7 ? item.predicted : null, // 模拟历史数据
    upper: item.predicted ? item.predicted + (item.confidence / 100) * 10 : null,
    lower: item.predicted ? item.predicted - (item.confidence / 100) * 8 : null,
  })) : defaultData;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className={`p-3 rounded-lg border shadow-lg ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <p className="font-medium mb-2">{formatDate(label)}</p>
          {data.actual && (
            <p className="text-sm" style={{ color: '#3b82f6' }}>
              实际值: {data.actual}
            </p>
          )}
          {data.predicted && (
            <>
              <p className="text-sm" style={{ color: '#10b981' }}>
                预测值: {data.predicted}
              </p>
              <p className="text-sm text-muted-foreground">
                置信度: {data.confidence}%
              </p>
              <p className="text-sm text-muted-foreground">
                范围: {data.lower} - {data.upper}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // 找到历史数据和预测数据的分界点
  const dividerIndex = chartData.findIndex(item => item.predicted !== null && item.actual === null);
  const dividerDate = dividerIndex > 0 ? chartData[dividerIndex].date : null;

  return (
    <div className="w-full h-full flex flex-col">
      {/* 图例说明 */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-blue-500"></div>
          <span className="text-sm text-muted-foreground">历史数据</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-green-500 border-dashed border-t-2"></div>
          <span className="text-sm text-muted-foreground">预测数据</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500/20 border border-green-500/40"></div>
          <span className="text-sm text-muted-foreground">置信区间</span>
        </div>
      </div>

      {/* 图表 */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
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
            
            {/* 置信区间 */}
            <Area
              type="monotone"
              dataKey="upper"
              stackId="confidence"
              stroke="none"
              fill="#10b981"
              fillOpacity={0.1}
            />
            <Area
              type="monotone"
              dataKey="lower"
              stackId="confidence"
              stroke="none"
              fill="#ffffff"
              fillOpacity={1}
            />
            
            {/* 分界线 */}
            {dividerDate && (
              <ReferenceLine 
                x={dividerDate} 
                stroke={isDark ? '#6b7280' : '#9ca3af'}
                strokeDasharray="5 5"
                label={{ value: "预测开始", position: "top" }}
              />
            )}
            
            {/* 历史数据线 */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              connectNulls={false}
            />
            
            {/* 预测数据线 */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#10b981"
              strokeWidth={3}
              strokeDasharray="8 4"
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* 预测准确性指标 */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-lg font-bold text-green-500">85%</div>
          <div className="text-xs text-muted-foreground">平均置信度</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-lg font-bold text-blue-500">±15%</div>
          <div className="text-xs text-muted-foreground">预测误差</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-lg font-bold text-purple-500">7天</div>
          <div className="text-xs text-muted-foreground">预测周期</div>
        </div>
      </div>
    </div>
  );
}