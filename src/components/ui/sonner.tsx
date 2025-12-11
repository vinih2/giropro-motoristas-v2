"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        className:
          "rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white",
        descriptionClassName: "text-gray-600 dark:text-gray-300",
        actionButtonStyle: {
          background: "var(--gray-900)",
          color: "white",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
