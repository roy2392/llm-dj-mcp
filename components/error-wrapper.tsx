"use client"

import { useEffect, type ReactNode } from "react"

interface ErrorWrapperProps {
  children: ReactNode
}

export function ErrorWrapper({ children }: ErrorWrapperProps) {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection in ErrorWrapper:", event.reason)
      event.preventDefault()
    }

    // Handle general errors
    const handleError = (event: ErrorEvent) => {
      console.error("Error in ErrorWrapper:", event.error)
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    window.addEventListener("error", handleError)

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
      window.removeEventListener("error", handleError)
    }
  }, [])

  return <>{children}</>
}
