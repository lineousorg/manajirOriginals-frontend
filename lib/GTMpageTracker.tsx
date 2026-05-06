"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function GTMPageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    window.dataLayer.push({
      event: "page_view",
      page_path: pathname,
    });
  }, [pathname]);

  return null;
}