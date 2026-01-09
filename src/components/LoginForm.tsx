"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const LOADING_MESSAGES = [
  "entering the meme dimension...",
  "loading your chaos...",
  "summoning the vibes...",
  "unlocking the vault...",
];

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error("Login failed");
      }

      router.push("/library");
      router.refresh();
    } catch {
      setError("login machine broke. try again bestie");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Sign in form">
      <div>
        <label htmlFor="email-input" className="sr-only">
          Email address
        </label>
        <input
          id="email-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="drop your email here"
          required
          aria-describedby={error ? "login-error" : undefined}
          aria-invalid={!!error}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg min-h-[48px]"
          disabled={loading}
        />
      </div>

      {error && (
        <p id="login-error" role="alert" className="text-red-500 text-sm text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !email}
        aria-busy={loading}
        className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-lg min-h-[48px]"
      >
        {loading ? loadingMsg : "let me in"}
      </button>
    </form>
  );
}
