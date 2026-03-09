'use client'

import * as React from "react"
import { Canvas } from "@/components/editor/Canvas"
import { Toolbar } from "@/components/editor/Toolbar"
import { PropertyPanel } from "@/components/editor/PropertyPanel"

export default function EditorPage() {
  return (
    <div className="flex h-screen">
      <Toolbar />
      
      <div className="flex-1 flex">
        <Canvas />
      </div>

      <PropertyPanel />
    </div>
  )
} 