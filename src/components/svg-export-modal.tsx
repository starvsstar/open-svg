"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

interface SVGExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  svg: {
    content: string;
    title: string;
  };
}

type ExportFormat = 'SVG' | 'PNG' | 'JPEG' | 'WebP';
type ExportSize = '1x' | '2x' | '3x' | 'custom';
type SocialPlatform = 'xiaohongshu' | 'wechat' | 'douyin' | 'twitter';

// 社交媒体平台的推荐尺寸
const PLATFORM_SIZES = {
  xiaohongshu: { width: '1080', height: '1440', name: '小红书' },
  wechat: { width: '1080', height: '1080', name: '微信' },
  douyin: { width: '1080', height: '1920', name: '抖音' },
  twitter: { width: '1200', height: '675', name: '推特' }
};

// 添加文件名处理工具函数
const sanitizeFileName = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-') // 保留中文字符和字母数字
    .replace(/-+/g, '-')  // 将多个连续的连字符替换为单个
    .replace(/^-|-$/g, '') // 移除首尾的连字符
    .slice(0, 50);  // 限制文件名长度
};

// 生成完整的文件名
const generateFileName = (title: string, format: string) => {
  const sanitizedTitle = sanitizeFileName(title || 'untitled');
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${sanitizedTitle}-${timestamp}.${format.toLowerCase()}`;
};

export function SVGExportModal({ isOpen, onClose, svg }: SVGExportModalProps) {
  const [format, setFormat] = React.useState<ExportFormat>('PNG');
  const [size, setSize] = React.useState<ExportSize>('1x');
  const [customWidth, setCustomWidth] = React.useState('');
  const [customHeight, setCustomHeight] = React.useState('');
  const [platform, setPlatform] = React.useState<SocialPlatform | 'none'>('none');

  // 处理平台选择
  const handlePlatformChange = (value: string) => {
    if (value === 'none') {
      setPlatform('none');
      return;
    }

    const platform = value as SocialPlatform;
    setPlatform(platform);
    setSize('custom');
    setCustomWidth(PLATFORM_SIZES[platform].width);
    setCustomHeight(PLATFORM_SIZES[platform].height);
  };

  const handleExport = async () => {
    try {
      // 如果是 SVG 格式，直接导出 SVG 文件
      if (format === 'SVG') {
        const svgBlob = new Blob([svg.content], { type: 'image/svg+xml;charset=utf-8' });
        const fileName = generateFileName(svg.title, 'svg');

        const url = URL.createObjectURL(svgBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onClose();
        toast.success('Export successful');
        return;
      }

      // 1. 将SVG转换为base64编码的数据URL
      const svgString = new XMLSerializer().serializeToString(
        new DOMParser().parseFromString(svg.content, 'image/svg+xml').documentElement
      );
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();
        img.crossOrigin = 'anonymous';  // 添加这个属性

        img.onload = () => {
          // 2. 创建canvas并设置尺寸
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // 计算导出尺寸
          let exportWidth = img.width;
          let exportHeight = img.height;
          
          if (size === 'custom' && customWidth && customHeight) {
            exportWidth = parseInt(customWidth);
            exportHeight = parseInt(customHeight);
          } else if (size !== '1x') {
            const scale = size === '2x' ? 2 : 3;
            exportWidth *= scale;
            exportHeight *= scale;
          }

          // 设置画布尺寸
          canvas.width = exportWidth;
          canvas.height = exportHeight;

          if (ctx) {
            // 3. 设置白色背景
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, exportWidth, exportHeight);
            
            // 4. 在canvas上绘制SVG
            ctx.drawImage(img, 0, 0, exportWidth, exportHeight);

            // 5. 直接使用 canvas.toDataURL 而不是 toBlob
            const dataUrl = canvas.toDataURL(`image/${format.toLowerCase()}`, 0.9);

            // 使用新的文件名生成函数
            const fileName = generateFileName(svg.title, format);
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            onClose();
            toast.success('Export successful');
          }
        };

        img.onerror = () => {
          toast.error('SVG loading failed');
        };

        img.src = reader.result as string;
      };

      reader.readAsDataURL(svgBlob);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Export Image</DialogTitle>
        </DialogHeader>
        <div className="grid gap-8 py-6">
          {/* 格式选择 */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Format</Label>
            <div className="grid grid-cols-4 gap-4">
              {(['SVG', 'PNG', 'JPEG', 'WebP'] as const).map((f) => (
                <Button
                  key={f}
                  variant="outline"
                  className={cn(
                    "relative h-24 hover:border-primary/50 hover:bg-primary/5 transition-colors",
                    format === f && "border-primary/50 bg-primary/5 ring-2 ring-primary/10"
                  )}
                  onClick={() => setFormat(f)}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-base font-medium">{f}</span>
                    <span className="text-xs text-muted-foreground">
                      {f === 'SVG' ? 'Vector format' :
                       f === 'PNG' ? 'Lossless' : 
                       f === 'JPEG' ? 'Lossy' : 
                       'Efficient'}
                    </span>
                  </div>
                  {format === f && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* 社交媒体平台选择 */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Social Media</Label>
            <Select value={platform} onValueChange={handlePlatformChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select target platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No recommended size</SelectItem>
                <SelectItem value="xiaohongshu">Xiaohongshu (1080×1440)</SelectItem>
                <SelectItem value="wechat">WeChat (1080×1080)</SelectItem>
                <SelectItem value="douyin">TikTok (1080×1920)</SelectItem>
                <SelectItem value="twitter">Twitter (1200×675)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 尺寸选择 */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Size</Label>
            <RadioGroup
              value={size}
              onValueChange={(value) => {
                setSize(value as ExportSize);
                setPlatform('none'); // 清除平台选择
              }}
              className="grid grid-cols-4 gap-4"
            >
              {[
                { value: '1x', label: '1x', desc: 'Original size' },
                { value: '2x', label: '2x', desc: 'Double size' },
                { value: '3x', label: '3x', desc: 'Triple size' },
                { value: 'custom', label: 'Custom', desc: 'Custom size' },
              ].map((option) => (
                <div key={option.value} className="relative">
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={option.value}
                    className={cn(
                      "flex flex-col items-center justify-center h-24 rounded-lg border-2 border-muted",
                      "hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer",
                      "peer-data-[state=checked]:border-primary/50 peer-data-[state=checked]:bg-primary/5",
                      "peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/10"
                    )}
                  >
                    <span className="text-base font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.desc}</span>
                    {size === option.value && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {/* 自定义尺寸输入 */}
            {size === 'custom' && (
              <div className="flex items-center gap-4 mt-4 p-4 rounded-lg bg-muted/50">
                <div className="flex-1 space-y-2">
                  <Label>Width</Label>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      value={customWidth}
                      onChange={(e) => {
                        setCustomWidth(e.target.value);
                        setPlatform('none'); // 清除平台选择
                      }}
                      className="rounded-r-none"
                    />
                    <span className="px-3 py-2 border border-l-0 rounded-r-md bg-background">
                      px
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Height</Label>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      value={customHeight}
                      onChange={(e) => {
                        setCustomHeight(e.target.value);
                        setPlatform('none'); // 清除平台选择
                      }}
                      className="rounded-r-none"
                    />
                    <span className="px-3 py-2 border border-l-0 rounded-r-md bg-background">
                      px
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 按钮区域 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-24"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            className="w-24"
          >
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 