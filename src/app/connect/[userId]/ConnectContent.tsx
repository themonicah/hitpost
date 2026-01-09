"use client";

import { useState, useEffect } from "react";

interface ConnectContentProps {
  userId: string;
  userName: string;
}

export default function ConnectContent({ userId, userName }: ConnectContentProps) {
  const [name, setName] = useState("");
  const [step, setStep] = useState<"name" | "success">("name");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try deep link on mount (for users with app installed)
  useEffect(() => {
    // Attempt to open the app via deep link
    const deepLink = `hitpost://connect/${userId}`;
    const timeout = setTimeout(() => {
      // If we're still here after 1.5s, app probably isn't installed
      // Do nothing, let user continue on web
    }, 1500);

    // Try opening the deep link
    window.location.href = deepLink;

    return () => clearTimeout(timeout);
  }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorId: userId,
          name: name.trim(),
        }),
      });

      if (res.ok) {
        setStep("success");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to connect");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sunny/10 via-white to-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          {/* Success icon */}
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center animate-scaleIn">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              You&apos;re connected!
            </h1>
            <p className="text-gray-600">
              {userName} can now send you meme dumps directly.
            </p>
          </div>

          {/* App download prompt */}
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sunny to-peachy flex items-center justify-center">
              <span className="text-3xl">📱</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">
                Get the app for the full experience
              </h2>
              <p className="text-sm text-gray-500">
                Get notified instantly when {userName} sends you memes
              </p>
            </div>
            <a
              href="https://apps.apple.com/app/hitpost"
              className="block w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-center rounded-2xl transition-colors"
            >
              Download HitPost
            </a>
          </div>

          <p className="text-xs text-gray-400">
            Your connection will sync automatically when you install
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sunny/10 via-white to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-electric to-lavender flex items-center justify-center shadow-lg">
            <span className="text-4xl font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Connect with {userName}
          </h1>
          <p className="text-gray-600">
            Enter your name so {userName} can send you meme dumps
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
              className="w-full px-4 py-4 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-lg"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-2xl disabled:bg-gray-200 disabled:text-gray-400 transition-colors min-h-[56px]"
          >
            {saving ? "Connecting..." : "Connect"}
          </button>
        </form>

        {/* Already have the app? */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Already have HitPost?{" "}
            <a
              href={`hitpost://connect/${userId}`}
              className="text-gray-900 font-medium underline"
            >
              Open in app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
