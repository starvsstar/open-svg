"use client";

import { useEffect, useState } from "react";

interface SVGPreviewProps {
  content: string;
  className?: string;
}

export function SVGPreview({ content, className = "" }: SVGPreviewProps) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(content, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    // 获取 SVG 的原始尺寸
    let width = 24;
    let height = 24;
    
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const [, , w, h] = viewBox.split(' ').map(Number);
      if (!isNaN(w) && !isNaN(h)) {
        width = w;
        height = h;
      }
    } else {
      const w = svgElement.getAttribute('width');
      const h = svgElement.getAttribute('height');
      if (w && h) {
        width = parseFloat(w);
        height = parseFloat(h);
      }
    }

    setDimensions({ width, height });
  }, [content]);

  if (!dimensions) {
    return <div className={`w-full h-full bg-white animate-pulse ${className}`} />;
  }

  // 保留原始的 viewBox 和 style 属性
  const originalViewBox = content.match(/viewBox="([^"]*)"/)?.[ 1];
  const originalStyle = content.match(/style="([^"]*)"/)?.[ 1];

  // 清理 SVG 内容，但保留重要属性
  const cleanedSvg = content
    .replace(/<svg([^>]*)>/, (match, attributes) => {
      // 只移除 width 和 height 属性
      const preservedAttributes = attributes
        .replace(/width="[^"]*"/, '')
        .replace(/height="[^"]*"/, '');
      return `<svg${preservedAttributes}`;
    });

  return (
    <div className={`w-full h-full flex items-center justify-center bg-white ${className}`}>
      <div
        className="w-full h-full flex items-center justify-center"
        dangerouslySetInnerHTML={{
          __html: cleanedSvg.replace(
            /<svg/,
            `<svg preserveAspectRatio="xMidYMid meet" viewBox="${originalViewBox || `0 0 ${dimensions.width} ${dimensions.height}`}" style="${originalStyle || ''} width: 100%; height: 100%; object-fit: contain;"`
          ),
        }}
      />
    </div>
  );
} 