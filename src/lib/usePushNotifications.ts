"use client";

import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from "@capacitor/push-notifications";

type PermissionStatus = "prompt" | "granted" | "denied";

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("prompt");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Push notifications only work on native platforms
    const platform = Capacitor.getPlatform();
    const supported = platform === "ios" || platform === "android";
    setIsSupported(supported);

    if (!supported) {
      console.log("Push notifications not supported on this platform:", platform);
      return;
    }

    // Check current permission status
    PushNotifications.checkPermissions().then((result) => {
      if (result.receive === "granted") {
        setPermissionStatus("granted");
        // Already have permission, register for push
        registerPush();
      } else if (result.receive === "denied") {
        setPermissionStatus("denied");
      } else {
        setPermissionStatus("prompt");
      }
    });

    // Set up listeners
    const registrationListener = PushNotifications.addListener("registration", (token: Token) => {
      console.log("Push registration success:", token.value.substring(0, 20) + "...");
      setToken(token.value);
      saveTokenToServer(token.value);
    });

    const errorListener = PushNotifications.addListener("registrationError", (error) => {
      console.error("Push registration error:", error);
    });

    const notificationListener = PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: PushNotificationSchema) => {
        console.log("Push received:", notification);
        // Could show an in-app notification here
      }
    );

    const actionListener = PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action: ActionPerformed) => {
        console.log("Push action performed:", action);
        // Handle tap on notification - navigate to the dump
        const data = action.notification.data;
        if (data?.type === "new_dump" && data?.dumpId) {
          // Navigate to activity or the specific dump
          window.location.href = "/activity";
        }
      }
    );

    return () => {
      registrationListener.then((l) => l.remove());
      errorListener.then((l) => l.remove());
      notificationListener.then((l) => l.remove());
      actionListener.then((l) => l.remove());
    };
  }, []);

  async function registerPush() {
    try {
      await PushNotifications.register();
    } catch (error) {
      console.error("Failed to register for push:", error);
    }
  }

  async function saveTokenToServer(pushToken: string) {
    try {
      const platform = Capacitor.getPlatform() as "ios" | "android";
      const response = await fetch("/api/push-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: pushToken, platform }),
      });

      if (!response.ok) {
        console.error("Failed to save push token to server");
      } else {
        console.log("Push token saved to server");
      }
    } catch (error) {
      console.error("Error saving push token:", error);
    }
  }

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.log("Push notifications not supported");
      return false;
    }

    try {
      const result = await PushNotifications.requestPermissions();

      if (result.receive === "granted") {
        setPermissionStatus("granted");
        await registerPush();
        return true;
      } else {
        setPermissionStatus("denied");
        return false;
      }
    } catch (error) {
      console.error("Error requesting push permissions:", error);
      return false;
    }
  }, [isSupported]);

  return {
    token,
    permissionStatus,
    requestPermissions,
    isSupported,
  };
}
