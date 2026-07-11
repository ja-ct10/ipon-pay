"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      gap={8}
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-400" />
        ),
        info: (
          <InfoIcon className="size-4 text-blue-400" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-400" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-red-400" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-emerald-400" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast !rounded-2xl !border !border-white/10 !bg-[oklch(0.11_0.018_243/0.97)] !backdrop-blur-2xl !shadow-2xl !shadow-black/40 !text-foreground !px-5 !py-4",
          title: "!text-sm !font-medium !text-[oklch(0.94_0.006_240)]",
          description: "!text-xs !text-[oklch(0.62_0.014_240)]",
          actionButton:
            "!bg-emerald-500 !text-emerald-950 !text-xs !font-medium !rounded-lg !px-3 !py-1.5 hover:!bg-emerald-400 !transition-colors !border-0",
          cancelButton:
            "!bg-white/5 !text-foreground/70 !text-xs !font-medium !rounded-lg !px-3 !py-1.5 !border !border-white/10 hover:!bg-white/10 !transition-colors",
          success: "!border-emerald-500/25",
          error: "!border-red-500/25",
          warning: "!border-amber-500/25",
          info: "!border-blue-500/25",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
