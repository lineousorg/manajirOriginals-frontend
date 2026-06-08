"use client"
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function ScrollToTop() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}