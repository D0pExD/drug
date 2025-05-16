import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'drug-lab',
  description: 'drug-lab ui by d0pe',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
