'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';

export default function SmoothScroll({ children }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.8,                // longer = more momentum / inertia feel
      easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)), // strong expo ease-out
      smoothWheel: true,
      wheelMultiplier: 0.8,         // slightly reduced so each tick travels further with more glide
      touchMultiplier: 2.0,         // responsive on touch / trackpad
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
