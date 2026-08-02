import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Matemātikas treniņi',
    template: '%s · Matemātikas treniņi',
  },
  description: 'Matemātikas treniņi bērniem — reizināšana no 1 līdz 10.',
}

/** Mobile first: fill the notch area and keep the browser chrome on-theme. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fdf4ff' },
    { media: '(prefers-color-scheme: dark)', color: '#17102b' },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="lv">
      <body>{children}</body>
    </html>
  )
}
