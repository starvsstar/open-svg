"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

interface UseResizablePercentOptions {
  initialPercent?: number;
  minPercent?: number;
  maxPercent?: number;
  storageKey?: string;
  onResize?: (percent: number) => void;
}

interface UseResizablePercentReturn {
  percent: number;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  resetPercent: () => void;
}

export function useResizablePercent({
  initialPercent = 50,
  minPercent = 30,
  maxPercent = 70,
  storageKey,
  onResize
}: UseResizablePercentOptions = {}): UseResizablePercentReturn {
  // 从localStorage读取保存的百分比
  const getSavedPercent = useCallback(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedPercent = parseFloat(saved);
        if (!isNaN(parsedPercent) && parsedPercent >= minPercent && parsedPercent <= maxPercent) {
          return parsedPercent;
        }
      }
    }
    return initialPercent;
  }, [storageKey, initialPercent, minPercent, maxPercent]);

  const [percent, setPercent] = useState(getSavedPercent);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startPercentRef = useRef(0);
  const containerRef = useRef<HTMLElement | null>(null);

  // 保存百分比到localStorage
  const savePercent = useCallback((newPercent: number) => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newPercent.toString());
    }
  }, [storageKey]);

  // 处理鼠标移动
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    
    if (containerWidth === 0) return;

    const deltaX = e.clientX - startXRef.current;
    const deltaPercent = (deltaX / containerWidth) * 100;
    
    const newPercent = Math.max(
      minPercent,
      Math.min(maxPercent, startPercentRef.current + deltaPercent)
    );

    setPercent(newPercent);
    onResize?.(newPercent);
  }, [isDragging, minPercent, maxPercent, onResize]);

  // 处理鼠标释放
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      savePercent(percent);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, [isDragging, percent, savePercent]);

  // 处理鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    // 找到最近的容器元素（编辑器和预览区域的父容器）
    let container = e.currentTarget.parentElement;
    while (container && !container.classList.contains('flex-1')) {
      container = container.parentElement;
    }
    
    if (!container) {
      console.warn('Could not find container for percentage calculation');
      return;
    }
    
    containerRef.current = container;
    setIsDragging(true);
    startXRef.current = e.clientX;
    startPercentRef.current = percent;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [percent]);

  // 重置百分比
  const resetPercent = useCallback(() => {
    setPercent(initialPercent);
    savePercent(initialPercent);
    onResize?.(initialPercent);
  }, [initialPercent, savePercent, onResize]);

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
    percent,
    isDragging,
    handleMouseDown,
    resetPercent
  };
}