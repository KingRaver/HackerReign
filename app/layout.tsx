import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

// Font Configuration
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Viewport Configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true
};

// Metadata Configuration - Enterprise AI Assistant
export const metadata: Metadata = {
  title: '🐺 Hacker Reign | Enterprise AI Assistant',
  description: 'Free, localized enterprise-grade AI/LLM assistant. Python & Next.js powered. Offline processing. Voice-enabled conversation. Built with Ollama for privacy-first intelligence.',
  keywords: [
    'AI Assistant',
    'Enterprise AI',
    'LLM',
    'Local AI',
    'Privacy-focused',
    'Offline AI',
    'Voice Assistant',
    'Code Review',
    'Learning Mode',
    'Expert Mode',
    'Ollama',
    'Open Source'
  ],
  authors: [
    {
      name: 'Hacker Reign',
      url: 'https://hackerreign.local'
    }
  ],
  creator: 'Hacker Reign Team',
  publisher: 'Hacker Reign',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hackerreign.local',
    siteName: 'Hacker Reign',
    title: '🐺 Hacker Reign | Enterprise AI Assistant',
    description: 'Free, localized enterprise-grade AI/LLM assistant with voice interaction and offline processing.'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent'
  },
  icons: {
    icon: '🐺',
    apple: '🐺'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect for font optimization */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Smooth scroll behavior */}
        <style>{`
          html {
            scroll-behavior: smooth;
          }
        `}</style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden overflow-y-auto bg-linear-to-br from-slate-50 via-cyan-50/30 to-slate-50`}
        suppressHydrationWarning
      >
        {/* 
          Root Layout Structure for Sticky TopNav + Chat
          
          - overflow-x-hidden: Prevents horizontal scroll on any viewport width
          - overflow-y-auto: Allows vertical scrolling for message history
          - antialiased: Smooth font rendering across all text
          - bg-gradient: Light professional gradient background
          
          Child component (Chat) manages:
          - TopNav with sticky positioning (z-50) and vibrant gradient
          - Messages container with scrollable area and light background
          - Input area (voice or text mode)
          
          This layout provides the HTML/body foundation and global styles.
        */}
        {children}
      </body>
    </html>
  );
}