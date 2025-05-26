
// NO "use client"; directive here
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
// Header is imported but its internal logic will decide if it renders
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster";
import { BottomNavbar } from '@/components/layout/bottom-navbar';
import { AnimatedSplashScreen } from '@/components/animated-splash-screen';
import LenisScroll from '@/components/lenis-scroll';
import MainContentWrapper from '@/components/layout/main-content-wrapper';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Metadata can be exported because this is a Server Component
export const metadata: Metadata = {
  title: 'SwapZo - Exchange What You Have. Discover What You Need.',
  description: 'A global platform for direct peer-to-peer exchange of skills, services, and goods with SwapZo.',
  icons: {
    icon: '/assets/Swapzo-logo_V1.png', // Ensure this path is correct relative to the public folder
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LenisScroll> {/* LenisScroll can be a client component */}
            <div className="flex flex-col min-h-screen">
              <AnimatedSplashScreen /> {/* Can be a client component */}
              <Header /> {/* Header decides internally (client-side) if it should render */}
              <MainContentWrapper>{children}</MainContentWrapper> {/* Wrapper handles conditional padding (client-side) */}
              <Footer />
              <BottomNavbar /> {/* BottomNavbar decides internally (client-side) if it should render */}
            </div>
            <Toaster /> {/* Toaster is typically a client component */}
          </LenisScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
