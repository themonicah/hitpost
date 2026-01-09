"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClaimCodeButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ name: string; memeCount: number } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClaim() {
    if (!code.trim()) {
      setError("Enter a code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimCode: code.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code");
        setLoading(false);
        return;
      }

      setSuccess({
        name: data.recipient?.name || "Friend",
        memeCount: data.dump?.memeCount || 0,
      });

      // Refresh after a moment
      setTimeout(() => {
        setIsOpen(false);
        setCode("");
        setSuccess(null);
        router.refresh();
      }, 2000);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Got a code? Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl shadow-sm hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="font-semibold">Got a code?</p>
            <p className="text-sm text-white/80">Enter it to claim your dump</p>
          </div>
        </div>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (!loading) {
                setIsOpen(false);
                setCode("");
                setError("");
                setSuccess(null);
              }
            }}
          />

          {/* Modal content */}
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-6 animate-scaleIn">
            {success ? (
              // Success state
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Claimed!</h3>
                <p className="text-gray-500">
                  You got {success.memeCount} meme{success.memeCount !== 1 ? "s" : ""} from {success.name}
                </p>
              </div>
            ) : (
              // Input state
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-1">Enter your code</h3>
                  <p className="text-sm text-gray-500">
                    Enter the code from the link you received
                  </p>
                </div>

                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError("");
                  }}
                  placeholder="VIBE42"
                  maxLength={10}
                  autoFocus
                  className="w-full text-center text-2xl font-mono font-bold tracking-widest px-4 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 uppercase"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleClaim();
                    }
                  }}
                />

                {error && (
                  <p className="text-red-500 text-sm text-center mt-2">{error}</p>
                )}

                <button
                  onClick={handleClaim}
                  disabled={loading || !code.trim()}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Claiming..." : "Claim Dump"}
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    setCode("");
                    setError("");
                  }}
                  className="w-full mt-2 py-3 text-gray-500 font-medium"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
