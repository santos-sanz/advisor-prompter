import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"

// Static fonts that don't rely on client-side JS
const inter = Inter({ subsets: ["latin"] })

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
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
