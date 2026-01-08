"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DumpLandingClientProps {
  dump: {
    id: string;
    note: string | null;
    share_token: string;
    meme_count: number;
  };
  senderEmail: string;
  previewMemes: {
    id: string;
    file_url: string;
    file_type: string;
  }[];
  isLoggedIn: boolean;
  userId?: string;
}

export default function DumpLandingClient({
  dump,
  senderEmail,
  previewMemes,
  isLoggedIn,
  userId,
}: DumpLandingClientProps) {
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");

  const senderName = senderEmail.split("@")[0];

  async function handleClaim() {
    if (!isLoggedIn) {
      // Store the share token and redirect to login
      if (typeof window !== "undefined") {
        localStorage.setItem("pendingDumpClaim", dump.share_token);
      }
      router.push("/?login=true");
      return;
    }

    setClaiming(true);
    setError("");

    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareToken: dump.share_token }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to inbox to view the dump
        router.push("/inbox");
      } else {
        setError(data.error || "Failed to claim dump");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="pt-14 px-4 pb-4">
        <div className="flex items-center justify-center">
          <h1 className="text-white text-xl font-bold">HitPost</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        {/* Preview Grid */}
        <div className="w-full max-w-xs mb-6">
          <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden">
            {previewMemes.map((meme, i) => (
              <div key={meme.id} className="aspect-square bg-white/10 relative">
                {meme.file_type === "video" ? (
                  <video
                    src={meme.file_url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={meme.file_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Blur overlay */}
                <div className="absolute inset-0 backdrop-blur-md bg-black/30" />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="text-center mb-8">
          <p className="text-white/60 text-sm mb-1">
            {senderName} sent you a meme dump
          </p>
          <h2 className="text-white text-2xl font-bold mb-2">
            {dump.note || "Meme Dump"}
          </h2>
          <p className="text-white/40 text-sm">
            {dump.meme_count} meme{dump.meme_count !== 1 ? "s" : ""}
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full max-w-xs py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold text-lg rounded-2xl disabled:opacity-50"
        >
          {claiming ? "Opening..." : isLoggedIn ? "View Dump" : "Open in HitPost"}
        </button>

        {error && (
          <p className="text-red-400 text-sm mt-4">{error}</p>
        )}

        {!isLoggedIn && (
          <p className="text-white/40 text-xs mt-4 text-center">
            Don't have HitPost?{" "}
            <a
              href="#"
              className="text-blue-400 underline"
            >
              Get it on the App Store
            </a>
          </p>
        )}

        {/* Code display for manual entry */}
        <div className="mt-8 text-center">
          <p className="text-white/30 text-xs mb-1">Your invite code</p>
          <p className="text-white/60 font-mono text-lg tracking-wider">
            {dump.share_token}
          </p>
        </div>
      </div>
    </div>
  );
}
