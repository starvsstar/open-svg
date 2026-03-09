"use client"

import React from 'react'
import { useTheme } from 'next-themes'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts'
import * as d3 from 'd3'

// 颜色配置
const COLORS = {
  primary: ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'],
  secondary: ['#10b981', '#06b6d4', '#84cc16', '#eab308', '#f59e0b'],
  accent: ['#ef4444', '#f97316', '#ec4899', '#14b8a6', '#8b5cf6']
}

// 热力图组件
interface HeatmapData {
  hour: number
  day: string
  value: number
}

interface HeatmapProps {
  data: HeatmapData[]
  width?: number
  height?: number
  className?: string
}

export function Heatmap({ data, width = 800, height = 200, className }: HeatmapProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  React.useEffect(() => {
    if (!data.length) return

    // 清除之前的内容
    d3.select('#heatmap').selectAll('*').remove()

    const margin = { top: 20, right: 30, bottom: 40, left: 60 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const svg = d3.select('#heatmap')
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // 获取唯一的小时和天
    const hours = Array.from(new Set(data.map(d => d.hour))).sort((a, b) => a - b)
    const days = Array.from(new Set(data.map(d => d.day)))

    // 创建比例尺
    const xScale = d3.scaleBand()
      .domain(hours.map(String))
      .range([0, innerWidth])
      .padding(0.1)

    const yScale = d3.scaleBand()
      .domain(days)
      .range([0, innerHeight])
      .padding(0.1)

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(data, d => d.value) as [number, number])

    // 绘制热力图方块
    g.selectAll('.heatmap-rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-rect')
      .attr('x', d => xScale(String(d.hour)) || 0)
      .attr('y', d => yScale(d.day) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.value))
      .attr('stroke', isDark ? '#374151' : '#e5e7eb')
      .attr('stroke-width', 1)
      .on('mouseover', function(event, d) {
        // 添加悬停效果
        d3.select(this).attr('stroke-width', 2)
        
        // 显示tooltip
        const tooltip = d3.select('body').append('div')
          .attr('class', 'heatmap-tooltip')
          .style('position', 'absolute')
          .style('background', isDark ? '#1f2937' : '#ffffff')
          .style('border', `1px solid ${isDark ? '#374151' : '#e5e7eb'}`)
          .style('border-radius', '6px')
          .style('padding', '8px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .html(`${d.day} ${d.hour}:00<br/>活动量: ${d.value}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke-width', 1)
        d3.selectAll('.heatmap-tooltip').remove()
      })

    // 添加X轴
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('fill', isDark ? '#9ca3af' : '#6b7280')

    // 添加Y轴
    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('fill', isDark ? '#9ca3af' : '#6b7280')

  }, [data, width, height, isDark])

  return (
    <div className={className}>
      <svg id="heatmap"></svg>
    </div>
  )
}

// 雷达图组件
interface RadarData {
  subject: string
  value: number
  fullMark: number
}

interface RadarChartProps {
  data: RadarData[]
  className?: string
}

export function EnhancedRadarChart({ data, className }: RadarChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke={isDark ? '#374151' : '#e5e7eb'} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#0ea5e9"
            fill="#0ea5e9"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: '6px'
            }}
            labelStyle={{ color: isDark ? '#ffffff' : '#000000' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

// 漏斗图组件
interface FunnelData {
  name: string
  value: number
  fill?: string
}

interface FunnelChartProps {
  data: FunnelData[]
  className?: string
}

export function EnhancedFunnelChart({ data, className }: FunnelChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <FunnelChart>
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: '6px'
            }}
            labelStyle={{ color: isDark ? '#ffffff' : '#000000' }}
          />
          <Funnel
            dataKey="value"
            data={data}
            isAnimationActive
          >
            <LabelList position="center" fill="#fff" stroke="none" />
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  )
}

// 增强版趋势图组件
interface TrendData {
  date: string
  value: number
  predicted?: boolean
  confidence?: number
}

interface EnhancedTrendChartProps {
  data: TrendData[]
  predictions?: TrendData[]
  className?: string
  showPredictions?: boolean
}

export function EnhancedTrendChart({ 
  data, 
  predictions = [], 
  className, 
  showPredictions = false 
}: EnhancedTrendChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const combinedData = showPredictions ? [...data, ...predictions] : data

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
          <XAxis 
            dataKey="date" 
            stroke={isDark ? '#9ca3af' : '#6b7280'}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
          />
          <YAxis 
            stroke={isDark ? '#9ca3af' : '#6b7280'}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: '6px'
            }}
            labelStyle={{ color: isDark ? '#ffffff' : '#000000' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2 }}
          />
          {showPredictions && (
            <Line
              type="monotone"
              dataKey="value"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#94a3b8', strokeWidth: 2, r: 3 }}
              data={predictions}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// 多指标对比图组件
interface MultiMetricData {
  date: string
  [key: string]: string | number
}

interface MultiMetricChartProps {
  data: MultiMetricData[]
  metrics: string[]
  className?: string
}

export function MultiMetricChart({ data, metrics, className }: MultiMetricChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
          <XAxis 
            dataKey="date" 
            stroke={isDark ? '#9ca3af' : '#6b7280'}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
          />
          <YAxis 
            stroke={isDark ? '#9ca3af' : '#6b7280'}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: '6px'
            }}
            labelStyle={{ color: isDark ? '#ffffff' : '#000000' }}
          />
          {metrics.map((metric, index) => (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={COLORS.primary[index % COLORS.primary.length]}
              strokeWidth={2}
              dot={{ fill: COLORS.primary[index % COLORS.primary.length], strokeWidth: 2, r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// 实时数据图表组件
interface RealtimeData {
  timestamp: string
  value: number
}

interface RealtimeChartProps {
  data: RealtimeData[]
  className?: string
  maxDataPoints?: number
}

export function RealtimeChart({ data, className, maxDataPoints = 50 }: RealtimeChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // 限制数据点数量
  const limitedData = data.slice(-maxDataPoints)

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={limitedData}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
          <XAxis 
            dataKey="timestamp" 
            stroke={isDark ? '#9ca3af' : '#6b7280'}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }}
            tickFormatter={(value) => new Date(value).toLocaleTimeString()}
          />
          <YAxis 
            stroke={isDark ? '#9ca3af' : '#6b7280'}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: '6px'
            }}
            labelStyle={{ color: isDark ? '#ffffff' : '#000000' }}
            labelFormatter={(value) => new Date(value).toLocaleString()}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}