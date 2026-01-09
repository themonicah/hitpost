"use client";

import { useState, useEffect } from "react";
import SplashScreen from "./SplashScreen";
import { usePushNotifications } from "@/lib/usePushNotifications";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  const { permissionStatus, requestPermissions, isSupported } = usePushNotifications();

  useEffect(() => {
    setMounted(true);
    // Check if splash was already shown this session
    const splashShown = sessionStorage.getItem("splashShown");
    if (splashShown) {
      setShowSplash(false);
    }
  }, []);

  // Show push prompt after splash completes (only on native, only if not already granted/denied)
  useEffect(() => {
    if (!showSplash && isSupported && permissionStatus === "prompt") {
      // Check if we've already asked this session
      const pushPromptShown = sessionStorage.getItem("pushPromptShown");
      if (!pushPromptShown) {
        // Small delay for better UX
        const timer = setTimeout(() => {
          setShowPushPrompt(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [showSplash, isSupported, permissionStatus]);

  function handleSplashComplete() {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
  }

  async function handleEnableNotifications() {
    sessionStorage.setItem("pushPromptShown", "true");
    await requestPermissions();
    setShowPushPrompt(false);
  }

  function handleSkipNotifications() {
    sessionStorage.setItem("pushPromptShown", "true");
    setShowPushPrompt(false);
  }

  // Don't show splash during SSR
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {children}

      {/* Push notification permission prompt */}
      {showPushPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <div className="text-4xl mb-3">🔔</div>
              <h2 className="text-xl font-bold mb-2 dark:text-white">
                Never miss a meme
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get notified when friends send you fresh dumps. No cap, just memes.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleEnableNotifications}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-500 hover:to-orange-600 transition-all"
                >
                  Enable Notifications
                </button>
                <button
                  onClick={handleSkipNotifications}
                  className="w-full py-2 px-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
