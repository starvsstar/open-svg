"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Download, Share2, Heart, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from 'date-fns';
import { SVGPreview } from "@/components/svg-preview";
import { useRouter } from "next/navigation";

const typeData = [
  { name: 'Icons', value: 45 },
  { name: 'Illustrations', value: 25 },
  { name: 'Animated', value: 15 },
  { name: 'UI Elements', value: 15 },
];

const engagementData = [
  { name: 'Downloads', value: 1200 },
  { name: 'Shares', value: 360 },
  { name: 'Likes', value: 580 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [trendData, setTrendData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    public: 0,
    personal: 0,
    shares: 0,
    downloads: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dailyTrendData, setDailyTrendData] = useState([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState([]);
  const [recentEdits, setRecentEdits] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setDailyTrendData(data.dailyTrend);
        setMonthlyTrendData(data.monthlyTrend);
        setStats(data.stats);
      } catch (error) {
        console.error('Error fetching trend data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchRecentEdits() {
      try {
        const response = await fetch('/api/dashboard/recent-edits');
        console.log("Response status:", response.status);
        
        const data = await response.json();
        console.log("Response data:", data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch recent edits');
        }
        
        if (Array.isArray(data)) {
          setRecentEdits(data);
        } else {
          console.error('Unexpected data format:', data);
          setRecentEdits([]);
        }
      } catch (error) {
        console.error('Error fetching recent edits:', error);
        setRecentEdits([]);
      }
    }

    fetchRecentEdits();
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* 可滚动的内容区域 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-8 space-y-8">
          {/* 顶部统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-1 group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 dark:hover:shadow-blue-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total SVGs</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowUpRight className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-medium text-green-500">+12%</span>
                  <span className="text-xs text-muted-foreground">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 dark:hover:shadow-indigo-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Public SVGs</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Share2 className="h-4 w-4 text-indigo-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.public}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-medium text-indigo-500">66%</span>
                  <span className="text-xs text-muted-foreground">of total</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 dark:hover:shadow-purple-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Personal SVGs</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Lock className="h-4 w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.personal}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-medium text-purple-500">34%</span>
                  <span className="text-xs text-muted-foreground">of total</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 dark:hover:shadow-green-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Community Shares</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Share2 className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.shares}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-medium text-green-500">+8%</span>
                  <span className="text-xs text-muted-foreground">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 dark:hover:shadow-cyan-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Downloads</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Download className="h-4 w-4 text-cyan-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.downloads}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-medium text-cyan-500">+23%</span>
                  <span className="text-xs text-muted-foreground">from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 趋势图区域 */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>SVG Creation Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  {/* 左侧日趋势图 */}
                  <div className="w-[70%]">
                    <div className="h-[300px] relative">
                      {/* 将标题移到图表上方中间位置 */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                        <h3 className="text-sm font-medium text-muted-foreground bg-background/90 px-2 py-1 rounded">
                          Daily Trend (Last 7 Days)
                        </h3>
                      </div>
                      
                      {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dailyTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#eee'} />
                            <XAxis 
                              dataKey="date" 
                              stroke={isDark ? '#888' : '#666'}
                              tick={{ fill: isDark ? '#888' : '#666' }}
                            />
                            <YAxis 
                              stroke={isDark ? '#888' : '#666'}
                              tick={{ fill: isDark ? '#888' : '#666' }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#1f2937' : '#fff',
                                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                                borderRadius: '6px',
                              }}
                              labelStyle={{ color: isDark ? '#fff' : '#000' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="svgs" 
                              stroke="#0ea5e9" 
                              strokeWidth={2}
                              dot={{ fill: '#0ea5e9' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* 右侧月趋势图 */}
                  <div className="w-[30%]">
                    <div className="h-[300px] relative">
                      {/* 将标题移到图表上方中间位置 */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                        <h3 className="text-sm font-medium text-muted-foreground bg-background/90 px-2 py-1 rounded">
                          Monthly Trend (Last 6 Months)
                        </h3>
                      </div>
                      
                      {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthlyTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#eee'} />
                            <XAxis 
                              dataKey="date" 
                              stroke={isDark ? '#888' : '#666'}
                              tick={{ fill: isDark ? '#888' : '#666' }}
                            />
                            <YAxis 
                              stroke={isDark ? '#888' : '#666'}
                              tick={{ fill: isDark ? '#888' : '#666' }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#1f2937' : '#fff',
                                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                                borderRadius: '6px',
                              }}
                              labelStyle={{ color: isDark ? '#fff' : '#000' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="svgs" 
                              stroke="#0ea5e9" 
                              strokeWidth={2}
                              dot={{ fill: '#0ea5e9' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SVG类型分布 */}
            <Card>
              <CardHeader>
                <CardTitle>SVG Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? '#1f2937' : '#fff',
                          border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '6px',
                        }}
                        labelStyle={{ color: isDark ? '#fff' : '#000' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 使用情况统计 */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#eee'} />
                      <XAxis 
                        dataKey="name" 
                        stroke={isDark ? '#888' : '#666'}
                        tick={{ fill: isDark ? '#888' : '#666' }}
                      />
                      <YAxis 
                        stroke={isDark ? '#888' : '#666'}
                        tick={{ fill: isDark ? '#888' : '#666' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? '#1f2937' : '#fff',
                          border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '6px',
                        }}
                        labelStyle={{ color: isDark ? '#fff' : '#000' }}
                      />
                      <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 活动区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 最近编辑 */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Edits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-y-auto scrollbar-thin">
                  <div className="grid grid-cols-2 gap-3">
                    {recentEdits.map((edit) => (
                      <div
                        key={edit.id}
                        className="group relative overflow-hidden bg-background border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md hover:border-border/80 active:scale-[0.98]"
                        onClick={() => router.push(`/studio/${edit.id}`)}
                      >
                        {/* SVG Preview Container */}
                        <div className="relative aspect-[4/3] w-full bg-white border-b">
                          <div className="absolute inset-0 flex items-center justify-center p-6">
                            <SVGPreview 
                              content={edit.svg_content} 
                              className="group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        </div>
                        
                        {/* Info Overlay - 实体背景 */}
                        <div className="p-3 bg-background">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground/90">{edit.title}</span>
                            <span className="text-muted-foreground text-xs">
                              about {formatDistanceToNow(new Date(edit.updated_at))} ago
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {recentEdits.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                      <p>No recent edits</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 社区动态 */}
            <Card>
              <CardHeader>
                <CardTitle>Community Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-y-auto scrollbar-thin">
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={`https://avatar.vercel.sh/${item}`} />
                          <AvatarFallback>U{item}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">User liked your SVG</p>
                          <p className="text-sm text-muted-foreground">5m ago</p>
                        </div>
                        <Button variant="ghost" size="icon">
                          ⋮
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 