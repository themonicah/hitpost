"use client";

import { useState, useEffect } from "react";
import SplashScreen from "./SplashScreen";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if splash was already shown this session
    const splashShown = sessionStorage.getItem("splashShown");
    if (splashShown) {
      setShowSplash(false);
    }
  }, []);

  function handleSplashComplete() {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
  }

  // Don't show splash during SSR
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {children}
    </>
  );
}
