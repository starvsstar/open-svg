'use client'

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/layout/UserNav"

const PricingPage = () => {
  const { data: session } = useSession()
  const router = useRouter()

  const plans = [
    {
      name: "Monthly",
      price: "$19.9",
      period: "/mo",
      description: "Perfect for short-term projects",
      features: [
        "Unlimited SVG creation",
        "Basic editing tools",
        "Standard export formats",
        "Email support",
        "Basic analytics",
      ],
      buttonText: "Get Started",
      buttonVariant: "outline",
      gradient: "from-blue-500/20 via-transparent to-transparent",
      iconGradient: "from-blue-500 to-blue-600",
      hoverGradient: "hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-transparent",
    },
    {
      name: "Subscription",
      price: "$17.9",
      period: "/mo",
      description: "Best for regular users",
      features: [
        "Everything in Monthly",
        "Advanced editing tools",
        "Cloud sync",
        "Priority support",
        "Detailed analytics",
        "Custom themes",
      ],
      buttonText: "Subscribe Now",
      buttonVariant: "default",
      highlight: true,
      savings: "Save $2/mo",
      gradient: "from-purple-500/20 via-transparent to-transparent",
      iconGradient: "from-purple-500 to-purple-600",
      hoverGradient: "hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-transparent",
    },
    {
      name: "Yearly",
      price: "$15.9",
      period: "/mo",
      yearlyTotal: "$190.8/year",
      description: "Most cost-effective",
      features: [
        "Everything in Subscription",
        "API access",
        "Team collaboration",
        "Dedicated manager",
        "Custom integration",
        "Premium support 24/7",
      ],
      buttonText: "Get Best Value",
      buttonVariant: "outline",
      savings: "Save $4/mo",
      gradient: "from-emerald-500/20 via-transparent to-transparent",
      iconGradient: "from-emerald-500 to-emerald-600",
      hoverGradient: "hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-transparent",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed w-full bg-background/80 backdrop-blur-sm border-b z-50">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Image src="/logo.svg" alt="Logo" width={24} height={24} />
            <span className="text-lg font-medium">SVG Studio</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link href="/blog" className="text-muted-foreground hover:text-foreground">Blog</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
            <ThemeToggle />
            {session ? (
              <UserNav />
            ) : (
              <Link 
                href="/login" 
                className="text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-24">
        {/* Header */}
        <div className="text-center mb-16 pt-8">
          <div className="flex justify-center">
            <h1 className="text-5xl font-bold">
              Simple, Transparent Pricing
            </h1>
          </div>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that&apos;s right for you, upgrade or downgrade anytime
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 bg-card backdrop-blur-xl border 
                transition-all duration-500 
                bg-gradient-to-r ${plan.gradient}
                ${plan.hoverGradient}
                hover:translate-y-[-8px] hover:shadow-xl
                ${plan.highlight ? 'shadow-lg ring-1 ring-purple-500/20' : ''}
              `}
            >
              {plan.savings && (
                <div className={`absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full 
                  bg-gradient-to-r ${plan.iconGradient}
                  px-4 py-1 text-sm font-medium text-white
                  shadow-lg shadow-purple-500/20
                `}>
                  {plan.savings}
                </div>
              )}
              <div className="flex flex-col h-full">
                <div>
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <div className="mt-3">
                    <div className="flex items-baseline">
                      <div className="relative">
                        <span className={`text-4xl font-bold ${
                          plan.highlight 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : 'text-foreground'
                        }`}>
                          {plan.price}
                        </span>
                        <div className={`absolute -bottom-2 left-0 right-0 h-[2px] bg-gradient-to-r ${plan.iconGradient} rounded-full opacity-50`}></div>
                      </div>
                      <span className="ml-1 text-muted-foreground">{plan.period}</span>
                    </div>
                    {plan.yearlyTotal && (
                      <div className="mt-1 text-sm text-muted-foreground">
                        Billed as {plan.yearlyTotal}
                      </div>
                    )}
                    <p className="mt-2 text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="mt-6 space-y-3 flex-1">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center group">
                        <div className={`p-0.5 rounded-full bg-gradient-to-r ${plan.iconGradient} 
                          shadow-sm transition-shadow group-hover:shadow-md`}>
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="ml-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`mt-8 w-full transition-all duration-300
                      ${plan.highlight
                        ? `bg-gradient-to-r ${plan.iconGradient} text-white hover:shadow-lg hover:shadow-purple-500/20`
                        : `hover:bg-gradient-to-r ${plan.iconGradient} hover:text-white`
                      }
                    `}
                    variant={plan.buttonVariant as any}
                    onClick={() => !session && router.push('/login')}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Money-back guarantee */}
        <div className="text-center mt-16 mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-muted-foreground">
              14-day money-back guarantee
            </span>
          </div>
          <p className="mt-4 text-muted-foreground">
            If you have any questions,{' '}
            <Link href="/contact" className="text-purple-500 hover:underline">
              contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default PricingPage 