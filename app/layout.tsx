import './globals.css'

export const metadata = {
  title: 'SBS Marksheet Generator',
  description: 'Pro Marksheet Generator for SBS Shiksha Niketan',
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