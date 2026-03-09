import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react"

interface CustomAlertProps {
  title: string
  description: string
  variant?: "default" | "success" | "error"
}

export function CustomAlert({ title, description, variant = "default" }: CustomAlertProps) {
  const variants = {
    default: {
      className: "bg-background text-foreground",
      icon: AlertCircle
    },
    success: {
      className: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50 text-green-600 dark:text-green-400",
      icon: CheckCircle2
    },
    error: {
      className: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50 text-red-600 dark:text-red-400",
      icon: XCircle
    }
  }

  const { className, icon: Icon } = variants[variant]

  return (
    <Alert className={`${className} animate-in fade-in-0 slide-in-from-top-5 duration-300`}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="font-medium">{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
} 