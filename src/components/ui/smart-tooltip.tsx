'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface SmartTooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  delay?: number
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  className?: string
  disabled?: boolean
  interactive?: boolean
  maxWidth?: number
}

export function SmartTooltip({
  content,
  children,
  delay = 500,
  placement = 'auto',
  className,
  disabled = false,
  interactive = false,
  maxWidth = 300
}: SmartTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [actualPlacement, setActualPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('top')
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const scrollX = window.scrollX
    const scrollY = window.scrollY

    let x = 0
    let y = 0
    let finalPlacement = placement

    // 自动计算最佳位置
    if (placement === 'auto') {
      const spaceTop = triggerRect.top
      const spaceBottom = viewportHeight - triggerRect.bottom
      const spaceLeft = triggerRect.left
      const spaceRight = viewportWidth - triggerRect.right

      if (spaceTop >= tooltipRect.height && spaceTop >= spaceBottom) {
        finalPlacement = 'top'
      } else if (spaceBottom >= tooltipRect.height) {
        finalPlacement = 'bottom'
      } else if (spaceRight >= tooltipRect.width) {
        finalPlacement = 'right'
      } else {
        finalPlacement = 'left'
      }
    }

    // 根据最终位置计算坐标
    switch (finalPlacement) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        y = triggerRect.top - tooltipRect.height - 8
        break
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        y = triggerRect.bottom + 8
        break
      case 'left':
        x = triggerRect.left - tooltipRect.width - 8
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        break
      case 'right':
        x = triggerRect.right + 8
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        break
    }

    // 确保工具提示在视口内
    x = Math.max(8, Math.min(x, viewportWidth - tooltipRect.width - 8))
    y = Math.max(8, Math.min(y, viewportHeight - tooltipRect.height - 8))

    setPosition({ x: x + scrollX, y: y + scrollY })
    setActualPlacement(finalPlacement)
  }

  const showTooltip = () => {
    if (disabled) return
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      // 延迟计算位置，确保DOM已更新
      setTimeout(calculatePosition, 0)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const handleMouseEnter = () => {
    showTooltip()
  }

  const handleMouseLeave = () => {
    if (!interactive) {
      hideTooltip()
    }
  }

  const handleTooltipMouseEnter = () => {
    if (interactive && timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleTooltipMouseLeave = () => {
    if (interactive) {
      hideTooltip()
    }
  }

  useEffect(() => {
    if (isVisible) {
      calculatePosition()
      
      const handleResize = () => calculatePosition()
      const handleScroll = () => calculatePosition()
      
      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleScroll)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [isVisible])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-2 h-2 bg-gray-900 dark:bg-gray-100 transform rotate-45'
    
    switch (actualPlacement) {
      case 'top':
        return `${baseClasses} -bottom-1 left-1/2 -translate-x-1/2`
      case 'bottom':
        return `${baseClasses} -top-1 left-1/2 -translate-x-1/2`
      case 'left':
        return `${baseClasses} -right-1 top-1/2 -translate-y-1/2`
      case 'right':
        return `${baseClasses} -left-1 top-1/2 -translate-y-1/2`
      default:
        return baseClasses
    }
  }

  const tooltip = isVisible && mounted ? createPortal(
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-md shadow-lg transition-opacity duration-200',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        maxWidth: `${maxWidth}px`
      }}
      onMouseEnter={handleTooltipMouseEnter}
      onMouseLeave={handleTooltipMouseLeave}
    >
      {content}
      <div className={getArrowClasses()} />
    </div>,
    document.body
  ) : null

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      {tooltip}
    </>
  )
}