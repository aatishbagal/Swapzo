
"use client";

import Link from "next/link";
import { Home, Lightbulb, Zap, Sparkles, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";
import { usePathname } from "next/navigation";


export function BottomNavbar() {
  const navItems = [
    { href: "/#hero-content", icon: Home, label: "Home" }, // Updated link
    { href: "/#how-it-works", icon: Lightbulb, label: "How It Works" },
    { href: "/auth", icon: Zap, label: "Get Started", isCentral: true }, // Links to auth
    { href: "/#possibilities", icon: Sparkles, label: "Possibilities" },
    { href: "/#features", icon: ListChecks, label: "Features" },
  ];
  
  const pathname = usePathname();
  // Only show bottom navbar on the homepage
  if (pathname !== '/') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4 z-40 md:hidden">
      <nav className={cn(
        "flex items-end justify-around gap-1 rounded-full p-2 shadow-xl",
        "bg-background/80 backdrop-blur-lg" // Glassmorphism effect
      )}>
        {navItems.map((item) => (
          <Link key={item.label} href={item.href} passHref legacyBehavior>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center justify-center rounded-full group",
                item.isCentral
                  ? "h-16 w-16 bg-primary hover:bg-primary/90 text-primary-foreground transform -translate-y-3 shadow-lg"
                  : "h-12 w-12 text-foreground/80 hover:bg-foreground/10 hover:text-primary"
              )}
              aria-label={item.label}
            >
              <item.icon className={cn(item.isCentral ? "h-7 w-7" : "h-6 w-6")} />
            </Button>
          </Link>
        ))}
      </nav>
    </div>
  );
}

    