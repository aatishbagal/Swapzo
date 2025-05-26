
"use client"; // This component handles client-side logic

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type React from 'react';

interface MainContentWrapperProps {
  children: React.ReactNode;
}

export default function MainContentWrapper({ children }: MainContentWrapperProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/auth';
  const isDashboardPage = pathname.startsWith('/dashboard');
  
  // Determine if the global header is visible based on the path.
  // The global header (from layout.tsx) hides itself on /auth and /dashboard/* routes.
  const isGlobalHeaderVisible = !isAuthPage && !isDashboardPage;

  // Apply top padding only if the global fixed header is intended to be visible on the current page.
  const shouldApplyMainPadding = isGlobalHeaderVisible;

  return (
    <main className={cn(
      "flex-grow flex flex-col", // Basic structure for main content area
      shouldApplyMainPadding && "pt-[4.5rem]" // Apply padding if global header is visible
    )}>
      {children}
    </main>
  );
}
