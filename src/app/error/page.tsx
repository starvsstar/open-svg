'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import Link from "next/link"

const ErrorPage = () => {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">认证错误</h1>
        <p className="text-muted-foreground mb-6">
          {error === 'CredentialsSignin' 
            ? '邮箱或密码错误' 
            : '登录过程中发生错误，请重试'}
        </p>
        <Button asChild>
          <Link href="/login">
            返回登录
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default ErrorPage 