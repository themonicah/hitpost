"use client";

import { useEffect, useState } from "react";

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const PARTY_EMOJIS = ["🎉", "🎊", "🥳", "🎈", "🎁", "✨", "💫", "🌟", "🔥", "💯", "🙌", "🎆", "🎇"];

export default function KonamiCode() {
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [partyMode, setPartyMode] = useState(false);
  const [emojis, setEmojis] = useState<{ id: number; emoji: string; x: number; delay: number }[]>([]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      setKeySequence((prev) => {
        const newSequence = [...prev, e.key].slice(-KONAMI_CODE.length);

        // Check if sequence matches
        if (newSequence.join(",") === KONAMI_CODE.join(",")) {
          triggerPartyMode();
          return [];
        }

        return newSequence;
      });
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function triggerPartyMode() {
    setPartyMode(true);

    // Create emoji rain
    const newEmojis = [];
    for (let i = 0; i < 30; i++) {
      newEmojis.push({
        id: i,
        emoji: PARTY_EMOJIS[Math.floor(Math.random() * PARTY_EMOJIS.length)],
        x: Math.random() * 100,
        delay: Math.random() * 1,
      });
    }
    setEmojis(newEmojis);

    // End party mode after 3 seconds
    setTimeout(() => {
      setPartyMode(false);
      setEmojis([]);
    }, 3000);
  }

  if (!partyMode) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {/* Rainbow overlay */}
      <div className="absolute inset-0 animate-rainbow opacity-20 bg-gradient-to-br from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500" />

      {/* Party text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-4xl font-bold animate-tada">🎮 PARTY MODE! 🎮</p>
      </div>

      {/* Falling emojis */}
      {emojis.map((item) => (
        <div
          key={item.id}
          className="confetti-particle text-3xl"
          style={{
            left: `${item.x}%`,
            top: -40,
            animationDelay: `${item.delay}s`,
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
}
