import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Background remover - Remove.bg',
  description: 'Created with ☕️ and ❤️ by the Remove.bg team(harshit)',
  generator : 'Harshit Agarwal - harshit3478(linkedin)',
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
