"use client";

import { useEffect, useCallback, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token, PushNotificationSchema } from "@capacitor/push-notifications";

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");

  const registerToken = useCallback(async (pushToken: string) => {
    try {
      const platform = Capacitor.getPlatform() as "ios" | "android" | "web";
      await fetch("/api/push-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: pushToken, platform }),
      });
      setToken(pushToken);
    } catch (error) {
      console.error("Failed to register push token:", error);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log("Push notifications are only available on native platforms");
      return false;
    }

    try {
      const result = await PushNotifications.requestPermissions();

      if (result.receive === "granted") {
        setPermissionStatus("granted");
        await PushNotifications.register();
        return true;
      } else {
        setPermissionStatus("denied");
        return false;
      }
    } catch (error) {
      console.error("Failed to request push permissions:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Check current permission status
    PushNotifications.checkPermissions().then((status) => {
      if (status.receive === "granted") {
        setPermissionStatus("granted");
        PushNotifications.register();
      } else if (status.receive === "denied") {
        setPermissionStatus("denied");
      }
    });

    // Listen for registration success
    const registrationListener = PushNotifications.addListener(
      "registration",
      (token: Token) => {
        console.log("Push registration success:", token.value);
        registerToken(token.value);
      }
    );

    // Listen for registration errors
    const errorListener = PushNotifications.addListener(
      "registrationError",
      (error) => {
        console.error("Push registration error:", error);
      }
    );

    // Listen for push notifications received while app is open
    const notificationListener = PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: PushNotificationSchema) => {
        console.log("Push notification received:", notification);
      }
    );

    // Listen for push notification action (user tapped notification)
    const actionListener = PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (notification) => {
        console.log("Push notification action:", notification);
        // Navigate to the dump view if URL is provided
        const url = notification.notification.data?.url;
        if (url) {
          window.location.href = url;
        }
      }
    );

    return () => {
      registrationListener.then((l) => l.remove());
      errorListener.then((l) => l.remove());
      notificationListener.then((l) => l.remove());
      actionListener.then((l) => l.remove());
    };
  }, [registerToken]);

  return {
    token,
    permissionStatus,
    requestPermissions,
    isSupported: Capacitor.isNativePlatform(),
  };
}
