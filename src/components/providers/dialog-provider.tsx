"use client"

import { DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import * as React from "react"

export function DialogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  )
} 