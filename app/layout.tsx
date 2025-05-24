import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "DJ LLM - AI Playlist Generator",
  description: "Generate AI-curated playlists and save them to Spotify",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Global error handler for unhandled promise rejections
              window.addEventListener('unhandledrejection', function(event) {
                console.error('Unhandled promise rejection:', event.reason);
                event.preventDefault();
              });
              
              // Global error handler for JavaScript errors
              window.addEventListener('error', function(event) {
                console.error('Global error:', event.error);
              });
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
