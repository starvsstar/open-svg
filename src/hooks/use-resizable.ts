"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

interface UseResizableOptions {
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
  onResize?: (width: number) => void;
}

interface UseResizableReturn {
  width: number;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  resetWidth: () => void;
}

export function useResizable({
  initialWidth = 600,
  minWidth = 300,
  maxWidth = 800,
  storageKey,
  onResize
}: UseResizableOptions = {}): UseResizableReturn {
  // 从localStorage读取保存的宽度
  const getSavedWidth = useCallback(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedWidth = parseInt(saved, 10);
        if (!isNaN(parsedWidth) && parsedWidth >= minWidth && parsedWidth <= maxWidth) {
          return parsedWidth;
        }
      }
    }
    return initialWidth;
  }, [storageKey, initialWidth, minWidth, maxWidth]);

  const [width, setWidth] = useState(getSavedWidth);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // 保存宽度到localStorage
  const saveWidth = useCallback((newWidth: number) => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newWidth.toString());
    }
  }, [storageKey]);

  // 处理鼠标移动
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startXRef.current;
    const viewportWidth = window.innerWidth;
    
    // 动态计算最大宽度，确保不超过视口的80%
    const dynamicMaxWidth = Math.min(maxWidth, viewportWidth * 0.8);
    // 动态计算最小宽度，确保不小于视口的20%
    const dynamicMinWidth = Math.max(minWidth, viewportWidth * 0.2);
    
    const newWidth = Math.max(
      dynamicMinWidth,
      Math.min(dynamicMaxWidth, startWidthRef.current + deltaX)
    );

    setWidth(newWidth);
    onResize?.(newWidth);
  }, [isDragging, minWidth, maxWidth, onResize]);

  // 处理鼠标释放
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      saveWidth(width);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, [isDragging, width, saveWidth]);

  // 处理鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  // 重置宽度
  const resetWidth = useCallback(() => {
    setWidth(initialWidth);
    saveWidth(initialWidth);
    onResize?.(initialWidth);
  }, [initialWidth, saveWidth, onResize]);

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const dynamicMaxWidth = Math.min(maxWidth, viewportWidth * 0.8);
      const dynamicMinWidth = Math.max(minWidth, viewportWidth * 0.2);
      
      setWidth(prevWidth => {
        const newWidth = Math.max(dynamicMinWidth, Math.min(dynamicMaxWidth, prevWidth));
        if (newWidth !== prevWidth) {
          saveWidth(newWidth);
          onResize?.(newWidth);
        }
        return newWidth;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [minWidth, maxWidth, saveWidth, onResize]);

  // 添加全局事件监听器
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  return {
    width,
    isDragging,
    handleMouseDown,
    resetWidth
  };
}