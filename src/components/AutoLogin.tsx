"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AutoLogin() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    async function autoLogin() {
      try {
        // Get or create device ID
        let deviceId = localStorage.getItem("hitpost_device_id");
        if (!deviceId) {
          deviceId = crypto.randomUUID();
          localStorage.setItem("hitpost_device_id", deviceId);
        }

        // Call device auth API
        const res = await fetch("/api/auth/device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        });

        if (res.ok) {
          // Refresh the page to load logged-in state
          router.refresh();
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Auto-login failed:", error);
        setStatus("error");
      }
    }

    autoLogin();
  }, [router]);

  if (status === "error") {
    return (
      <div className="text-center">
        <p className="text-red-500 mb-4">Something went wrong</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500">Setting up your account...</p>
    </div>
  );
}
