import type { Metadata, Viewport } from 'next';
import { Quicksand, Geist_Mono } from 'next/font/google';
import './globals.css';
import { RegisterSW } from '@/components/pwa/register-sw';
import { Toaster } from '@/components/ui/sonner';

const quicksand = Quicksand({
  variable: '--font-quicksand',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Wata',
  description: 'The one-handed baby tracker — feeds, sleep, and diapers logged in a tap or two.',
  applicationName: 'Wata',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Wata',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#f4efe9',
  width: 'device-width',
  initialScale: 1,
  // Tired thumbs double-tap; never let that zoom the UI.
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Warm pastel light is the default; .dark is the opt-in night-nursery variant.
    <html lang="en" className={`${quicksand.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        {/* position=top-center: the bottom is the thumb bar's; toasts must not cover it */}
        <Toaster position="top-center" />
        <RegisterSW />
      </body>
    </html>
  );
}
