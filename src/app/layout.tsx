import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

/**
 * Absolute base for the social-card URLs. Vercel exposes the production domain;
 * anywhere else set NEXT_PUBLIC_SITE_URL.
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000'

/**
 * The icons and social cards themselves come from the file-based metadata next
 * to this file (`icon.svg`, `favicon.ico`, `apple-icon.png`, `opengraph-image.png`,
 * `twitter-image.png`) — Next.js emits the matching tags automatically.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Matemātikas treniņi',
    template: '%s · Matemātikas treniņi',
  },
  description: 'Matemātikas treniņi bērniem — reizināšana no 1 līdz 10.',
  applicationName: 'Matemātikas treniņi',
  appleWebApp: {
    capable: true,
    title: 'Treniņi',
    statusBarStyle: 'default',
  },
  openGraph: {
    type: 'website',
    siteName: 'Matemātikas treniņi',
    locale: 'lv_LV',
    url: '/',
    title: 'Matemātikas treniņi',
    description: 'Matemātikas treniņi bērniem — reizināšana no 1 līdz 10.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Matemātikas treniņi',
    description: 'Matemātikas treniņi bērniem — reizināšana no 1 līdz 10.',
  },
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
