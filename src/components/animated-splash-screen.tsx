
"use client";

import Image from 'next/image';
import type React from 'react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation'; 

export function AnimatedSplashScreen() {
  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith('/dashboard');

  const [showComponent, setShowComponent] = useState(!isDashboardRoute);
  const [animationStep, setAnimationStep] = useState(0); 

  useEffect(() => {
    if (isDashboardRoute) {
      setShowComponent(false);
      return;
    }

    if (showComponent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showComponent, isDashboardRoute]);

  useEffect(() => {
    if (!showComponent || isDashboardRoute) {
      return;
    }

    let timers: NodeJS.Timeout[] = [];
    if (animationStep === 0) {
      // Initial state: Gradient visible, logo starts invisible and scaled up
      // Transition to step 1 to start logo animation
      timers.push(setTimeout(() => setAnimationStep(1), 50)); 
    } else if (animationStep === 1) {
      // Logo animates in
      timers.push(setTimeout(() => setAnimationStep(2), 700)); 
    } else if (animationStep === 2) {
      // Hold visible state
      timers.push(setTimeout(() => setAnimationStep(3), 1500)); 
    } else if (animationStep === 3) {
      // Start animating out
      timers.push(setTimeout(() => setShowComponent(false), 700));
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [animationStep, showComponent, isDashboardRoute]);

  if (!showComponent || isDashboardRoute) {
    return null;
  }

  // This is the layer that slides and has the gradient
  const slidingLayerClasses = cn(
    "absolute inset-0",
    "bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--background))] to-[hsl(var(--accent))]", // Merged opaque gradient
    "transition-all duration-700 ease-in-out",
    {
      "translate-x-0 opacity-100": animationStep === 0 || animationStep === 1 || animationStep === 2, // Start visible and in place
      "translate-x-full opacity-0": animationStep === 3, // Slide out to the right
    }
  );

  const logoClasses = cn(
    "transition-all ease-out duration-700", 
    {
      "scale-150 opacity-0": animationStep === 0,                 // Starts scaled up and invisible
      "scale-100 opacity-100": animationStep === 1 || animationStep === 2, // Animates to normal size and visible
      "scale-75 opacity-0": animationStep === 3,                  // Scales down and fades out
    }
  );
  
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center" // No background here
      aria-hidden={animationStep !== 2 && animationStep !== 1}
    >
      <div className={slidingLayerClasses} />
      <Image
        src="/assets/Swapzo-logo_V1.png" // Use public path
        alt="SwapZo Splash Logo"
        width={180}
        height={180}
        priority
        className={cn("relative z-10", logoClasses)} 
      />
    </div>
  );
}
