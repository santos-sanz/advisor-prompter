import type React from "react"
import "./globals.css"

// Import the handwriting fonts
import "@fontsource/architects-daughter"
import "@fontsource/indie-flower"
import "@fontsource/caveat"

export const metadata = {
  title: "Career Prompt Builder",
  description: "Build personalized prompts for career advice",
}

// Move providers to a separate client component
import { Providers } from "@/components/providers"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="https://tally.so/widgets/embed.js"></script>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
