"use client";

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
  const isLandingPage = pathname === '/';
  
  const isGlobalHeaderVisible = !isAuthPage && !isDashboardPage;

  const shouldApplyMainPadding = isGlobalHeaderVisible;

  return (
    <main className={cn(
      "flex-grow flex flex-col",
      isLandingPage && "pt-[4.5rem]" 
    )}>
      {children}
    </main>
  );
}
