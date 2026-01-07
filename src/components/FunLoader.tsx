"use client";

import { useState, useEffect } from "react";

const LOADING_MESSAGES = [
  "summoning the memes...",
  "consulting the council...",
  "loading fire content 🔥",
  "almost there bestie",
  "vibes loading...",
  "preparing chaos",
  "waking up the server 😴",
  "finding the good stuff",
];

const LOADING_EMOJIS = ["🔥", "💀", "😂", "✨", "🎉", "💯", "🚀", "⚡"];

interface FunLoaderProps {
  size?: "sm" | "md" | "lg";
  showMessage?: boolean;
}

export default function FunLoader({ size = "md", showMessage = true }: FunLoaderProps) {
  const [emoji, setEmoji] = useState("🔥");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);

    const interval = setInterval(() => {
      setEmoji(LOADING_EMOJIS[Math.floor(Math.random() * LOADING_EMOJIS.length)]);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const sizes = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} animate-bounce`}>
        {emoji}
      </div>
      {showMessage && (
        <p className="text-sm text-gray-500 animate-pulse">{message}</p>
      )}
    </div>
  );
}
