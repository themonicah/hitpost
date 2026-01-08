"use client";

import { useState, useCallback } from "react";

// Stub implementation - push notifications plugin removed due to compatibility issues
export function usePushNotifications() {
  const [token] = useState<string | null>(null);
  const [permissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");

  const requestPermissions = useCallback(async () => {
    console.log("Push notifications are currently disabled");
    return false;
  }, []);

  return {
    token,
    permissionStatus,
    requestPermissions,
    isSupported: false,
  };
}
