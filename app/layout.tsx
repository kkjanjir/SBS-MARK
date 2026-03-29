import './globals.css'
import type { Metadata, Viewport } from 'next'

// Ye phone ke upar wale time/battery bar ka color set karega
export const viewport: Viewport = {
  themeColor: '#1e3a8a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'SBS Shiksha Niketan',
  description: 'Dev By AKASH - School Management System',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SBS ERP',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png', // Apple devices me school logo ke liye
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}