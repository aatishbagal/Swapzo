
"use client";

import type React from 'react';
import { useEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis'; // This line causes the error if the package isn't found

interface LenisScrollProps {
  children: React.ReactNode;
}

const LenisScroll: React.FC<LenisScrollProps> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis();
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
};

export default LenisScroll;
