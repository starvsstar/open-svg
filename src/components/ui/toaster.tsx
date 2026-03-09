"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast
            key={id}
            className="group"
            {...props}
          >
            {title && (
              <ToastTitle className="[&+div]:mt-1">{title}</ToastTitle>
            )}
            {description && (
              <ToastDescription>{description}</ToastDescription>
            )}
            <ToastClose className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
} 