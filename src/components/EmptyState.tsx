"use client";

import { useState, useEffect } from "react";

interface EmptyStateProps {
  type: "memes" | "activity" | "dumps" | "groups" | "upload";
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Meme-worthy GIFs for empty states
const GIFS = {
  memes: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif", // Cat typing
  activity: "https://media.giphy.com/media/tXL4FHPSnVJ0A/giphy.gif", // Waiting skeleton
  dumps: "https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif", // Throw paper
  groups: "https://media.giphy.com/media/evB90wPnh5LxG3XU5o/giphy.gif", // Friends
  upload: "https://media.giphy.com/media/JWF7fOo3XyLgA/giphy.gif", // Upload
};

// Fun copy for meme culture
const TAGLINES = {
  memes: ["your meme folder is emptier than my will to live 💀", "no memes? couldn't be me fr fr", "this is giving... nothing 😭"],
  activity: ["it's quiet... too quiet 👀", "your notifs are drier than the sahara", "nobody's reacted yet bestie"],
  dumps: ["you haven't blessed anyone with memes yet", "your friends are waiting... probably", "time to spread the chaos 🔥"],
  groups: ["no squad assembled yet", "lone wolf energy rn", "time to build your meme council"],
  upload: ["the void awaits your memes", "feed me content pls", "drag and drop that fire 🔥"],
};

function MemeIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background shapes */}
      <rect x="30" y="20" width="60" height="60" rx="8" className="fill-blue-100 dark:fill-blue-900/30" transform="rotate(-6 30 20)" />
      <rect x="110" y="30" width="60" height="60" rx="8" className="fill-purple-100 dark:fill-purple-900/30" transform="rotate(6 110 30)" />
      <rect x="70" y="60" width="70" height="70" rx="8" className="fill-gray-100 dark:fill-gray-800" />

      {/* Main image frame */}
      <rect x="70" y="60" width="70" height="70" rx="8" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="2" strokeDasharray="6 4" />

      {/* Mountain icon */}
      <path d="M85 110L95 95L105 105L115 90L125 110H85Z" className="fill-gray-300 dark:fill-gray-600" />
      <circle cx="115" cy="80" r="6" className="fill-yellow-300 dark:fill-yellow-500/50" />

      {/* Plus icon */}
      <circle cx="105" cy="100" r="16" className="fill-blue-500" />
      <path d="M105 94V106M99 100H111" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

      {/* Sparkles */}
      <path d="M160 60L163 67L170 70L163 73L160 80L157 73L150 70L157 67L160 60Z" className="fill-yellow-400" />
      <path d="M40 90L42 95L47 97L42 99L40 104L38 99L33 97L38 95L40 90Z" className="fill-pink-400" />
    </svg>
  );
}

function ActivityIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Bell */}
      <path d="M100 30C100 30 80 30 80 55V80L70 95H130L120 80V55C120 30 100 30 100 30Z" className="fill-gray-200 dark:fill-gray-700" />
      <circle cx="100" cy="105" r="8" className="fill-gray-200 dark:fill-gray-700" />
      <ellipse cx="100" cy="26" rx="6" ry="4" className="fill-gray-300 dark:fill-gray-600" />

      {/* Notification dots */}
      <circle cx="125" cy="45" r="12" className="fill-blue-500" />
      <text x="125" y="50" textAnchor="middle" className="fill-white text-xs font-bold">3</text>

      {/* Wave lines */}
      <path d="M55 70C55 70 60 65 65 70C70 75 75 70 75 70" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="2" strokeLinecap="round" />
      <path d="M125 70C125 70 130 65 135 70C140 75 145 70 145 70" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="2" strokeLinecap="round" />

      {/* Hearts and reactions */}
      <path d="M45 120C45 115 50 110 55 115C60 110 65 115 65 120C65 130 55 135 55 135C55 135 45 130 45 120Z" className="fill-pink-400" />
      <circle cx="145" cy="125" r="12" className="fill-yellow-100 dark:fill-yellow-900/30" />
      <text x="145" y="130" textAnchor="middle" className="text-lg">😂</text>

      {/* Zzz for sleeping/quiet */}
      <text x="160" y="50" className="fill-gray-400 text-sm font-bold opacity-50">z</text>
      <text x="168" y="40" className="fill-gray-400 text-xs font-bold opacity-40">z</text>
      <text x="174" y="32" className="fill-gray-400 text-[10px] font-bold opacity-30">z</text>
    </svg>
  );
}

function DumpsIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Paper plane */}
      <path d="M40 80L160 40L120 130L100 90L40 80Z" className="fill-blue-100 dark:fill-blue-900/30" />
      <path d="M40 80L160 40L100 90L40 80Z" className="fill-blue-200 dark:fill-blue-800/40" />
      <path d="M100 90L120 130L160 40" className="stroke-blue-400 dark:stroke-blue-500" strokeWidth="2" />

      {/* Trail */}
      <circle cx="35" cy="85" r="3" className="fill-blue-300 dark:fill-blue-600" />
      <circle cx="25" cy="90" r="2" className="fill-blue-200 dark:fill-blue-700" />
      <circle cx="18" cy="93" r="1.5" className="fill-blue-100 dark:fill-blue-800" />

      {/* Destination marker */}
      <circle cx="150" cy="110" r="15" className="fill-green-100 dark:fill-green-900/30" />
      <path d="M150 100V115M150 120V122" className="stroke-green-500" strokeWidth="3" strokeLinecap="round" />

      {/* Sparkles */}
      <path d="M170 60L173 67L180 70L173 73L170 80L167 73L160 70L167 67L170 60Z" className="fill-yellow-400" />
    </svg>
  );
}

function GroupsIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* People circles */}
      <circle cx="70" cy="70" r="25" className="fill-purple-100 dark:fill-purple-900/30" />
      <circle cx="70" cy="60" r="12" className="fill-purple-200 dark:fill-purple-800/40" />
      <path d="M50 95C50 82 58 75 70 75C82 75 90 82 90 95" className="fill-purple-200 dark:fill-purple-800/40" />

      <circle cx="130" cy="70" r="25" className="fill-blue-100 dark:fill-blue-900/30" />
      <circle cx="130" cy="60" r="12" className="fill-blue-200 dark:fill-blue-800/40" />
      <path d="M110 95C110 82 118 75 130 75C142 75 150 82 150 95" className="fill-blue-200 dark:fill-blue-800/40" />

      <circle cx="100" cy="110" r="25" className="fill-green-100 dark:fill-green-900/30" />
      <circle cx="100" cy="100" r="12" className="fill-green-200 dark:fill-green-800/40" />
      <path d="M80 135C80 122 88 115 100 115C112 115 120 122 120 135" className="fill-green-200 dark:fill-green-800/40" />

      {/* Connection lines */}
      <path d="M85 80L115 80" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="2" strokeDasharray="4 2" />
      <path d="M78 90L92 105" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="2" strokeDasharray="4 2" />
      <path d="M122 90L108 105" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="2" strokeDasharray="4 2" />

      {/* Plus */}
      <circle cx="160" cy="130" r="12" className="fill-blue-500" />
      <path d="M160 124V136M154 130H166" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UploadIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Cloud */}
      <path d="M60 100C45 100 35 90 35 75C35 60 50 50 65 55C70 40 85 30 105 35C125 40 135 55 135 70C150 70 165 80 165 95C165 110 150 120 130 120H60C45 120 35 110 35 100" className="fill-gray-100 dark:fill-gray-800" />

      {/* Arrow up */}
      <path d="M100 60V100" className="stroke-blue-500" strokeWidth="4" strokeLinecap="round" />
      <path d="M85 75L100 60L115 75" className="stroke-blue-500" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

      {/* File icons floating */}
      <rect x="45" y="45" width="20" height="25" rx="2" className="fill-purple-200 dark:fill-purple-800/40" transform="rotate(-10 45 45)" />
      <rect x="140" y="40" width="20" height="25" rx="2" className="fill-green-200 dark:fill-green-800/40" transform="rotate(10 140 40)" />

      {/* Sparkles */}
      <path d="M170 30L173 37L180 40L173 43L170 50L167 43L160 40L167 37L170 30Z" className="fill-yellow-400" />
      <path d="M30 60L32 65L37 67L32 69L30 74L28 69L23 67L28 65L30 60Z" className="fill-pink-400" />
    </svg>
  );
}

export default function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const [showGif, setShowGif] = useState(false);
  const [tagline, setTagline] = useState("");

  useEffect(() => {
    // Pick a random tagline
    const lines = TAGLINES[type];
    setTagline(lines[Math.floor(Math.random() * lines.length)]);
  }, [type]);

  const illustrations = {
    memes: MemeIllustration,
    activity: ActivityIllustration,
    dumps: DumpsIllustration,
    groups: GroupsIllustration,
    upload: UploadIllustration,
  };

  const Illustration = illustrations[type];
  const gifUrl = GIFS[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Toggle between illustration and GIF */}
      <button
        onClick={() => setShowGif(!showGif)}
        className="w-48 h-40 mb-4 rounded-2xl overflow-hidden transition-transform hover:scale-105 active:scale-95"
      >
        {showGif ? (
          <img
            src={gifUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full animate-float">
            <Illustration />
          </div>
        )}
      </button>

      {/* Tap hint */}
      <p className="text-xs text-gray-400 mb-4">
        {showGif ? "tap for illustration" : "tap for gif 👆"}
      </p>

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
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
