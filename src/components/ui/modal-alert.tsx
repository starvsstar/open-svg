"use client"

import { Dialog, DialogPortal } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ModalAlertProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description: string
  variant?: "default" | "success" | "error"
}

export function ModalAlert({ 
  open, 
  onOpenChange, 
  title = "提示", 
  description,
  variant = "default" 
}: ModalAlertProps) {
  // 根据不同状态显示不同的颜色
  const variantStyles = {
    default: {
      button: "bg-blue-500/90 hover:bg-blue-500 text-white",
      border: "border-blue-100 dark:border-blue-900/50",
      title: "text-blue-600 dark:text-blue-400"
    },
    success: {
      button: "bg-green-500/90 hover:bg-green-500 text-white",
      border: "border-green-100 dark:border-green-900/50",
      title: "text-green-600 dark:text-green-400"
    },
    error: {
      button: "bg-red-500/90 hover:bg-red-500 text-white",
      border: "border-red-100 dark:border-red-900/50",
      title: "text-red-600 dark:text-red-400"
    }
  }

  const styles = variantStyles[variant]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <div className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]">
          <div className={cn(
            "w-[360px] bg-background rounded-md",
            "border shadow-lg",
            styles.border,
            "animate-in fade-in-0 zoom-in-95 duration-200"
          )}>
            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <span className={cn(
                "text-sm font-medium",
                styles.title
              )}>
                {title}
              </span>
              <button
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground/60 hover:text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 内容区 */}
            <div className="px-8 py-6">
              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-sm text-muted-foreground/90">
                  {description}
                </p>
              </div>
            </div>

            {/* 按钮区 */}
            <div className="pb-6 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className={cn(
                  "h-8 px-8 rounded-full shadow-sm",
                  "text-xs font-medium",
                  "transition-all duration-200",
                  "hover:shadow-md active:shadow-sm",
                  styles.button
                )}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  )
} 