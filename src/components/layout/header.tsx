"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { Logo } from '@/components/logo';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  if (pathname === '/auth' || 
      pathname.startsWith('/dashboard') || 
      pathname.startsWith('/profile') || 
      pathname.startsWith('/offers') || 
      pathname.startsWith('/needs') ||
      pathname.startsWith('/messages') ||
      pathname.startsWith('/history') ||
      pathname.startsWith('/settings')) {
    return null;
  }

  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="container mx-auto flex max-w-screen-lg items-center justify-between gap-2 rounded-full bg-card/80 px-4 py-2 shadow-lg backdrop-blur-md mt-3">
        {/* Left: Logo */}
        <div>
          <Logo />
        </div>

        {/* Center: Navigation Links (Hidden on Mobile) */}
        <nav className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/#features">Features</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/#how-it-works">How It Works</Link>
          </Button>
           <Button variant="ghost" size="sm" asChild>
            <Link href="/#possibilities">Possibilities</Link>
          </Button>
        </nav>

        {/* Right: Auth Buttons & Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="rounded-full">
            <Link href="/auth">Sign In</Link>
          </Button>
          <Button size="sm" asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/auth">Sign Up</Link>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}