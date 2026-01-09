"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface EmptyStateProps {
  type: "memes" | "activity" | "dumps" | "groups" | "upload";
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Fun copy for meme culture
const TAGLINES = {
  memes: ["your meme folder is emptier than my will to live", "no memes? couldn't be me fr fr", "this is giving... nothing"],
  activity: ["it's quiet... too quiet", "your notifs are drier than the sahara", "nobody's reacted yet bestie"],
  dumps: ["you haven't blessed anyone with memes yet", "your friends are waiting... probably", "time to spread the chaos"],
  groups: ["no squad assembled yet", "lone wolf energy rn", "time to build your meme council"],
  upload: ["the void awaits your memes", "feed me content pls", "drag and drop that fire"],
};

// Map type to illustration file
const ILLUSTRATIONS = {
  memes: "/illustrations/empty-memes.svg",
  activity: "/illustrations/empty-activity.svg",
  dumps: "/illustrations/empty-dumps.svg",
  groups: "/illustrations/empty-dumps.svg", // Reuse dumps illustration
  upload: "/illustrations/empty-memes.svg", // Reuse memes illustration
};

export default function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const [tagline, setTagline] = useState("");

  useEffect(() => {
    // Pick a random tagline
    const lines = TAGLINES[type];
    setTagline(lines[Math.floor(Math.random() * lines.length)]);
  }, [type]);

  const illustrationSrc = ILLUSTRATIONS[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Illustration */}
      <div className="w-48 h-48 mb-6 animate-float">
        <Image
          src={illustrationSrc}
          alt=""
          width={192}
          height={192}
          className="w-full h-full"
          priority
        />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      {/* Fun tagline */}
      <p className="text-gray-400 text-sm italic mb-2">
        {tagline}
      </p>

      <p className="text-gray-500 text-sm max-w-xs mb-6">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-sunny hover:bg-sunny-dark text-gray-900 rounded-full font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-sunny/30 min-h-[48px]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
