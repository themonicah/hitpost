"use client";

import { useState, useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 300);
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 flex flex-col items-center justify-center transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Animated turd logo */}
      <div className="relative animate-bounce">
        <span className="text-8xl drop-shadow-2xl">💩</span>
        {/* Shine effect */}
        <div className="absolute -top-2 -right-2 text-3xl animate-pulse">✨</div>
      </div>

      {/* App name */}
      <h1 className="mt-6 text-4xl font-black text-white tracking-tight drop-shadow-lg">
        HitPost
      </h1>
      <p className="mt-2 text-amber-200 text-sm font-medium">
        send the good sh*t
      </p>

      {/* Loading dots */}
      <div className="mt-8 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-white/60 rounded-full animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
