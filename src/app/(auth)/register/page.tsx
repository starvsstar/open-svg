'use client'

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FaGithub, FaTimes } from "react-icons/fa"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { getProviders, signIn } from "next-auth/react"
import { RegisterSchema } from "@/schemas"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { CustomAlert } from "@/components/ui/custom-alert"
import { ModalAlert } from "@/components/ui/modal-alert"
import Link from "next/link"

type SocialProvider = "google" | "github"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [enabledProviders, setEnabledProviders] = useState<SocialProvider[]>([])
  const { theme, setTheme } = useTheme()
  const [errors, setErrors] = useState<{
    email?: string[];
    password?: string[];
    username?: string[];
  }>({})
  const { toast } = useToast()
  const [alertState, setAlertState] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "default" | "success" | "error";
  }>({
    open: false,
    title: "",
    description: "",
    variant: "default",
  })

  const callbackUrl = searchParams?.get("callbackUrl") || "/my-svgs"
  const redirectUrl = searchParams?.get("redirect") || "/my-svgs"

  useEffect(() => {
    let cancelled = false

    const loadProviders = async () => {
      try {
        const providers = await getProviders()
        if (cancelled || !providers) {
          return
        }

        setEnabledProviders(
          (["google", "github"] as SocialProvider[]).filter((provider) => provider in providers)
        )
      } catch {
        if (!cancelled) {
          setEnabledProviders([])
        }
      }
    }

    loadProviders()

    return () => {
      cancelled = true
    }
  }, [])

  const validateField = (field: "email" | "password" | "username", value: string) => {
    try {
      if (field === "email") {
        if (!value.trim()) {
          setErrors((prev) => ({ ...prev, email: undefined }))
          return false
        }

        const supportedEmails = [
          "gmail.com",
          "outlook.com",
          "hotmail.com",
          "yahoo.com",
          "qq.com",
          "163.com",
        ]

        const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if (!basicEmailRegex.test(value)) {
          setErrors((prev) => ({
            ...prev,
            email: ["Please enter a valid email address"],
          }))
          return false
        }

        const emailDomain = value.split("@")[1]
        if (!supportedEmails.includes(emailDomain)) {
          setErrors((prev) => ({
            ...prev,
            email: ["Only gmail, outlook, hotmail, yahoo, qq, 163 email addresses are supported"],
          }))
          return false
        }

        RegisterSchema.shape.email.parse(value)
        setErrors((prev) => ({ ...prev, email: undefined }))
        return true
      }

      if (field === "password") {
        RegisterSchema.shape.password.parse(value)
        setErrors((prev) => ({ ...prev, password: undefined }))
        return true
      }

      RegisterSchema.shape.username.parse(value)
      setErrors((prev) => ({ ...prev, username: undefined }))
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({
          ...prev,
          [field]: error.errors.map((err) => err.message),
        }))
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const isEmailValid = validateField("email", email)
    const isPasswordValid = validateField("password", password)
    const isUsernameValid = validateField("username", username)

    if (!isEmailValid || !isPasswordValid || !isUsernameValid) {
      return
    }

    try {
      setLoading(true)

      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            username,
          }),
        })

        const responseText = await res.text()

        let data
        try {
          data = JSON.parse(responseText)
        } catch {
          data = { error: responseText }
        }

        if (!res.ok) {
          if (typeof data.error === "string") {
            switch (data.error) {
              case "Email already exists":
                setAlertState({
                  open: true,
                  title: "Email Already Exists",
                  description: "This email is already registered. Please login or use another email",
                  variant: "error",
                })
                break
              case "Username already exists":
                toast({
                  title: "Registration Notice",
                  description: (
                    <CustomAlert
                      title="Username Already Exists"
                      description="This username is already taken, please choose another one"
                      variant="error"
                    />
                  ),
                })
                break
              default:
                if (data.error.includes(",")) {
                  const serverErrors = data.error.split(",").map((err: string) => err.trim())
                  serverErrors.forEach((error: string) => {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: error,
                    })
                  })
                } else {
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: data.error || "Registration failed, please try again later",
                  })
                }
            }
          } else {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Registration failed, please try again later",
            })
          }
          return
        }

        toast({
          title: "Success",
          description: "Registration successful!",
        })

        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Auto login failed, please login manually",
          })
          router.push("/login")
          return
        }

        router.push(redirectUrl)
        router.refresh()
      } catch (error) {
        console.error("Registration error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred during registration, please try again later",
        })
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred, please try again later",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: SocialProvider) => {
    try {
      setLoading(true)
      await signIn(provider, { callbackUrl })
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Social login failed",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      <div className="w-[600px] p-10 rounded-3xl bg-card/30 backdrop-blur-xl shadow-2xl border">
        <h1 className="text-2xl font-semibold text-center mb-8">
          Create New Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className={cn(errors.username && "text-destructive")}>
              Username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => validateField("username", username)}
              className={cn(errors.username && "border-destructive focus-visible:ring-destructive")}
            />
            {errors.username && (
              <div className="text-sm text-destructive mt-1">
                {errors.username.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className={cn(errors.email && "text-destructive")}>
              Email
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => validateField("email", email)}
                className={cn(
                  "pr-10",
                  errors.email && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {email && (
                <button
                  type="button"
                  onClick={() => {
                    setEmail("")
                    setErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <FaTimes />
                </button>
              )}
            </div>
            {errors.email && (
              <div className="text-sm text-destructive mt-1">
                {errors.email.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className={cn(errors.password && "text-destructive")}>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => validateField("password", password)}
              className={cn(errors.password && "border-destructive focus-visible:ring-destructive")}
            />
            {errors.password && (
              <div className="text-sm text-destructive mt-1">
                {errors.password.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registering...
              </div>
            ) : "Register"}
          </Button>
        </form>

        {enabledProviders.length > 0 && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center space-x-6">
              {enabledProviders.includes("google") && (
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full transition-all hover:scale-105 hover:-translate-y-0.5 bg-white dark:bg-gray-950 group border-gray-200 dark:border-gray-800"
                  onClick={() => handleSocialLogin("google")}
                  disabled={loading}
                >
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </div>
                </Button>
              )}

              {enabledProviders.includes("github") && (
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full transition-all hover:scale-105 hover:-translate-y-0.5 bg-[#24292e] hover:bg-[#2f363d] dark:bg-gray-950 dark:hover:bg-gray-900 group"
                  onClick={() => handleSocialLogin("github")}
                  disabled={loading}
                >
                  <FaGithub className="w-5 h-5 text-white dark:group-hover:text-white" />
                </Button>
              )}
            </div>
          </>
        )}

        <div className="text-center mt-6 text-muted-foreground">
          Already have an account?
          <Link href="/login" className="ml-1">
            <Button variant="link" className="px-1">
              Login
            </Button>
          </Link>
        </div>
      </div>

      <ModalAlert
        open={alertState.open}
        onOpenChange={(open) => setAlertState((prev) => ({ ...prev, open }))}
        title={alertState.title}
        description={alertState.description}
        variant={alertState.variant}
      />
    </div>
  )
}
